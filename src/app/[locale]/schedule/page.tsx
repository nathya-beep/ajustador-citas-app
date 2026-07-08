"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getDictionary, isValidLocale, defaultLocale } from "@/lib/i18n";

export default function SchedulePage() {
  const params = useParams<{ locale: string }>();
  const locale = isValidLocale(params.locale) ? params.locale : defaultLocale;
  const t = getDictionary(locale);

  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "" });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!date) return;
    fetch(`/api/availability?date=${date}`)
      .then((res) => res.json())
      .then((data) => setSlots(data.slots ?? []));
  }, [date]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedSlot) return;

    setStatus("submitting");
    const response = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, language: locale, startsAt: selectedSlot }),
    });

    if (response.ok) {
      setStatus("success");
    } else {
      const data = await response.json();
      setErrorMessage(data.error ?? "Unknown error");
      setStatus("error");
    }
  }

  if (status === "success") {
    return <p>{locale === "en" ? "Your appointment is confirmed!" : "¡Tu cita está confirmada!"}</p>;
  }

  return (
    <main>
      <h1>{t.scheduleCta}</h1>
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <ul>
        {slots.map((slot) => (
          <li key={slot}>
            <button type="button" onClick={() => setSelectedSlot(slot)}>
              {new Date(slot).toLocaleTimeString(locale === "en" ? "en-US" : "es-ES", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </button>
          </li>
        ))}
      </ul>

      {selectedSlot && (
        <form onSubmit={handleSubmit}>
          <input
            required
            placeholder={locale === "en" ? "First name" : "Nombre"}
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
          />
          <input
            required
            placeholder={locale === "en" ? "Last name" : "Apellido"}
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
          />
          <input
            required
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            required
            placeholder={locale === "en" ? "Phone" : "Teléfono"}
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <button type="submit" disabled={status === "submitting"}>
            {t.scheduleCta}
          </button>
          {status === "error" && <p role="alert">{errorMessage}</p>}
        </form>
      )}
    </main>
  );
}
