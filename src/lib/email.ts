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
