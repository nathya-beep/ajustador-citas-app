import { Resend } from "resend";
import nodemailer from "nodemailer";

/**
 * Capa de envío de correo con dos transportes intercambiables:
 *
 *  1. SMTP (nodemailer) — funciona con proveedores GRATUITOS y sin dominio propio
 *     (SendGrid single-sender, Brevo, Gmail con contraseña de aplicación, etc.).
 *     Se activa si defines SMTP_HOST, SMTP_USER y SMTP_PASS.
 *  2. Resend — se usa si defines RESEND_API_KEY (requiere dominio verificado).
 *
 * Si no hay ninguno configurado, no se envía nada (comportamiento previo) y se
 * devuelve { success: false } sin lanzar errores, para que el flujo de citas
 * nunca falle por el correo.
 */

const FROM_ADDRESS = process.env.EMAIL_FROM || "citas@tudominio.com";

let smtpTransport: nodemailer.Transporter | null = null;
function getSmtpTransport(): nodemailer.Transporter | null {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }
  if (!smtpTransport) {
    smtpTransport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true", // true para 465, false para 587/STARTTLS
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return smtpTransport;
}

function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

/** Envío genérico: SMTP primero, luego Resend, luego no-op. Nunca lanza. */
async function deliver(to: string, subject: string, text: string): Promise<{ success: boolean }> {
  const smtp = getSmtpTransport();
  if (smtp) {
    try {
      await smtp.sendMail({ from: FROM_ADDRESS, to, subject, text });
      return { success: true };
    } catch (error) {
      console.error("SMTP email failed", error);
      return { success: false };
    }
  }

  const resend = getResendClient();
  if (resend) {
    try {
      await resend.emails.send({ from: FROM_ADDRESS, to, subject, text });
      return { success: true };
    } catch (error) {
      console.error("Resend email failed", error);
      return { success: false };
    }
  }

  console.warn("No email transport configured (SMTP_* or RESEND_API_KEY); skipping email");
  return { success: false };
}

type ConfirmationEmailParams = {
  to: string;
  language: "en" | "es";
  leadFirstName: string;
  startsAt: Date;
  cancelUrl: string;
};

const CONFIRMATION_SUBJECT = {
  en: "Your inspection appointment is confirmed",
  es: "Tu cita de inspección está confirmada",
};

function formatConfirmationBody(params: ConfirmationEmailParams): string {
  const formattedDate = params.startsAt.toLocaleString(
    params.language === "en" ? "en-US" : "es-ES",
    { dateStyle: "full", timeStyle: "short" }
  );

  if (params.language === "en") {
    return `Hi ${params.leadFirstName},\n\nYour inspection appointment is confirmed for ${formattedDate}.\n\nNeed to cancel or reschedule? ${params.cancelUrl}\n\nThanks!`;
  }

  return `Hola ${params.leadFirstName},\n\nTu cita de inspección está confirmada para el ${formattedDate}.\n\n¿Necesitas cancelar o reprogramar? ${params.cancelUrl}\n\n¡Gracias!`;
}

export async function sendConfirmationEmail(
  params: ConfirmationEmailParams
): Promise<{ success: boolean }> {
  return deliver(params.to, CONFIRMATION_SUBJECT[params.language], formatConfirmationBody(params));
}

type ReminderEmailParams = {
  to: string;
  language: "en" | "es";
  leadFirstName: string;
  startsAt: Date;
  cancelUrl: string;
};

const REMINDER_SUBJECT = {
  en: "Reminder: your inspection appointment is tomorrow",
  es: "Recordatorio: tu cita de inspección es mañana",
};

function formatReminderBody(params: ReminderEmailParams): string {
  const formattedDate = params.startsAt.toLocaleString(
    params.language === "en" ? "en-US" : "es-ES",
    { dateStyle: "full", timeStyle: "short" }
  );

  if (params.language === "en") {
    return `Hi ${params.leadFirstName},\n\nThis is a reminder that your inspection appointment is on ${formattedDate}.\n\nNeed to cancel or reschedule? ${params.cancelUrl}\n\nSee you soon!`;
  }

  return `Hola ${params.leadFirstName},\n\nEste es un recordatorio de que tu cita de inspección es el ${formattedDate}.\n\n¿Necesitas cancelar o reprogramar? ${params.cancelUrl}\n\n¡Nos vemos pronto!`;
}

export async function sendReminderEmail(
  params: ReminderEmailParams
): Promise<{ success: boolean }> {
  return deliver(params.to, REMINDER_SUBJECT[params.language], formatReminderBody(params));
}

type FollowUpEmailParams = {
  to: string;
  language: "en" | "es";
  leadFirstName: string;
};

const FOLLOW_UP_SUBJECT = {
  en: "Thanks for your inspection",
  es: "Gracias por tu inspección",
};

function formatFollowUpBody(params: FollowUpEmailParams): string {
  if (params.language === "en") {
    return `Hi ${params.leadFirstName},\n\nThank you for completing your inspection with us. If you have any questions about next steps, just reply to this email.\n\nBest regards.`;
  }

  return `Hola ${params.leadFirstName},\n\nGracias por completar tu inspección con nosotros. Si tienes preguntas sobre los siguientes pasos, responde este correo.\n\nSaludos.`;
}

export async function sendFollowUpEmail(
  params: FollowUpEmailParams
): Promise<{ success: boolean }> {
  return deliver(params.to, FOLLOW_UP_SUBJECT[params.language], formatFollowUpBody(params));
}
