import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth";

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

  const appointment = await prisma.appointment.update({
    where: { id: params.id },
    data: { status: status as (typeof VALID_STATUSES)[number] },
  });

  return NextResponse.json({ appointment });
}
