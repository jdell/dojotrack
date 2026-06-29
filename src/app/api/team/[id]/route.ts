import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isDbConfigured } from "@/lib/db";
import { getCurrentClub } from "@/lib/queries";
import { requireAuth } from "@/lib/auth-context";
import type { Role } from "@prisma/client";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * PATCH /api/team/[id] — change a team member's role.
 *
 * Rules:
 * - Only OWNER can promote to/from OWNER.
 * - OWNER and ADMIN can change other roles.
 * - INSTRUCTOR, STUDENT, and PARENT cannot change roles.
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

  // Only OWNER and ADMIN can change roles.
  if (auth.user.role !== "OWNER" && auth.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Only owners and admins can change roles." },
      { status: 403 },
    );
  }

  let body: { role?: string; bio?: string; qualifications?: string; photoUrl?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  // Ensure the target user belongs to this club.
  const target = await prisma.user.findFirst({
    where: { id, clubId: club.id },
    select: { id: true, role: true },
  });
  if (!target) {
    return NextResponse.json(
      { error: "Team member not found." },
      { status: 404 },
    );
  }

  const data: Record<string, unknown> = {};

  if (body.role !== undefined) {
    const newRole = body.role as Role;
    if (!["OWNER", "ADMIN", "INSTRUCTOR", "STUDENT", "PARENT"].includes(newRole)) {
      return NextResponse.json(
        { error: "Invalid role." },
        { status: 400 },
      );
    }

    // Only OWNER can assign/revoke OWNER role.
    if (
      (newRole === "OWNER" || target.role === "OWNER") &&
      auth.user.role !== "OWNER"
    ) {
      return NextResponse.json(
        { error: "Only the owner can change to or from the Owner role." },
        { status: 403 },
      );
    }

    // Prevent self-demotion from OWNER (at least one OWNER must remain).
    if (target.id === auth.user.id && target.role === "OWNER" && newRole !== "OWNER") {
      const ownerCount = await prisma.user.count({
        where: { clubId: club.id, role: "OWNER" },
      });
      if (ownerCount <= 1) {
        return NextResponse.json(
          { error: "Cannot remove the last owner. Assign another owner first." },
          { status: 400 },
        );
      }
    }

    data.role = newRole;
  }

  if (body.bio !== undefined) data.bio = body.bio || null;
  if (body.qualifications !== undefined) data.qualifications = body.qualifications || null;
  if (body.photoUrl !== undefined) data.photoUrl = body.photoUrl || null;

  try {
    const updated = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        bio: true,
        qualifications: true,
        photoUrl: true,
        createdAt: true,
      },
    });
    return NextResponse.json({
      member: { ...updated, createdAt: updated.createdAt.toISOString() },
    });
  } catch (err) {
    console.error("PATCH /api/team/[id] failed", err);
    return NextResponse.json(
      { error: "Could not update the team member." },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/team/[id] — remove a team member from the club.
 *
 * Only OWNER can remove other OWNER/ADMIN. ADMIN can remove INSTRUCTOR/STUDENT.
 * Nobody can remove themselves if they are the last OWNER.
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

  // Only OWNER and ADMIN can remove members.
  if (auth.user.role !== "OWNER" && auth.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Only owners and admins can remove team members." },
      { status: 403 },
    );
  }

  const target = await prisma.user.findFirst({
    where: { id, clubId: club.id },
    select: { id: true, role: true },
  });
  if (!target) {
    return NextResponse.json(
      { error: "Team member not found." },
      { status: 404 },
    );
  }

  // ADMIN cannot remove OWNER or other ADMINs.
  if (
    auth.user.role === "ADMIN" &&
    (target.role === "OWNER" || target.role === "ADMIN")
  ) {
    return NextResponse.json(
      { error: "Admins cannot remove owners or other admins." },
      { status: 403 },
    );
  }

  // Cannot remove the last OWNER.
  if (target.role === "OWNER") {
    const ownerCount = await prisma.user.count({
      where: { clubId: club.id, role: "OWNER" },
    });
    if (ownerCount <= 1) {
      return NextResponse.json(
        { error: "Cannot remove the last owner." },
        { status: 400 },
      );
    }
  }

  try {
    // Unlink the user from the club (set clubId to null, reset role).
    await prisma.user.update({
      where: { id },
      data: { clubId: null, role: "STUDENT" },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/team/[id] failed", err);
    return NextResponse.json(
      { error: "Could not remove the team member." },
      { status: 500 },
    );
  }
}
