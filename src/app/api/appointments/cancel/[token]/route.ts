import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ACTIVE_APPOINTMENT_STATUSES } from "@/lib/booking";

export async function POST(request: NextRequest, { params }: { params: { token: string } }) {
  const appointment = await prisma.appointment.findUnique({ where: { cancelToken: params.token } });
  if (!appointment) {
    return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  }

  // Only pending/confirmed appointments may be cancelled. Without this guard the
  // public, non-expiring cancel token could flip a completed/cancelled/rescheduled
  // appointment back to "cancelled", corrupting its state.
  if (!(ACTIVE_APPOINTMENT_STATUSES as readonly string[]).includes(appointment.status)) {
    return NextResponse.json(
      { error: "This appointment can no longer be cancelled" },
      { status: 409 }
    );
  }

  const updated = await prisma.appointment.update({
    where: { id: appointment.id },
    data: { status: "cancelled" },
  });

  return NextResponse.json({ appointment: updated });
}
