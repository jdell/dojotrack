import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isDbConfigured } from "@/lib/db";
import { getAuthUser } from "@/lib/auth-context";
import { routing } from "@/i18n/routing";

/**
 * POST /api/auth/register — provision a club + owner for a freshly verified user.
 *
 * Called by the registration page right after the Supabase phone-OTP step
 * succeeds: at that point the Supabase auth user exists, but the DojoTrack
 * `Club`/`User` rows don't. We read the verified user from the session (so this
 * can't be called anonymously — that's why `/api/auth/*` is exempt from the
 * `requireAuth` guard, which would 401 before these rows exist) and create:
 *
 *   - a `Club` row (slug derived from the name, de-duplicated), and
 *   - a `User` row with role OWNER, linked to the Supabase auth id and the club.
 *
 * Idempotent: if the user already has a club, we return it instead of creating
 * a second one.
 */

interface RegisterBody {
  clubName?: string;
  phone?: string;
  ownerName?: string;
  martialArt?: string;
  /** UI locale the owner registered in — used for the club's emails. */
  locale?: string;
}

/** Turn a club name into a URL-safe, reasonably short slug. */
function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip combining accent marks
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return base || "club";
}

/** Find a slug that isn't taken yet, appending -2, -3, … as needed. */
async function uniqueSlug(name: string): Promise<string> {
  const base = slugify(name);
  let candidate = base;
  let n = 2;
  // Loop until we hit a free slug. Bounded in practice by the number of clubs
  // that happen to share a base slug.
  while (await prisma.club.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    candidate = `${base}-${n}`;
    n += 1;
  }
  return candidate;
}

export async function POST(request: Request) {
  if (!isDbConfigured()) {
    return NextResponse.json(
      { error: "The database isn't configured yet." },
      { status: 503 },
    );
  }

  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Already registered? Return the existing club rather than creating another.
  const existing = await prisma.user.findUnique({
    where: { authId: authUser.id },
    include: { club: true },
  });
  if (existing?.club) {
    return NextResponse.json({ club: existing.club, user: existing });
  }

  let body: RegisterBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const clubName = body.clubName?.trim();
  const ownerName = body.ownerName?.trim();
  if (!clubName) {
    return NextResponse.json(
      { error: "A club name is required." },
      { status: 400 },
    );
  }
  if (!ownerName) {
    return NextResponse.json(
      { error: "Your name is required." },
      { status: 400 },
    );
  }

  const martialArt = body.martialArt?.trim() || null;
  const phone = body.phone?.trim() || authUser.phone || null;

  // Remember the language the owner registered in so their club's emails match.
  const locale =
    body.locale && (routing.locales as readonly string[]).includes(body.locale)
      ? body.locale
      : routing.defaultLocale;

  try {
    const slug = await uniqueSlug(clubName);
    const result = await prisma.$transaction(async (tx) => {
      const club = await tx.club.create({
        data: {
          name: clubName,
          slug,
          phone,
          disciplines: martialArt ? [martialArt] : [],
          beltSystemId: martialArt,
          locale,
        },
      });
      // Upsert handles the edge case of a User row that exists without a club.
      const user = await tx.user.upsert({
        where: { authId: authUser.id },
        update: {
          clubId: club.id,
          role: "OWNER",
          fullName: ownerName,
          phone,
        },
        create: {
          authId: authUser.id,
          clubId: club.id,
          role: "OWNER",
          fullName: ownerName,
          phone,
          email: authUser.email ?? null,
        },
      });
      return { club, user };
    });

    return NextResponse.json(
      { club: result.club, user: result.user },
      { status: 201 },
    );
  } catch (err) {
    console.error("POST /api/auth/register failed", err);
    return NextResponse.json(
      { error: "Could not create your club. Please try again." },
      { status: 500 },
    );
  }
}
