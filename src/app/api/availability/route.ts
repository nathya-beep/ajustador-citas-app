import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computeAvailableSlots, WeeklyAvailability } from "@/lib/availability";
import { ACTIVE_APPOINTMENT_STATUSES } from "@/lib/booking";

export async function GET(request: NextRequest) {
  const dateParam = request.nextUrl.searchParams.get("date");
  if (!dateParam) {
    return NextResponse.json({ error: "Missing date parameter" }, { status: 400 });
  }

  const date = new Date(`${dateParam}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return NextResponse.json({ error: "Invalid date parameter" }, { status: 400 });
  }

  const adjuster = await prisma.adjuster.findFirst();
  if (!adjuster) {
    return NextResponse.json({ error: "Adjuster not configured" }, { status: 500 });
  }

  const dayStart = new Date(date);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const busyAppointments = await prisma.appointment.findMany({
    where: {
      startsAt: { gte: dayStart, lte: dayEnd },
      status: { in: [...ACTIVE_APPOINTMENT_STATUSES] },
    },
    select: { startsAt: true, endsAt: true },
  });

  const slots = computeAvailableSlots(date, adjuster.availability as WeeklyAvailability, busyAppointments);

  return NextResponse.json({ slots: slots.map((s) => s.toISOString()) });
}
