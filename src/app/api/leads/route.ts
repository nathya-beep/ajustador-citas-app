import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Captación pública desde el formulario "Contáctame" del sitio.
 * Crea (o actualiza) un Lead en etapa "new" para que entre al embudo del ajustador.
 * No agenda cita: el ajustador llamará al cliente.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const language = body.language === "en" ? "en" : "es";

  if (!name || !phone) {
    return NextResponse.json({ error: "Name and phone are required" }, { status: 400 });
  }

  const parts = name.split(/\s+/);
  const firstName = parts.shift() || name;
  const lastName = parts.join(" ");
  const digits = phone.replace(/\D/g, "");
  const finalEmail = email || `lead-${digits || Date.now()}@sinemail.local`;

  try {
    const lead = await prisma.lead.upsert({
      where: { email: finalEmail },
      update: { firstName, lastName, phone, language },
      create: { firstName, lastName, email: finalEmail, phone, language, status: "new" },
    });

    await prisma.followUp.create({
      data: {
        leadId: lead.id,
        result: message
          ? `Solicitud de contacto desde el sitio: ${message}`
          : "Solicitud de contacto desde el sitio (Contáctame)",
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not submit" }, { status: 500 });
  }
}
