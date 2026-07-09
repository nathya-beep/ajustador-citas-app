import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth";
import { sendFollowUpEmail } from "@/lib/email";

// "rescheduled" is intentionally NOT accepted here. Rescheduling isn't implemented
// anywhere in the app (no flow creates a replacement appointment), so accepting it via
// this endpoint would just release the slot and silently drop the customer's booking
// with no replacement and no notification. The AppointmentStatus Prisma enum keeps the
// value for future use; we only restrict what this admin PATCH endpoint will accept.
const VALID_STATUSES = ["pending", "confirmed", "completed", "cancelled"] as const;

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
    // Capture the pre-update status so we only send the follow-up email on the
    // transition INTO "completed", not on every PATCH that repeats status=completed
    // (e.g. a retried request), which would send duplicate follow-up emails.
    const existing = await prisma.appointment.findUnique({
      where: { id: params.id },
      select: { status: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }
    const wasAlreadyCompleted = existing.status === "completed";

    const appointment = await prisma.appointment.update({
      where: { id: params.id },
      data: { status: status as (typeof VALID_STATUSES)[number] },
      include: { lead: true },
    });

    if (status === "completed" && !wasAlreadyCompleted) {
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
