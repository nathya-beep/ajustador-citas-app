import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendReminderEmail } from "@/lib/email";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const windowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);

  const dueAppointments = await prisma.appointment.findMany({
    where: {
      status: { in: ["pending", "confirmed"] },
      startsAt: { gte: windowStart, lte: windowEnd },
      reminderSentAt: null,
    },
    include: { lead: true },
  });

  for (const appointment of dueAppointments) {
    const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${appointment.lead.language}/cancel/${appointment.cancelToken}`;
    await sendReminderEmail({
      to: appointment.lead.email,
      language: appointment.lead.language === "en" ? "en" : "es",
      leadFirstName: appointment.lead.firstName,
      startsAt: appointment.startsAt,
      cancelUrl,
    });
    await prisma.appointment.update({
      where: { id: appointment.id },
      data: { reminderSentAt: new Date() },
    });
  }

  return NextResponse.json({ sent: dueAppointments.length });
}
