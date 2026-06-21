import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isDbConfigured } from "@/lib/db";
import { requireAuth } from "@/lib/auth-context";
import { DISCIPLINES, TIMEZONES } from "@/lib/constants";

const VALID_CURRENCIES = ["eur", "usd", "gbp", "mxn", "cop", "brl", "ars"];

/**
 * PATCH /api/settings — update the authenticated club's profile.
 *
 * Owners/instructors only (any authenticated club member can reach it via
 * requireAuth; the settings UI is owner-facing). Only the fields present in the
 * body are touched; blank strings clear a field. The slug is intentionally NOT
 * editable here — it's a stable public URL.
 */

interface SettingsBody {
  name?: string;
  logoUrl?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  websiteUrl?: string | null;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  youtubeUrl?: string | null;
  martialArt?: string | null;
  timezone?: string | null;
  currency?: string | null;
  childMaxAge?: number | null;
}

/** Trim a string field; empty becomes null (clears it). Undefined = untouched. */
function clean(value: string | null | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export async function PATCH(request: Request) {
  if (!isDbConfigured()) {
    return NextResponse.json(
      { error: "The database isn't configured yet." },
      { status: 503 },
    );
  }
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  let body: SettingsBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // A club name, if provided, can't be blanked.
  const name = body.name?.trim();
  if (body.name !== undefined && !name) {
    return NextResponse.json(
      { error: "Club name can't be empty." },
      { status: 400 },
    );
  }

  // Validate the optional enum-ish fields, ignoring unknown values.
  const martialArt =
    body.martialArt && DISCIPLINES.some((d) => d.value === body.martialArt)
      ? body.martialArt
      : undefined;
  const timezone =
    body.timezone && (TIMEZONES as readonly string[]).includes(body.timezone)
      ? body.timezone
      : body.timezone === null
        ? null
        : undefined;
  const currency =
    body.currency && VALID_CURRENCIES.includes(body.currency.toLowerCase())
      ? body.currency.toLowerCase()
      : undefined;

  // Keep the chosen default discipline present in the club's list of disciplines
  // without dropping any others it already teaches.
  let disciplines: string[] | undefined;
  if (martialArt) {
    disciplines = Array.from(
      new Set([martialArt, ...auth.club.disciplines]),
    );
  }

  try {
    const updated = await prisma.club.update({
      where: { id: auth.club.id },
      data: {
        ...(name !== undefined ? { name } : {}),
        logoUrl: clean(body.logoUrl),
        email: clean(body.email),
        phone: clean(body.phone),
        address: clean(body.address),
        websiteUrl: clean(body.websiteUrl),
        instagramUrl: clean(body.instagramUrl),
        facebookUrl: clean(body.facebookUrl),
        youtubeUrl: clean(body.youtubeUrl),
        ...(martialArt ? { beltSystemId: martialArt } : {}),
        ...(disciplines ? { disciplines } : {}),
        ...(timezone !== undefined ? { timezone } : {}),
        ...(currency !== undefined ? { currency } : {}),
        ...(typeof body.childMaxAge === "number" && body.childMaxAge >= 10 && body.childMaxAge <= 21
          ? { childMaxAge: body.childMaxAge }
          : {}),
      },
    });
    return NextResponse.json({ club: updated });
  } catch (err) {
    console.error("PATCH /api/settings failed", err);
    return NextResponse.json(
      { error: "Could not save your settings." },
      { status: 500 },
    );
  }
}
