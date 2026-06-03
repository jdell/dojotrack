import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isDbConfigured } from "@/lib/db";
import { getCurrentClub } from "@/lib/queries";

/**
 * GET /api/students — list the current club's students (newest first).
 */
export async function GET() {
  if (!isDbConfigured()) {
    return NextResponse.json({ students: [] });
  }
  const club = await getCurrentClub();
  if (!club) {
    return NextResponse.json({ students: [] });
  }
  try {
    const students = await prisma.student.findMany({
      where: { clubId: club.id },
      orderBy: { createdAt: "desc" },
      include: {
        beltRank: { select: { name: true, hexColor: true } },
        family: { select: { id: true, name: true } },
      },
    });
    return NextResponse.json({ students });
  } catch (err) {
    console.error("GET /api/students failed", err);
    return NextResponse.json(
      { error: "Could not load students." },
      { status: 500 },
    );
  }
}

interface CreateStudentBody {
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
}

/**
 * POST /api/students — create a student for the current club. Optionally
 * creates a new family (when `newFamilyName` is given) or attaches to an
 * existing one. The belt rank is validated against the club's ranks and
 * dropped to null if it doesn't belong (e.g. a placeholder belt id).
 */
export async function POST(request: Request) {
  if (!isDbConfigured()) {
    return NextResponse.json(
      { error: "The database isn't configured yet." },
      { status: 503 },
    );
  }

  const club = await getCurrentClub();
  if (!club) {
    return NextResponse.json(
      { error: "No club found. Create a club before adding students." },
      { status: 400 },
    );
  }

  let body: CreateStudentBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const fullName = body.fullName?.trim();
  if (!fullName) {
    return NextResponse.json(
      { error: "A full name is required." },
      { status: 400 },
    );
  }

  try {
    // Resolve the family: create a new one or validate the supplied id.
    let familyId: string | null = null;
    if (body.newFamilyName?.trim()) {
      const family = await prisma.family.create({
        data: { name: body.newFamilyName.trim(), clubId: club.id },
      });
      familyId = family.id;
    } else if (body.familyId) {
      const family = await prisma.family.findFirst({
        where: { id: body.familyId, clubId: club.id },
        select: { id: true },
      });
      familyId = family?.id ?? null;
    }

    // Only keep a belt rank that actually belongs to this club.
    let beltRankId: string | null = null;
    if (body.beltRankId) {
      const rank = await prisma.beltRank.findFirst({
        where: { id: body.beltRankId, clubId: club.id },
        select: { id: true },
      });
      beltRankId = rank?.id ?? null;
    }

    const student = await prisma.student.create({
      data: {
        clubId: club.id,
        fullName,
        phone: body.phone || null,
        email: body.email || null,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
        beltRankId,
        medicalNotes: body.medicalNotes || null,
        emergencyContact: body.emergencyContact || null,
        emergencyPhone: body.emergencyPhone || null,
        familyId,
      },
    });

    return NextResponse.json({ student }, { status: 201 });
  } catch (err) {
    console.error("POST /api/students failed", err);
    return NextResponse.json(
      { error: "Could not create the student." },
      { status: 500 },
    );
  }
}
