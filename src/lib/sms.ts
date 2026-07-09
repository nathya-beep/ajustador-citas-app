/**
 * Envío de SMS / WhatsApp con Twilio (vía API REST, sin SDK).
 *
 * Se activa solo si defines estas variables de entorno:
 *   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN
 *   TWILIO_FROM           -> número emisor SMS en formato E.164, ej. +13055550100
 *   TWILIO_WHATSAPP_FROM  -> emisor WhatsApp, ej. whatsapp:+14155238886 (sandbox)
 *   TWILIO_CHANNEL        -> "sms" (por defecto) o "whatsapp"
 *
 * Si no está configurado, devuelve { success: false } sin lanzar errores, para
 * que el flujo de citas nunca falle por el SMS. Los números destino deben venir
 * en formato E.164 (con código de país, ej. +1...).
 */

type SmsResult = { success: boolean };

export async function sendSms(to: string, body: string): Promise<SmsResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const channel = process.env.TWILIO_CHANNEL === "whatsapp" ? "whatsapp" : "sms";
  const sender = channel === "whatsapp" ? process.env.TWILIO_WHATSAPP_FROM : process.env.TWILIO_FROM;

  if (!sid || !token || !sender) {
    console.warn("Twilio not configured (TWILIO_*); skipping SMS/WhatsApp");
    return { success: false };
  }

  const toAddress = channel === "whatsapp" ? `whatsapp:${to}` : to;
  const params = new URLSearchParams({ To: toAddress, From: sender, Body: body });

  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      }
    );
    if (!res.ok) {
      console.error(`Twilio send failed: ${res.status} ${await res.text()}`);
      return { success: false };
    }
    return { success: true };
  } catch (error) {
    console.error("Twilio request error", error);
    return { success: false };
  }
}

type ConfirmationSmsParams = {
  to: string;
  language: "en" | "es";
  leadFirstName: string;
  startsAt: Date;
};

export async function sendConfirmationSms(params: ConfirmationSmsParams): Promise<SmsResult> {
  const when = params.startsAt.toLocaleString(params.language === "en" ? "en-US" : "es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const body =
    params.language === "en"
      ? `Hi ${params.leadFirstName}, your inspection appointment is confirmed for ${when}.`
      : `Hola ${params.leadFirstName}, tu cita de inspección está confirmada para el ${when}.`;
  return sendSms(params.to, body);
}

type ReminderSmsParams = {
  to: string;
  language: "en" | "es";
  leadFirstName: string;
  startsAt: Date;
};

export async function sendReminderSms(params: ReminderSmsParams): Promise<SmsResult> {
  const when = params.startsAt.toLocaleString(params.language === "en" ? "en-US" : "es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const body =
    params.language === "en"
      ? `Reminder: your inspection appointment is on ${when}. See you soon!`
      : `Recordatorio: tu cita de inspección es el ${when}. ¡Nos vemos pronto!`;
  return sendSms(params.to, body);
}
