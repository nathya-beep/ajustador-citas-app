import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const isAuthenticated = await requireAdminSession(request);
  if (!isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const appointments = await prisma.appointment.findMany({
    include: { lead: true },
    orderBy: { startsAt: "asc" },
  });

  return NextResponse.json({ appointments });
}
