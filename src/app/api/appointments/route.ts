import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAtLeastAdvanceHours, ACTIVE_APPOINTMENT_STATUSES } from "@/lib/booking";
import { SLOT_DURATION_MINUTES } from "@/lib/availability";
import { sendConfirmationEmail } from "@/lib/email";

type CreateAppointmentBody = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  language: "en" | "es";
  startsAt: string;
};

export async function POST(request: NextRequest) {
  const body = (await request.json()) as Partial<CreateAppointmentBody>;

  if (!body.firstName || !body.lastName || !body.email || !body.phone || !body.startsAt || !body.language) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const startsAt = new Date(body.startsAt);
  if (Number.isNaN(startsAt.getTime())) {
    return NextResponse.json({ error: "Invalid startsAt" }, { status: 400 });
  }

  if (!isAtLeastAdvanceHours(startsAt, new Date())) {
    return NextResponse.json(
      { error: "Appointments must be booked at least 24 hours in advance" },
      { status: 422 }
    );
  }

  const endsAt = new Date(startsAt.getTime() + SLOT_DURATION_MINUTES * 60_000);

  try {
    const appointment = await prisma.$transaction(
      async (tx) => {
        const lead = await tx.lead.upsert({
          where: { email: body.email! },
          update: {
            firstName: body.firstName!,
            lastName: body.lastName!,
            phone: body.phone!,
            language: body.language!,
          },
          create: {
            firstName: body.firstName!,
            lastName: body.lastName!,
            email: body.email!,
            phone: body.phone!,
            language: body.language!,
          },
        });

        const activeLeadAppointments = await tx.appointment.findMany({
          where: { leadId: lead.id, status: { in: [...ACTIVE_APPOINTMENT_STATUSES] } },
        });
        if (activeLeadAppointments.length > 0) {
          throw new Error("LEAD_HAS_ACTIVE_APPOINTMENT");
        }

        const overlapping = await tx.appointment.findFirst({
          where: {
            status: { in: [...ACTIVE_APPOINTMENT_STATUSES] },
            startsAt: { lt: endsAt },
            endsAt: { gt: startsAt },
          },
        });
        if (overlapping) {
          throw new Error("SLOT_TAKEN");
        }

        const created = await tx.appointment.create({
          data: { leadId: lead.id, startsAt, endsAt, status: "pending" },
        });

        await tx.lead.update({ where: { id: lead.id }, data: { status: "scheduled" } });

        return created;
      },
      { isolationLevel: "Serializable" }
    );

    const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${body.language}/cancel/${appointment.cancelToken}`;
    await sendConfirmationEmail({
      to: body.email!,
      language: body.language!,
      leadFirstName: body.firstName!,
      startsAt,
      cancelUrl,
    });

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "SLOT_TAKEN") {
      return NextResponse.json({ error: "This time slot is no longer available" }, { status: 409 });
    }
    if (error instanceof Error && error.message === "LEAD_HAS_ACTIVE_APPOINTMENT") {
      return NextResponse.json({ error: "You already have an active appointment" }, { status: 409 });
    }
    console.error("Failed to create appointment", error);
    return NextResponse.json({ error: "Failed to create appointment" }, { status: 500 });
  }
}
