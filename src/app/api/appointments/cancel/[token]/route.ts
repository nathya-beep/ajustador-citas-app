import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest, { params }: { params: { token: string } }) {
  const appointment = await prisma.appointment.findUnique({ where: { cancelToken: params.token } });
  if (!appointment) {
    return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  }

  const updated = await prisma.appointment.update({
    where: { id: appointment.id },
    data: { status: "cancelled" },
  });

  return NextResponse.json({ appointment: updated });
}
