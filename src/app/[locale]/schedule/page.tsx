"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getDictionary, isValidLocale, defaultLocale } from "@/lib/i18n";
import { brand } from "@/lib/brand";

export default function SchedulePage() {
  const params = useParams<{ locale: string }>();
  const locale = isValidLocale(params.locale) ? params.locale : defaultLocale;
  const t = getDictionary(locale);

  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "" });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [availabilityError, setAvailabilityError] = useState("");

  // fecha mínima: mañana (regla de 24 h)
  const minDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  })();

  useEffect(() => {
    if (!date) return;
    setAvailabilityError("");
    setSelectedSlot(null);
    setLoadingSlots(true);
    fetch(`/api/availability?date=${date}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setSlots([]);
          setAvailabilityError(data.error ?? t.schedNoSlots);
          return;
        }
        setSlots(data.slots ?? []);
      })
      .catch(() => {
        setSlots([]);
        setAvailabilityError(t.schedNoSlots);
      })
      .finally(() => setLoadingSlots(false));
  }, [date, locale, t.schedNoSlots]);

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
    return (
      <div className="sched-success">
        <div className="big">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
        </div>
        <h1>{t.schedSuccessTitle}</h1>
        <p>{t.schedSuccessBody}</p>
        <Link className="btn btn-ink" href={`/${locale}`}>{t.schedBack}</Link>
      </div>
    );
  }

  return (
    <>
      <div className="sched-hero">
        <div className="wrap">
          <Link href={`/${locale}`} style={{ color: "#a9b7c6", fontSize: 14 }}>{t.schedBack}</Link>
          <h1>{t.schedTitle}</h1>
          <p>{t.schedSubtitle}</p>
        </div>
      </div>

      <div className="wrap">
        <div className="sched-card">
          {/* Paso 1: fecha */}
          <div className="sched-block">
            <div className="sblabel">{t.schedStep1}</div>
            <div className="field">
              <label htmlFor="sched-date">{t.schedPickDate}</label>
              <input id="sched-date" type="date" min={minDate} value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>

          {/* Paso 2: hora */}
          {date && (
            <div className="sched-block">
              <div className="sblabel">{t.schedStep2}</div>
              {loadingSlots ? (
                <p className="muted">{t.schedLoading}</p>
              ) : availabilityError ? (
                <p className="alert-err" role="alert">{availabilityError}</p>
              ) : slots.length === 0 ? (
                <p className="muted">{t.schedNoSlots}</p>
              ) : (
                <ul className="slots">
                  {slots.map((slot) => (
                    <li key={slot}>
                      <button
                        type="button"
                        className={selectedSlot === slot ? "on" : ""}
                        onClick={() => setSelectedSlot(slot)}
                      >
                        {new Date(slot).toLocaleTimeString(locale === "en" ? "en-US" : "es-ES", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Paso 3: datos */}
          {selectedSlot && (
            <form onSubmit={handleSubmit} className="sched-block" style={{ marginBottom: 0 }}>
              <div className="sblabel">{t.schedStep3}</div>
              <div className="grid2">
                <div className="field">
                  <label>{t.schedFirstName}</label>
                  <input required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
                </div>
                <div className="field">
                  <label>{t.schedLastName}</label>
                  <input required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
                </div>
              </div>
              <div className="grid2">
                <div className="field">
                  <label>{t.schedEmail}</label>
                  <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="field">
                  <label>{t.schedPhone}</label>
                  <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary btn-block" disabled={status === "submitting"}>
                {status === "submitting" ? t.schedSubmitting : t.schedConfirm}
              </button>
              {status === "error" && <p className="alert-err" role="alert" style={{ marginTop: 10 }}>{errorMessage}</p>}
              <div className="resp-note" style={{ marginTop: 12 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                <span>{t.schedResponseNote}</span>
              </div>
            </form>
          )}
        </div>
      </div>

      <footer>
        <div className="wrap foot-in">
          <div className="logo" style={{ color: "#fff" }}>
            <span className="badge">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></svg>
            </span> {brand.name}
          </div>
          <a href={`tel:${brand.phoneHref}`} style={{ fontSize: 16, fontWeight: 700 }}>{brand.phone}</a>
        </div>
      </footer>
    </>
  );
}
