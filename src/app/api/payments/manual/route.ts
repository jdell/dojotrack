import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isDbConfigured } from "@/lib/db";
import { requireAuth } from "@/lib/auth-context";

const VALID_METHODS = ["cash", "bank_transfer", "bizum", "other"] as const;

interface ManualPaymentBody {
  studentId: string;
  planId?: string | null;
  amount: number;
  currency?: string;
  description?: string;
  paymentMethod: string;
  paidAt?: string;
}

/**
 * POST /api/payments/manual — Record a manual (offline) payment.
 *
 * Creates a Payment with status PAID and the specified method. When a `planId`
 * is given and the student already has a membership for that plan, the
 * membership status is set to ACTIVE.
 */
export async function POST(request: Request) {
  if (!isDbConfigured()) {
    return NextResponse.json(
      { error: "The database isn't configured yet." },
      { status: 503 },
    );
  }

  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { club, user } = auth;

  let body: ManualPaymentBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  if (!body.studentId || !body.amount || !body.paymentMethod) {
    return NextResponse.json(
      { error: "studentId, amount, and paymentMethod are required." },
      { status: 400 },
    );
  }

  if (
    !(VALID_METHODS as readonly string[]).includes(body.paymentMethod)
  ) {
    return NextResponse.json(
      { error: `Invalid payment method. Must be one of: ${VALID_METHODS.join(", ")}` },
      { status: 400 },
    );
  }

  if (typeof body.amount !== "number" || body.amount <= 0) {
    return NextResponse.json(
      { error: "Amount must be a positive number." },
      { status: 400 },
    );
  }

  // Verify student belongs to the club.
  const student = await prisma.student.findFirst({
    where: { id: body.studentId, clubId: club.id },
    select: { id: true, fullName: true },
  });
  if (!student) {
    return NextResponse.json(
      { error: "Student not found." },
      { status: 404 },
    );
  }

  // Optionally verify plan.
  let planName: string | null = null;
  if (body.planId) {
    const plan = await prisma.paymentPlan.findFirst({
      where: { id: body.planId, clubId: club.id },
      select: { id: true, name: true },
    });
    if (!plan) {
      return NextResponse.json(
        { error: "Plan not found." },
        { status: 404 },
      );
    }
    planName = plan.name;
  }

  const paidAt = body.paidAt ? new Date(body.paidAt) : new Date();
  const description =
    body.description ||
    (planName
      ? `${planName} — ${student.fullName}`
      : `Manual payment — ${student.fullName}`);

  try {
    const payment = await prisma.payment.create({
      data: {
        clubId: club.id,
        studentId: student.id,
        planId: body.planId ?? null,
        amount: body.amount.toFixed(2),
        currency: body.currency ?? club.currency ?? "eur",
        status: "PAID",
        description,
        paymentMethod: body.paymentMethod,
        recordedById: user.id,
        paidAt,
      },
    });

    // If a plan was specified and the student has a membership for it, activate.
    if (body.planId) {
      await prisma.membership.updateMany({
        where: {
          clubId: club.id,
          studentId: student.id,
          planId: body.planId,
          status: { in: ["INCOMPLETE", "PAST_DUE"] },
        },
        data: { status: "ACTIVE" },
      });
    }

    return NextResponse.json({ id: payment.id }, { status: 201 });
  } catch (err) {
    console.error("POST /api/payments/manual failed", err);
    return NextResponse.json(
      { error: "Could not record payment." },
      { status: 500 },
    );
  }
}
