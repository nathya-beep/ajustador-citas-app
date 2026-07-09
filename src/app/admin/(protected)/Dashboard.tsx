"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Appointment = { id: string; startsAt: string; status: string };
type FollowUp = { attemptedAt: string; result: string };
export type Lead = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  language: string;
  status: string;
  createdAt: string;
  appointments: Appointment[];
  followUps: FollowUp[];
};

type Stage = "nuevo" | "contactado" | "agendada" | "inspeccion" | "noresp" | "nointeres";

const STAGES: Record<Stage, { label: string; cls: string; ico: string }> = {
  nuevo: { label: "Nuevo", cls: "st-nuevo", ico: "🆕" },
  contactado: { label: "Contactado", cls: "st-contactado", ico: "📞" },
  agendada: { label: "Cita agendada", cls: "st-agendada", ico: "📅" },
  inspeccion: { label: "Inspección hecha", cls: "st-inspeccion", ico: "✅" },
  noresp: { label: "No responde", cls: "st-noresp", ico: "⏳" },
  nointeres: { label: "No interesado", cls: "st-nointeres", ico: "🚫" },
};
const PIPE_ORDER: Stage[] = ["nuevo", "contactado", "agendada", "inspeccion", "noresp", "nointeres"];
const FUNNEL: Stage[] = ["nuevo", "contactado", "agendada", "inspeccion"];

// Mapa etapa visual -> Lead.status del backend (para los botones)
const STAGE_TO_STATUS: Record<string, string> = {
  nuevo: "new",
  contactado: "contacted",
  noresp: "no_response",
  nointeres: "not_interested",
};

function activeAppt(l: Lead): Appointment | undefined {
  return l.appointments.find((a) => a.status === "pending" || a.status === "confirmed");
}
function stageOf(l: Lead): Stage {
  if (l.appointments.some((a) => a.status === "completed")) return "inspeccion";
  if (activeAppt(l)) return "agendada"; // "agendada" = tiene una cita activa real
  switch (l.status) {
    case "no_response": return "noresp";
    case "not_interested": return "nointeres";
    case "contacted": return "contactado";
    // "scheduled" sin cita activa (p. ej. cancelada) vuelve a contactado para re-agendar
    case "scheduled": return "contactado";
    default: return "nuevo";
  }
}

function isoLocal(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function daysFromToday(d: Date) {
  const a = new Date(); a.setHours(0, 0, 0, 0);
  const b = new Date(d); b.setHours(0, 0, 0, 0);
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}
const nameOf = (l: Lead) => `${l.firstName} ${l.lastName}`.trim();
const fmtDate = (d: Date) => d.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
const fmtTime = (d: Date) => d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

export function Dashboard({ leads }: { leads: Lead[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<"resumen" | "pipeline" | "calendario" | "recordatorios" | "prospectos">("resumen");
  const [calRef, setCalRef] = useState(() => new Date());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Mini-agendador dentro del modal (Contactado -> Agendada desde el panel)
  const [sched, setSched] = useState(false);
  const [schedDate, setSchedDate] = useState("");
  const [schedSlots, setSchedSlots] = useState<string[]>([]);
  const [schedLoading, setSchedLoading] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [nf, setNf] = useState({ firstName: "", lastName: "", phone: "", email: "", language: "es" });
  useEffect(() => { setSched(false); setSchedDate(""); setErr(""); setNote(""); }, [selectedId]);
  useEffect(() => {
    if (!sched || !schedDate) { setSchedSlots([]); return; }
    setSchedLoading(true);
    fetch(`/api/availability?date=${schedDate}`)
      .then((r) => r.json())
      .then((d) => setSchedSlots(d.slots ?? []))
      .catch(() => setSchedSlots([]))
      .finally(() => setSchedLoading(false));
  }, [sched, schedDate]);

  const selected = leads.find((l) => l.id === selectedId) ?? null;

  async function call(url: string, method: string, body?: object) {
    setBusy(true); setErr("");
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) {
        let msg = "No se pudo completar la acción.";
        try { const j = await res.json(); if (j?.error) msg = j.error; } catch {}
        setErr(msg); return false;
      }
      router.refresh();
      return true;
    } catch {
      setErr("No se pudo conectar."); return false;
    } finally {
      setBusy(false);
    }
  }
  async function bookForLead(l: Lead, startsAt: string) {
    const ok = await call("/api/appointments", "POST", {
      firstName: l.firstName, lastName: l.lastName, email: l.email, phone: l.phone,
      language: l.language === "en" ? "en" : "es", startsAt,
    });
    if (ok) { setSched(false); setSchedDate(""); setSchedSlots([]); }
  }
  const setStage = (leadId: string, status: string) => call(`/api/admin/leads/${leadId}`, "PATCH", { status });
  const apptAction = (apptId: string, status: string) => call(`/api/appointments/${apptId}`, "PATCH", { status });
  async function addNote(leadId: string) {
    const text = note.trim(); if (!text) return;
    const ok = await call(`/api/admin/leads/${leadId}/followups`, "POST", { result: text });
    if (ok) setNote("");
  }
  async function createLead() {
    if (!nf.firstName.trim() || !nf.phone.trim()) { setErr("Nombre y teléfono son obligatorios"); return; }
    const ok = await call("/api/admin/leads", "POST", nf);
    if (ok) { setNewOpen(false); setNf({ firstName: "", lastName: "", phone: "", email: "", language: "es" }); }
  }
  async function deleteLead(leadId: string) {
    if (!window.confirm("¿Eliminar este prospecto y sus citas? Esta acción no se puede deshacer.")) return;
    const ok = await call(`/api/admin/leads/${leadId}`, "DELETE");
    if (ok) setSelectedId(null);
  }

  if (!mounted) {
    return <div className="admin-empty" style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: "var(--radio)" }}>Cargando panel…</div>;
  }

  const withStage = leads.map((l) => ({ l, stage: stageOf(l) }));
  const inStage = (s: Stage) => withStage.filter((x) => x.stage === s).map((x) => x.l);
  const total = leads.length;
  const countStage = (s: Stage) => inStage(s).length;
  const conv = total ? Math.round((countStage("inspeccion") / total) * 100) : 0;

  // Todas las citas (para calendario y próximas)
  const allAppts = leads.flatMap((l) => l.appointments.map((a) => ({ ...a, lead: l })));

  // ---- Recordatorios ----
  const rem: { tone: string; ico: string; title: string; text: string; lead: Lead; order: number }[] = [];
  for (const l of leads) {
    const st = stageOf(l);
    const ap = activeAppt(l);
    if (ap) {
      const d = new Date(ap.startsAt); const diff = daysFromToday(d);
      if (diff < 0) rem.push({ tone: "r-red", ico: "⚠️", order: 0, lead: l, title: "Cita vencida sin actualizar", text: `${nameOf(l)} · ${fmtDate(d)}. Marca inspección hecha o cancela.` });
      else if (diff === 0) rem.push({ tone: "r-blue", ico: "📅", order: 1, lead: l, title: "Inspección HOY", text: `${nameOf(l)} · ${fmtTime(d)} · 📞 ${l.phone}` });
      else if (diff === 1) rem.push({ tone: "r-amber", ico: "🔔", order: 2, lead: l, title: "Cita mañana", text: `${nameOf(l)} · ${fmtDate(d)} ${fmtTime(d)}. Envía recordatorio.` });
    }
    if (st === "nuevo" && -daysFromToday(new Date(l.createdAt)) >= 2) {
      rem.push({ tone: "r-amber", ico: "📞", order: 3, lead: l, title: "Prospecto sin contactar", text: `${nameOf(l)} · captado hace ${-daysFromToday(new Date(l.createdAt))} días. Haz el primer contacto.` });
    }
    if (st === "contactado") {
      const last = l.followUps.length ? new Date(l.followUps[l.followUps.length - 1].attemptedAt) : new Date(l.createdAt);
      if (-daysFromToday(last) >= 3) rem.push({ tone: "r-amber", ico: "⏳", order: 4, lead: l, title: "Sin respuesta hace días", text: `${nameOf(l)} · da seguimiento o marca "No responde".` });
    }
    if (st === "noresp") rem.push({ tone: "r-red", ico: "🔁", order: 5, lead: l, title: "Reintentar contacto", text: `${nameOf(l)} · 📞 ${l.phone} · último intento antes de descartar.` });
  }
  rem.sort((a, b) => a.order - b.order);

  // ---- Calendario ----
  const y = calRef.getFullYear(); const m = calRef.getMonth();
  const dows = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  let ini = new Date(y, m, 1).getDay(); ini = ini === 0 ? 6 : ini - 1;
  const diasMes = new Date(y, m + 1, 0).getDate();
  const hoy = isoLocal(new Date());
  const cells: { d: Date; out: boolean }[] = [];
  for (let i = 0; i < ini; i++) cells.push({ d: new Date(y, m, -(ini - i - 1)), out: true });
  for (let i = 1; i <= diasMes; i++) cells.push({ d: new Date(y, m, i), out: false });
  while (cells.length % 7 !== 0) { const last = cells[cells.length - 1].d; cells.push({ d: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1), out: true }); }

  return (
    <>
      {/* KPIs */}
      <div className="admin-kpis">
        <div className="admin-kpi k1"><div className="lbl">Prospectos</div><div className="val">{total}</div></div>
        <div className="admin-kpi k2"><div className="lbl">Citas agendadas</div><div className="val">{countStage("agendada")}</div></div>
        <div className="admin-kpi k3"><div className="lbl">Inspecciones hechas</div><div className="val">{countStage("inspeccion")}</div></div>
        <div className="admin-kpi k4"><div className="lbl">Conversión</div><div className="val">{conv}%</div></div>
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 22 }}>
        <div className="panel-tabs" style={{ marginBottom: 0 }}>
          <button className={tab === "resumen" ? "on" : ""} onClick={() => setTab("resumen")}>📊 Resumen</button>
          <button className={tab === "pipeline" ? "on" : ""} onClick={() => setTab("pipeline")}>🔀 Embudo</button>
          <button className={tab === "calendario" ? "on" : ""} onClick={() => setTab("calendario")}>📆 Calendario</button>
          <button className={tab === "recordatorios" ? "on" : ""} onClick={() => setTab("recordatorios")}>🔔 Recordatorios{rem.length ? ` (${rem.length})` : ""}</button>
          <button className={tab === "prospectos" ? "on" : ""} onClick={() => setTab("prospectos")}>🗂️ Prospectos</button>
        </div>
        <button className="btn btn-primary btn-sm" style={{ marginLeft: "auto" }} onClick={() => setNewOpen(true)}>＋ Nuevo prospecto</button>
      </div>

      {err && <p className="alert-err" role="alert" style={{ marginBottom: 16 }}>{err}</p>}

      {/* RESUMEN */}
      {tab === "resumen" && (
        <>
          <div className="admin-block">
            <h3 className="card-h3">Embudo de conversión</h3>
            <p className="card-sub">Cuántos prospectos hay en cada etapa.</p>
            {total === 0 ? <div className="admin-empty">Aún no hay prospectos.</div> : (
              <>
                {FUNNEL.map((s) => {
                  const n = countStage(s); const pct = Math.round((n / total) * 100);
                  return (
                    <div className="funnel-row" key={s}>
                      <div className="funnel-top">
                        <span className={`st ${STAGES[s].cls}`}>{STAGES[s].ico} {STAGES[s].label}</span>
                        <b>{n} <span className="muted">({pct}%)</span></b>
                      </div>
                      <div className="funnel-bar"><div className="funnel-fill" style={{ width: `${pct}%` }} /></div>
                    </div>
                  );
                })}
                <p className="muted" style={{ marginTop: 10 }}>⏳ No responde: <b>{countStage("noresp")}</b> · 🚫 No interesado: <b>{countStage("nointeres")}</b></p>
              </>
            )}
          </div>

          <div className="admin-block">
            <h3 className="card-h3">Próximas inspecciones</h3>
            <p className="card-sub">Citas activas más cercanas.</p>
            {(() => {
              const prox = allAppts
                .filter((a) => (a.status === "pending" || a.status === "confirmed") && daysFromToday(new Date(a.startsAt)) >= 0)
                .sort((a, b) => a.startsAt.localeCompare(b.startsAt)).slice(0, 6);
              if (!prox.length) return <div className="admin-empty">No hay citas próximas.</div>;
              return prox.map((a) => {
                const d = new Date(a.startsAt); const diff = daysFromToday(d);
                const when = diff === 0 ? "Hoy" : diff === 1 ? "Mañana" : `En ${diff} días`;
                return (
                  <div className="rmd r-blue" key={a.id} style={{ cursor: "pointer" }} onClick={() => setSelectedId(a.lead.id)}>
                    <div className="ic">📅</div>
                    <div className="tx"><b>{nameOf(a.lead)}</b>{fmtDate(d)} {fmtTime(d)} — <b>{when}</b> · 📞 {a.lead.phone}</div>
                  </div>
                );
              });
            })()}
          </div>
        </>
      )}

      {/* EMBUDO (pipeline 6 etapas) */}
      {tab === "pipeline" && (
        <div className="admin-block">
          <h3 className="card-h3">Embudo de prospectos</h3>
          <p className="card-sub">Haz clic en un prospecto para ver detalle, avanzar de etapa y dar seguimiento.</p>
          <div className="pipeline-6">
            {PIPE_ORDER.map((s) => {
              const items = inStage(s);
              return (
                <div className="pcol" key={s}>
                  <h5>{STAGES[s].ico} {STAGES[s].label} <b>{items.length}</b></h5>
                  {items.length === 0 ? <div className="pcol-empty">—</div> : items.map((l) => {
                    const ap = activeAppt(l);
                    return (
                      <div className="pitem" key={l.id} role="button" tabIndex={0} onClick={() => setSelectedId(l.id)} onKeyDown={(e) => e.key === "Enter" && setSelectedId(l.id)}>
                        <b>{nameOf(l)}</b>
                        <span className="m">{ap ? `📅 ${fmtDate(new Date(ap.startsAt))}` : `📞 ${l.phone}`}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CALENDARIO */}
      {tab === "calendario" && (
        <div className="admin-block">
          <div className="cal-head">
            <button className="btn btn-ghost btn-sm" onClick={() => setCalRef(new Date(y, m - 1, 1))}>←</button>
            <b>{calRef.toLocaleDateString("es-ES", { month: "long", year: "numeric" })}</b>
            <button className="btn btn-ghost btn-sm" onClick={() => setCalRef(new Date(y, m + 1, 1))}>→</button>
          </div>
          <div className="cal-grid">{dows.map((d) => <div className="cal-dow" key={d}>{d}</div>)}</div>
          <div className="cal-grid" style={{ marginTop: 6 }}>
            {cells.map((c, i) => {
              const iso = isoLocal(c.d);
              const evs = allAppts.filter((a) => a.status !== "cancelled" && isoLocal(new Date(a.startsAt)) === iso);
              return (
                <div className={`cal-day ${c.out ? "out" : ""} ${iso === hoy ? "today" : ""}`} key={i}>
                  <div className="dn">{c.d.getDate()}</div>
                  {evs.map((a) => (
                    <div key={a.id} className={`cal-ev ${a.status === "completed" ? "done" : ""}`} title={nameOf(a.lead)} onClick={() => setSelectedId(a.lead.id)}>
                      {fmtTime(new Date(a.startsAt))} {a.lead.firstName}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* RECORDATORIOS */}
      {tab === "recordatorios" && (
        <div className="admin-block">
          <h3 className="card-h3">Centro de recordatorios y seguimiento</h3>
          <p className="card-sub">Acciones sugeridas según etapa y fechas.</p>
          {rem.length === 0 ? (
            <div className="rmd r-green"><div className="ic">✅</div><div className="tx"><b>Todo al día</b>No hay acciones pendientes.</div></div>
          ) : rem.map((r, i) => (
            <div className={`rmd ${r.tone}`} key={i}>
              <div className="ic">{r.ico}</div>
              <div className="tx"><b>{r.title}</b>{r.text}</div>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedId(r.lead.id)}>Gestionar</button>
            </div>
          ))}
        </div>
      )}

      {/* PROSPECTOS (tabla) */}
      {tab === "prospectos" && (
        <div className="admin-card">
          {leads.length === 0 ? <div className="admin-empty">Aún no hay prospectos.</div> : (
            <table className="admin-table">
              <thead><tr><th>Cliente</th><th>Contacto</th><th>Cita</th><th>Etapa</th><th></th></tr></thead>
              <tbody>
                {leads.map((l) => {
                  const s = stageOf(l); const ap = activeAppt(l);
                  return (
                    <tr key={l.id}>
                      <td><b>{nameOf(l)}</b></td>
                      <td className="muted">📞 {l.phone}<br />✉️ {l.email}</td>
                      <td>{ap ? `${fmtDate(new Date(ap.startsAt))} ${fmtTime(new Date(ap.startsAt))}` : "—"}</td>
                      <td><span className={`st ${STAGES[s].cls}`}>{STAGES[s].label}</span></td>
                      <td><button className="btn btn-ghost btn-sm" onClick={() => setSelectedId(l.id)}>Gestionar</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* MODAL NUEVO PROSPECTO */}
      {newOpen && (
        <div className="modal-bg" onClick={(e) => e.target === e.currentTarget && setNewOpen(false)}>
          <div className="modal">
            <div className="modal-h"><h3>Nuevo prospecto</h3><button className="x" onClick={() => setNewOpen(false)}>×</button></div>
            <div className="grid2">
              <div className="field"><label>Nombre</label><input value={nf.firstName} onChange={(e) => setNf({ ...nf, firstName: e.target.value })} /></div>
              <div className="field"><label>Apellido</label><input value={nf.lastName} onChange={(e) => setNf({ ...nf, lastName: e.target.value })} /></div>
            </div>
            <div className="grid2">
              <div className="field"><label>Teléfono</label><input value={nf.phone} onChange={(e) => setNf({ ...nf, phone: e.target.value })} placeholder="+1 305 555 0000" /></div>
              <div className="field"><label>Correo (opcional)</label><input value={nf.email} onChange={(e) => setNf({ ...nf, email: e.target.value })} /></div>
            </div>
            <div className="field"><label>Idioma</label>
              <select value={nf.language} onChange={(e) => setNf({ ...nf, language: e.target.value })} style={{ width: "100%", padding: 12, border: "1.5px solid var(--line)", borderRadius: 10 }}>
                <option value="es">Español</option><option value="en">English</option>
              </select>
            </div>
            {err && <p className="alert-err" role="alert" style={{ marginTop: 8 }}>{err}</p>}
            <button className="btn btn-primary btn-block" style={{ marginTop: 8 }} disabled={busy} onClick={createLead}>Crear prospecto</button>
          </div>
        </div>
      )}

      {/* MODAL DETALLE */}
      {selected && (() => {
        const l = selected; const s = stageOf(l); const ap = activeAppt(l);
        const minD = (() => { const d = new Date(); d.setDate(d.getDate() + 1); return isoLocal(d); })();
        return (
          <div className="modal-bg" onClick={(e) => e.target === e.currentTarget && setSelectedId(null)}>
            <div className="modal">
              <div className="modal-h">
                <h3>{nameOf(l)}</h3>
                <button className="x" onClick={() => setSelectedId(null)}>×</button>
              </div>
              <div className="modal-row"><span>Etapa</span><b><span className={`st ${STAGES[s].cls}`}>{STAGES[s].ico} {STAGES[s].label}</span></b></div>
              <div className="modal-row"><span>Teléfono</span><b>{l.phone}</b></div>
              <div className="modal-row"><span>Correo</span><b>{l.email || "—"}</b></div>
              <div className="modal-row"><span>Idioma</span><b>{l.language}</b></div>
              {ap && <div className="modal-row"><span>Cita</span><b>{fmtDate(new Date(ap.startsAt))} · {fmtTime(new Date(ap.startsAt))} ({ap.status === "pending" ? "pendiente" : "confirmada"})</b></div>}

              {/* Acciones de cita */}
              {ap && (
                <div className="modal-actions">
                  {ap.status === "pending" && <button className="btn btn-ink btn-sm" disabled={busy} onClick={() => apptAction(ap.id, "confirmed")}>Confirmar cita</button>}
                  <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => apptAction(ap.id, "completed")}>Inspección hecha</button>
                  <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => apptAction(ap.id, "cancelled")}>Cancelar cita</button>
                </div>
              )}

              {/* Agendar cita desde el panel (Contactado -> Agendada) */}
              {!ap && s !== "inspeccion" && s !== "nointeres" && (
                <div style={{ marginTop: 4 }}>
                  {!sched ? (
                    <button className="btn btn-primary btn-sm" onClick={() => setSched(true)}>＋ Agendar cita</button>
                  ) : (
                    <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 10, padding: 14, marginTop: 4 }}>
                      <div className="field" style={{ marginBottom: 10 }}>
                        <label>Fecha de la cita</label>
                        <input type="date" min={minD} value={schedDate} onChange={(e) => setSchedDate(e.target.value)} />
                      </div>
                      {schedDate && (schedLoading ? (
                        <p className="muted">Cargando horarios…</p>
                      ) : schedSlots.length === 0 ? (
                        <p className="muted">No hay horarios disponibles ese día.</p>
                      ) : (
                        <ul className="slots">
                          {schedSlots.map((sl) => (
                            <li key={sl}><button type="button" disabled={busy} onClick={() => bookForLead(l, sl)}>{fmtTime(new Date(sl))}</button></li>
                          ))}
                        </ul>
                      ))}
                      <button className="btn btn-ghost btn-sm" style={{ marginTop: 10 }} onClick={() => setSched(false)}>Cerrar</button>
                    </div>
                  )}
                </div>
              )}

              {/* Cambio de etapa del prospecto */}
              <div className="modal-actions">
                {(["contactado", "noresp", "nointeres", "nuevo"] as Stage[]).filter((x) => x !== s && STAGE_TO_STATUS[x]).map((x) => (
                  <button key={x} className="btn btn-ghost btn-sm" disabled={busy} onClick={() => setStage(l.id, STAGE_TO_STATUS[x])}>
                    → {STAGES[x].label}
                  </button>
                ))}
              </div>

              {/* Contacto directo */}
              <div className="modal-actions" style={{ borderTop: "1px solid var(--line)", paddingTop: 14 }}>
                <a className="btn btn-primary btn-sm" href={`tel:${l.phone}`}>📞 Llamar</a>
                <a className="btn btn-ink btn-sm" href={`https://wa.me/${l.phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer">💬 WhatsApp</a>
              </div>

              {/* Historial y notas */}
              <div style={{ marginTop: 16 }}>
                <b className="muted" style={{ fontWeight: 700 }}>Seguimiento</b>
                {l.followUps.length > 0 && (
                  <div className="timeline">
                    {l.followUps.slice().reverse().map((f, i) => (
                      <div className="tl-item" key={i}><div className="tl-t">{fmtDate(new Date(f.attemptedAt))}</div>{f.result}</div>
                    ))}
                  </div>
                )}
                <div className="note-add">
                  <input placeholder="Agregar nota de seguimiento…" value={note} onChange={(e) => setNote(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addNote(l.id)} />
                  <button className="btn btn-ink btn-sm" disabled={busy} onClick={() => addNote(l.id)}>Añadir</button>
                </div>
              </div>

              <div style={{ borderTop: "1px solid var(--line)", marginTop: 16, paddingTop: 14, textAlign: "right" }}>
                <button className="btn btn-ghost btn-sm" style={{ color: "var(--red)", borderColor: "#f3c6c6" }} disabled={busy} onClick={() => deleteLead(l.id)}>🗑️ Eliminar prospecto</button>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}
