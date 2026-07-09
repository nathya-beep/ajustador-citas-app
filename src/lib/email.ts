import { Resend } from "resend";

function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

const FROM_ADDRESS = "citas@tudominio.com";

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
  const resend = getResendClient();
  if (!resend) {
    console.warn("RESEND_API_KEY not set, skipping confirmation email");
    return { success: false };
  }

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: params.to,
      subject: CONFIRMATION_SUBJECT[params.language],
      text: formatConfirmationBody(params),
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send confirmation email", error);
    return { success: false };
  }
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
  const resend = getResendClient();
  if (!resend) {
    console.warn("RESEND_API_KEY not set, skipping reminder email");
    return { success: false };
  }

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: params.to,
      subject: REMINDER_SUBJECT[params.language],
      text: formatReminderBody(params),
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send reminder email", error);
    return { success: false };
  }
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
  const resend = getResendClient();
  if (!resend) {
    console.warn("RESEND_API_KEY not set, skipping follow-up email");
    return { success: false };
  }

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: params.to,
      subject: FOLLOW_UP_SUBJECT[params.language],
      text: formatFollowUpBody(params),
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send follow-up email", error);
    return { success: false };
  }
}
