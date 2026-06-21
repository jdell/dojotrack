import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isDbConfigured } from "@/lib/db";
import { sendOnboardingEmail } from "@/lib/onboarding-emails";

// Map onboarding steps to the number of days after registration
const STEP_SCHEDULE: Record<number, number> = {
  // Step 0 is sent at registration, not by cron
  1: 1, // Day 1
  2: 3, // Day 3
  3: 5, // Day 5
  4: 7, // Day 7
  5: 14, // Day 14
  6: 30, // Day 30
};

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isDbConfigured()) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 },
    );
  }

  const now = new Date();
  let sent = 0;
  let errors = 0;

  // Find clubs that need their next onboarding email
  // Only clubs with onboardingStep < 7 (not finished the sequence)
  const clubs = await prisma.club.findMany({
    where: { onboardingStep: { lt: 7 } },
    include: {
      users: {
        where: { role: "OWNER" },
        select: { email: true, fullName: true },
        take: 1,
      },
    },
  });

  for (const club of clubs) {
    const nextStep = club.onboardingStep + 1;
    // Guard: step 0 is handled at registration
    if (nextStep < 1 || nextStep > 6) continue;

    const daysRequired = STEP_SCHEDULE[nextStep];
    if (daysRequired === undefined) continue;

    // Calculate days since registration
    const daysSinceCreation = Math.floor(
      (now.getTime() - club.createdAt.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysSinceCreation < daysRequired) continue;

    // Find owner email
    const owner = club.users[0];
    const email = club.email || owner?.email;
    if (!email) continue;

    try {
      await sendOnboardingEmail(
        club.id,
        email,
        club.name,
        nextStep,
        club.locale || "en",
      );
      // Update the club's onboarding step
      await prisma.club.update({
        where: { id: club.id },
        data: { onboardingStep: nextStep },
      });
      sent++;
    } catch (err) {
      console.error(
        `[onboarding] failed for club ${club.id} step ${nextStep}`,
        err,
      );
      errors++;
    }
  }

  return NextResponse.json({
    ok: true,
    sent,
    errors,
    checked: clubs.length,
    timestamp: now.toISOString(),
  });
}
