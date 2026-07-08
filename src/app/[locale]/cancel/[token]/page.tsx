"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { isValidLocale, defaultLocale } from "@/lib/i18n";

export default function CancelPage() {
  const params = useParams<{ locale: string; token: string }>();
  const locale = isValidLocale(params.locale) ? params.locale : defaultLocale;
  const [status, setStatus] = useState<"idle" | "cancelling" | "done" | "error">("idle");

  async function handleCancel() {
    setStatus("cancelling");
    const response = await fetch(`/api/appointments/cancel/${params.token}`, { method: "POST" });
    setStatus(response.ok ? "done" : "error");
  }

  if (status === "done") {
    return <p>{locale === "en" ? "Your appointment has been cancelled." : "Tu cita ha sido cancelada."}</p>;
  }

  return (
    <main>
      <p>{locale === "en" ? "Cancel your appointment?" : "¿Cancelar tu cita?"}</p>
      <button onClick={handleCancel} disabled={status === "cancelling"}>
        {locale === "en" ? "Confirm cancellation" : "Confirmar cancelación"}
      </button>
      {status === "error" && (
        <p role="alert">{locale === "en" ? "Something went wrong." : "Algo salió mal."}</p>
      )}
    </main>
  );
}
