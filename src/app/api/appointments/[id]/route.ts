import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth";
import { sendFollowUpEmail } from "@/lib/email";

const VALID_STATUSES = ["pending", "confirmed", "completed", "cancelled", "rescheduled"] as const;

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const isAuthenticated = await requireAdminSession(request);
  if (!isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const status = body.status as string | undefined;

  if (!status || !VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    const appointment = await prisma.appointment.update({
      where: { id: params.id },
      data: { status: status as (typeof VALID_STATUSES)[number] },
      include: { lead: true },
    });

    if (status === "completed") {
      await sendFollowUpEmail({
        to: appointment.lead.email,
        language: appointment.lead.language === "en" ? "en" : "es",
        leadFirstName: appointment.lead.firstName,
      });
    }

    return NextResponse.json({ appointment });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }
    throw error;
  }
}
