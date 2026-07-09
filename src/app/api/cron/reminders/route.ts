import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendReminderEmail } from "@/lib/email";
import { sendReminderSms } from "@/lib/sms";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  // Reject if CRON_SECRET is unset/empty: otherwise the comparison becomes
  // `!== "Bearer undefined"`, which a request literally sending
  // `Authorization: Bearer undefined` would satisfy, silently bypassing auth.
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // This cron runs once per day (Vercel Hobby plan limit), not hourly, so the
  // window must be wide enough that any appointment due "tomorrow" is caught
  // by the single daily run regardless of what time it was booked for.
  const now = new Date();
  const windowStart = new Date(now.getTime() + 12 * 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 36 * 60 * 60 * 1000);

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
    const { success } = await sendReminderEmail({
      to: appointment.lead.email,
      language: appointment.lead.language === "en" ? "en" : "es",
      leadFirstName: appointment.lead.firstName,
      startsAt: appointment.startsAt,
      cancelUrl,
    });
    // Only mark the reminder as sent when the send actually succeeded; otherwise leave
    // reminderSentAt null so the next hourly run retries it. (Note: this does not solve
    // the concurrent-invocation race — two overlapping cron runs could both send — which
    // would need a claim-based updateMany pattern; tracked as a known limitation.)
    if (success) {
      await prisma.appointment.update({
        where: { id: appointment.id },
        data: { reminderSentAt: new Date() },
      });
    } else {
      console.warn(`Reminder email failed for appointment ${appointment.id}; will retry next run`);
    }

    // SMS/WhatsApp de recordatorio (best-effort). No-op si Twilio no está configurado.
    try {
      await sendReminderSms({
        to: appointment.lead.phone,
        language: appointment.lead.language === "en" ? "en" : "es",
        leadFirstName: appointment.lead.firstName,
        startsAt: appointment.startsAt,
      });
    } catch (smsError) {
      console.warn(`Reminder SMS error for appointment ${appointment.id}`, smsError);
    }
  }

  return NextResponse.json({ sent: dueAppointments.length });
}
