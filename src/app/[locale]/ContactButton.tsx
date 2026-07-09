"use client";

import { useState } from "react";
import { getDictionary, type Locale } from "@/lib/i18n";

export function ContactButton({ locale, className, label }: { locale: Locale; className?: string; label?: string }) {
  const t = getDictionary(locale);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [err, setErr] = useState("");

  async function submit() {
    if (!form.name.trim() || !form.phone.trim()) { setErr(t.contactReq); return; }
    setStatus("sending"); setErr("");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, language: locale }),
      });
      if (res.ok) setStatus("ok");
      else { setStatus("error"); setErr(t.contactErr); }
    } catch {
      setStatus("error"); setErr(t.contactErr);
    }
  }

  function close() {
    setOpen(false);
    setTimeout(() => { setStatus("idle"); setForm({ name: "", phone: "", email: "", message: "" }); setErr(""); }, 200);
  }

  return (
    <>
      <button type="button" className={className ?? "btn btn-ink"} onClick={() => setOpen(true)}>
        {label ?? t.contactCta}
      </button>

      {open && (
        <div className="modal-bg" onClick={(e) => e.target === e.currentTarget && close()}>
          <div className="modal">
            <div className="modal-h">
              <h3>{status === "ok" ? t.contactOk : t.contactTitle}</h3>
              <button className="x" onClick={close} aria-label="Cerrar">×</button>
            </div>

            {status === "ok" ? (
              <div style={{ textAlign: "center", padding: "10px 0 6px" }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#e7f6ee", color: "var(--green)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                </div>
                <p className="muted" style={{ marginBottom: 16 }}>{t.contactSub}</p>
                <button className="btn btn-ink btn-sm" onClick={close}>OK</button>
              </div>
            ) : (
              <>
                <p className="muted" style={{ marginTop: -6, marginBottom: 16 }}>{t.contactSub}</p>
                <div className="field"><label>{t.contactName}</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Juan Pérez" /></div>
                <div className="field"><label>{t.contactPhone}</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 305 000 0000" /></div>
                <div className="field"><label>{t.contactEmail}</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                <div className="field"><label>{t.contactMsg}</label><input value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="…" /></div>
                {err && <p className="alert-err" role="alert" style={{ marginBottom: 10 }}>{err}</p>}
                <button className="btn btn-primary btn-block" disabled={status === "sending"} onClick={submit}>
                  {status === "sending" ? t.contactSending : t.contactSubmit}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
