import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth";

const VALID_LEAD_STATUSES = ["new", "contacted", "scheduled", "no_response", "not_interested"] as const;

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const isAuthenticated = await requireAdminSession(request);
  if (!isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const status = body.status as string | undefined;
  if (!status || !VALID_LEAD_STATUSES.includes(status as (typeof VALID_LEAD_STATUSES)[number])) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    const lead = await prisma.lead.update({
      where: { id: params.id },
      data: { status: status as (typeof VALID_LEAD_STATUSES)[number] },
    });
    return NextResponse.json({ lead });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }
    throw error;
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const isAuthenticated = await requireAdminSession(request);
  if (!isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // No hay borrado en cascada en el esquema: eliminamos dependientes primero.
    await prisma.$transaction([
      prisma.followUp.deleteMany({ where: { leadId: params.id } }),
      prisma.appointment.deleteMany({ where: { leadId: params.id } }),
      prisma.lead.delete({ where: { id: params.id } }),
    ]);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }
    throw error;
  }
}
