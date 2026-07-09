import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  // Reject if CRON_SECRET is unset/empty: otherwise the comparison becomes
  // `!== "Bearer undefined"`, which a request literally sending
  // `Authorization: Bearer undefined` would satisfy, silently bypassing auth.
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  const staleAppointments = await prisma.appointment.findMany({
    where: { status: "pending", startsAt: { lt: now } },
  });

  for (const appointment of staleAppointments) {
    await prisma.$transaction([
      prisma.appointment.update({
        where: { id: appointment.id },
        data: { status: "cancelled" },
      }),
      prisma.lead.update({
        where: { id: appointment.leadId },
        data: { status: "no_response" },
      }),
      prisma.followUp.create({
        data: { leadId: appointment.leadId, result: "no_response_auto" },
      }),
    ]);
  }

  return NextResponse.json({ processed: staleAppointments.length });
}
