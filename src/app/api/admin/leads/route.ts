import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const isAuthenticated = await requireAdminSession(request);
  if (!isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const leads = await prisma.lead.findMany({
    include: {
      appointments: { orderBy: { startsAt: "asc" } },
      followUps: { orderBy: { attemptedAt: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ leads });
}

// Crea un prospecto manualmente (entrada del embudo en etapa "Nuevo").
export async function POST(request: NextRequest) {
  const isAuthenticated = await requireAdminSession(request);
  if (!isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const firstName = typeof body.firstName === "string" ? body.firstName.trim() : "";
  const lastName = typeof body.lastName === "string" ? body.lastName.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const language = body.language === "en" ? "en" : "es";

  if (!firstName || !phone) {
    return NextResponse.json({ error: "Nombre y teléfono son obligatorios" }, { status: 400 });
  }

  // El esquema exige email único; si no se proporciona, sintetizamos uno estable.
  const digits = phone.replace(/\D/g, "");
  const finalEmail = email || `lead-${digits || Math.floor(Date.now())}@sinemail.local`;

  try {
    const lead = await prisma.lead.create({
      data: { firstName, lastName, email: finalEmail, phone, language, status: "new" },
    });
    return NextResponse.json({ lead }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Ya existe un prospecto con ese correo" }, { status: 409 });
    }
    throw error;
  }
}
