import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { isAtLeastAdvanceHours, ACTIVE_APPOINTMENT_STATUSES, hasActiveAppointmentConflict } from "@/lib/booking";
import { SLOT_DURATION_MINUTES, computeAvailableSlots, WeeklyAvailability } from "@/lib/availability";
import { sendConfirmationEmail } from "@/lib/email";
import { sendConfirmationSms } from "@/lib/sms";

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

        const adjuster = await tx.adjuster.findFirst();
        if (!adjuster) {
          throw new Error("ADJUSTER_NOT_CONFIGURED");
        }

        // Enforce the adjuster's configured weekly schedule. We pass no busy slots here so this
        // check is purely "is startsAt a valid slot in the schedule?" — slot-already-taken is
        // handled separately below (SLOT_TAKEN -> 409) so it isn't misreported as a 422.
        const dayStart = new Date(startsAt);
        dayStart.setHours(0, 0, 0, 0);

        const scheduleSlots = computeAvailableSlots(
          dayStart,
          adjuster.availability as WeeklyAvailability,
          []
        );
        const isWithinAvailability = scheduleSlots.some(
          (slot) => slot.getTime() === startsAt.getTime()
        );
        if (!isWithinAvailability) {
          throw new Error("SLOT_OUTSIDE_AVAILABILITY");
        }

        const activeLeadAppointments = await tx.appointment.findMany({
          where: { leadId: lead.id, status: { in: [...ACTIVE_APPOINTMENT_STATUSES] } },
          select: { status: true },
        });
        if (hasActiveAppointmentConflict(activeLeadAppointments.map((a) => a.status))) {
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
    // Email is best-effort and sent AFTER the booking transaction has committed. We track
    // delivery in confirmationSentAt but never fail the booking on a send failure — the
    // appointment already exists, so we still return 201.
    const { success } = await sendConfirmationEmail({
      to: body.email!,
      language: body.language!,
      leadFirstName: body.firstName!,
      startsAt,
      cancelUrl,
    });
    if (success) {
      await prisma.appointment.update({
        where: { id: appointment.id },
        data: { confirmationSentAt: new Date() },
      });
    } else {
      console.warn(`Confirmation email not sent for appointment ${appointment.id}`);
    }

    // SMS/WhatsApp de confirmación (best-effort): no bloquea ni afecta la respuesta.
    // No-op si Twilio no está configurado.
    try {
      await sendConfirmationSms({
        to: body.phone!,
        language: body.language!,
        leadFirstName: body.firstName!,
        startsAt,
      });
    } catch (smsError) {
      console.warn(`Confirmation SMS error for appointment ${appointment.id}`, smsError);
    }

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "SLOT_OUTSIDE_AVAILABILITY") {
      return NextResponse.json(
        { error: "This time is outside the adjuster's available hours" },
        { status: 422 }
      );
    }
    if (error instanceof Error && error.message === "ADJUSTER_NOT_CONFIGURED") {
      return NextResponse.json({ error: "Adjuster not configured" }, { status: 500 });
    }
    if (error instanceof Error && error.message === "SLOT_TAKEN") {
      return NextResponse.json({ error: "This time slot is no longer available" }, { status: 409 });
    }
    if (error instanceof Error && error.message === "LEAD_HAS_ACTIVE_APPOINTMENT") {
      return NextResponse.json({ error: "You already have an active appointment" }, { status: 409 });
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2002" || error.code === "P2034")
    ) {
      return NextResponse.json({ error: "This time slot is no longer available" }, { status: 409 });
    }
    console.error("Failed to create appointment", error);
    return NextResponse.json({ error: "Failed to create appointment" }, { status: 500 });
  }
}
