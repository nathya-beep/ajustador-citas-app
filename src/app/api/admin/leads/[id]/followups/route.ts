import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const isAuthenticated = await requireAdminSession(request);
  if (!isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const result = typeof body.result === "string" ? body.result.trim() : "";
  if (!result) {
    return NextResponse.json({ error: "Note is required" }, { status: 400 });
  }

  try {
    const followUp = await prisma.followUp.create({
      data: { leadId: params.id, result },
    });
    return NextResponse.json({ followUp }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }
    throw error;
  }
}
