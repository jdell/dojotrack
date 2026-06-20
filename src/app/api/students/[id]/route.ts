import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isDbConfigured } from "@/lib/db";
import { getCurrentClub } from "@/lib/queries";
import { requireAuth } from "@/lib/auth-context";

type RouteContext = { params: Promise<{ id: string }> };

/** GET /api/students/[id] — a single student, scoped to the current club. */
export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  if (!isDbConfigured()) {
    return NextResponse.json(
      { error: "The database isn't configured yet." },
      { status: 503 },
    );
  }
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const student = await prisma.student.findFirst({
      where: { id, clubId: auth.club.id },
      include: {
        beltRank: { select: { name: true, hexColor: true } },
        family: { select: { id: true, name: true } },
      },
    });
    if (!student) {
      return NextResponse.json(
        { error: "Student not found." },
        { status: 404 },
      );
    }
    return NextResponse.json({ student });
  } catch (err) {
    console.error("GET /api/students/[id] failed", err);
    return NextResponse.json(
      { error: "Could not load the student." },
      { status: 500 },
    );
  }
}

interface UpdateStudentBody {
  fullName?: string;
  phone?: string | null;
  email?: string | null;
  dateOfBirth?: string | null;
  beltRankId?: string | null;
  medicalNotes?: string | null;
  emergencyContact?: string | null;
  emergencyPhone?: string | null;
  familyId?: string | null;
  newFamilyName?: string | null;
  weight?: number | string | null;
  active?: boolean;
}

/**
 * PATCH /api/students/[id] — update a student. Only the fields supplied in the
 * body change. The belt rank and family are validated against the club and
 * dropped/ignored if they don't belong to it; `newFamilyName` creates and
 * attaches a fresh family, mirroring POST /api/students.
 */
export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params;
  if (!isDbConfigured()) {
    return NextResponse.json(
      { error: "The database isn't configured yet." },
      { status: 503 },
    );
  }
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const club = await getCurrentClub();
  if (!club) {
    return NextResponse.json({ error: "No club found." }, { status: 400 });
  }

  const existing = await prisma.student.findFirst({
    where: { id, clubId: club.id },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Student not found." }, { status: 404 });
  }

  let body: UpdateStudentBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const data: Prisma.StudentUpdateInput = {};

  if (body.fullName !== undefined) {
    const fullName = body.fullName.trim();
    if (!fullName) {
      return NextResponse.json(
        { error: "A full name is required." },
        { status: 400 },
      );
    }
    data.fullName = fullName;
  }
  if (body.phone !== undefined) data.phone = body.phone?.trim() || null;
  if (body.email !== undefined) data.email = body.email?.trim() || null;
  if (body.dateOfBirth !== undefined) {
    data.dateOfBirth = body.dateOfBirth ? new Date(body.dateOfBirth) : null;
  }
  if (body.medicalNotes !== undefined) {
    data.medicalNotes = body.medicalNotes?.trim() || null;
  }
  if (body.emergencyContact !== undefined) {
    data.emergencyContact = body.emergencyContact?.trim() || null;
  }
  if (body.emergencyPhone !== undefined) {
    data.emergencyPhone = body.emergencyPhone?.trim() || null;
  }
  if (body.weight !== undefined) {
    if (body.weight === null || body.weight === "") {
      data.weight = null;
    } else {
      const weight = Number(body.weight);
      if (!Number.isInteger(weight) || weight < 0) {
        return NextResponse.json(
          { error: "Invalid weight." },
          { status: 400 },
        );
      }
      data.weight = weight;
    }
  }
  if (body.active !== undefined) data.active = Boolean(body.active);

  // Belt rank: only keep one that belongs to this club, else clear it.
  if (body.beltRankId !== undefined) {
    let beltRankId: string | null = null;
    if (body.beltRankId) {
      const rank = await prisma.beltRank.findFirst({
        where: { id: body.beltRankId, clubId: club.id },
        select: { id: true },
      });
      beltRankId = rank?.id ?? null;
    }
    data.beltRank = beltRankId
      ? { connect: { id: beltRankId } }
      : { disconnect: true };
  }

  // Family: create a new one, attach an existing club family, or detach.
  if (body.newFamilyName?.trim()) {
    const family = await prisma.family.create({
      data: { name: body.newFamilyName.trim(), clubId: club.id },
    });
    data.family = { connect: { id: family.id } };
  } else if (body.familyId !== undefined) {
    let familyId: string | null = null;
    if (body.familyId) {
      const family = await prisma.family.findFirst({
        where: { id: body.familyId, clubId: club.id },
        select: { id: true },
      });
      familyId = family?.id ?? null;
    }
    data.family = familyId
      ? { connect: { id: familyId } }
      : { disconnect: true };
  }

  try {
    const student = await prisma.student.update({ where: { id }, data });
    return NextResponse.json({ student });
  } catch (err) {
    console.error("PATCH /api/students/[id] failed", err);
    return NextResponse.json(
      { error: "Could not update the student." },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/students/[id] — permanently delete a student and all related
 * records. Refuses if the student has active/trialing memberships or pending
 * payments.
 */
export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  if (!isDbConfigured()) {
    return NextResponse.json(
      { error: "The database isn't configured yet." },
      { status: 503 },
    );
  }
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  const club = await getCurrentClub();
  if (!club) {
    return NextResponse.json({ error: "No club found." }, { status: 400 });
  }

  const student = await prisma.student.findFirst({
    where: { id, clubId: club.id },
    select: {
      id: true,
      memberships: {
        where: { status: { in: ["ACTIVE", "TRIALING"] } },
        select: { id: true },
        take: 1,
      },
      payments: {
        where: { status: "PENDING" },
        select: { id: true },
        take: 1,
      },
    },
  });

  if (!student) {
    return NextResponse.json({ error: "Student not found." }, { status: 404 });
  }

  if (student.memberships.length > 0 || student.payments.length > 0) {
    return NextResponse.json(
      {
        error:
          "Cannot delete a student with active memberships. Deactivate them first.",
      },
      { status: 409 },
    );
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Delete children in FK-safe order
      await tx.sparringPair.deleteMany({ where: { studentAId: id } });
      await tx.sparringPair.deleteMany({ where: { studentBId: id } });
      await tx.competitionEntry.deleteMany({ where: { studentId: id } });
      await tx.payment.deleteMany({ where: { studentId: id } });
      await tx.membership.deleteMany({ where: { studentId: id } });
      await tx.booking.deleteMany({ where: { studentId: id } });
      await tx.attendance.deleteMany({ where: { studentId: id } });
      await tx.studentTechniqueLog.deleteMany({ where: { studentId: id } });
      await tx.gradingCandidate.deleteMany({ where: { studentId: id } });
      // Finally, the student itself
      await tx.student.delete({ where: { id } });
    });

    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error("DELETE /api/students/[id] failed", err);
    return NextResponse.json(
      { error: "Could not delete the student." },
      { status: 500 },
    );
  }
}
