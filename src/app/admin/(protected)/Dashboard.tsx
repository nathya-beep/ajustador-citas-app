"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type Appt = {
  id: string;
  startsAt: string; // ISO
  status: string;
  notes: string | null;
  lead: { firstName: string; lastName: string; email: string; phone: string; language: string };
};

const STATUS = {
  pending: { label: "Pendiente", cls: "status-pending", ico: "🕓" },
  confirmed: { label: "Confirmada", cls: "status-confirmed", ico: "📅" },
  completed: { label: "Completada", cls: "status-completed", ico: "✅" },
  cancelled: { label: "Cancelada", cls: "status-cancelled", ico: "🚫" },
  rescheduled: { label: "Reprogramada", cls: "status-no_response", ico: "🔁" },
} as const;

type Status = keyof typeof STATUS;
const meta = (s: string) => STATUS[s as Status] ?? { label: s, cls: "status-pending", ico: "•" };

function isoLocal(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function daysFromToday(d: Date) {
  const a = new Date();
  a.setHours(0, 0, 0, 0);
  const b = new Date(d);
  b.setHours(0, 0, 0, 0);
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}
const fullName = (a: Appt) => `${a.lead.firstName} ${a.lead.lastName}`.trim();
const fmtDate = (d: Date) => d.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
const fmtTime = (d: Date) => d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

export function Dashboard({ appointments }: { appointments: Appt[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<"resumen" | "pipeline" | "calendario" | "recordatorios" | "citas">("resumen");
  const [calRef, setCalRef] = useState(() => new Date());
  const [selected, setSelected] = useState<Appt | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState("");

  async function update(id: string, status: string) {
    setBusy(id);
    setErr("");
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        setErr("No se pudo actualizar la cita.");
        return;
      }
      setSelected(null);
      router.refresh();
    } catch {
      setErr("No se pudo conectar.");
    } finally {
      setBusy(null);
    }
  }

  const total = appointments.length;
  const count = (s: string) => appointments.filter((a) => a.status === s).length;
  const funnelStages: Status[] = ["pending", "confirmed", "completed"];

  // ---- Recordatorios derivados ----
  const reminders: { tone: string; ico: string; title: string; text: string; appt: Appt; order: number }[] = [];
  for (const a of appointments) {
    const d = new Date(a.startsAt);
    const diff = daysFromToday(d);
    if ((a.status === "pending" || a.status === "confirmed") && diff < 0) {
      reminders.push({ tone: "r-red", ico: "⚠️", order: 0, appt: a, title: "Cita vencida sin actualizar", text: `${fullName(a)} · ${fmtDate(d)}. Márcala como completada o cancelada.` });
    } else if ((a.status === "pending" || a.status === "confirmed") && diff === 0) {
      reminders.push({ tone: "r-blue", ico: "📅", order: 1, appt: a, title: "Inspección HOY", text: `${fullName(a)} · ${fmtTime(d)} · 📞 ${a.lead.phone}` });
    } else if ((a.status === "pending" || a.status === "confirmed") && diff === 1) {
      reminders.push({ tone: "r-amber", ico: "🔔", order: 2, appt: a, title: "Cita mañana", text: `${fullName(a)} · ${fmtDate(d)} ${fmtTime(d)}. Envía recordatorio.` });
    }
    if (a.status === "pending" && diff >= 0) {
      reminders.push({ tone: "r-amber", ico: "✅", order: 3, appt: a, title: "Pendiente de confirmar", text: `${fullName(a)} · ${fmtDate(d)}. Confirma la cita con el cliente.` });
    }
  }
  reminders.sort((x, y) => x.order - y.order);

  // ---- Calendario ----
  const y = calRef.getFullYear();
  const m = calRef.getMonth();
  const dows = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  let ini = new Date(y, m, 1).getDay();
  ini = ini === 0 ? 6 : ini - 1;
  const diasMes = new Date(y, m + 1, 0).getDate();
  const hoy = isoLocal(new Date());
  const cells: { d: Date; out: boolean }[] = [];
  for (let i = 0; i < ini; i++) cells.push({ d: new Date(y, m, -(ini - i - 1)), out: true });
  for (let i = 1; i <= diasMes; i++) cells.push({ d: new Date(y, m, i), out: false });
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1].d;
    cells.push({ d: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1), out: true });
  }

  function actionsFor(a: Appt) {
    const acts: { label: string; status: string; cls: string }[] = [];
    if (a.status === "pending") acts.push({ label: "Confirmar", status: "confirmed", cls: "btn-ink" });
    if (a.status === "pending" || a.status === "confirmed") {
      acts.push({ label: "Completada", status: "completed", cls: "btn-primary" });
      acts.push({ label: "Cancelar", status: "cancelled", cls: "btn-ghost" });
    }
    return acts;
  }

  return (
    <>
      {/* KPIs */}
      <div className="admin-kpis">
        <div className="admin-kpi k1"><div className="lbl">Total citas</div><div className="val">{total}</div></div>
        <div className="admin-kpi k2"><div className="lbl">Pendientes + confirmadas</div><div className="val">{count("pending") + count("confirmed")}</div></div>
        <div className="admin-kpi k3"><div className="lbl">Completadas</div><div className="val">{count("completed")}</div></div>
        <div className="admin-kpi k4"><div className="lbl">Conversión</div><div className="val">{total ? Math.round((count("completed") / total) * 100) : 0}%</div></div>
      </div>

      <div className="panel-tabs">
        <button className={tab === "resumen" ? "on" : ""} onClick={() => setTab("resumen")}>📊 Resumen</button>
        <button className={tab === "pipeline" ? "on" : ""} onClick={() => setTab("pipeline")}>🔀 Embudo</button>
        <button className={tab === "calendario" ? "on" : ""} onClick={() => setTab("calendario")}>📆 Calendario</button>
        <button className={tab === "recordatorios" ? "on" : ""} onClick={() => setTab("recordatorios")}>🔔 Recordatorios{reminders.length ? ` (${reminders.length})` : ""}</button>
        <button className={tab === "citas" ? "on" : ""} onClick={() => setTab("citas")}>🗂️ Citas</button>
      </div>

      {err && <p className="alert-err" role="alert" style={{ marginBottom: 16 }}>{err}</p>}

      {/* RESUMEN + EMBUDO */}
      {tab === "resumen" && (
        <>
          <div className="admin-block">
            <h3 className="card-h3">Embudo de conversión</h3>
            <p className="card-sub">Cuántas citas hay en cada etapa.</p>
            {total === 0 ? (
              <div className="admin-empty">Aún no hay citas.</div>
            ) : (
              <>
                {funnelStages.map((s) => {
                  const n = count(s);
                  const pct = Math.round((n / total) * 100);
                  return (
                    <div className="funnel-row" key={s}>
                      <div className="funnel-top">
                        <span className={`status ${meta(s).cls}`}>{meta(s).ico} {meta(s).label}</span>
                        <b>{n} <span className="muted">({pct}%)</span></b>
                      </div>
                      <div className="funnel-bar"><div className="funnel-fill" style={{ width: `${pct}%` }} /></div>
                    </div>
                  );
                })}
                <p className="muted" style={{ marginTop: 10 }}>🚫 Canceladas: <b>{count("cancelled")}</b></p>
              </>
            )}
          </div>

          <div className="admin-block">
            <h3 className="card-h3">Próximas inspecciones</h3>
            <p className="card-sub">Citas activas más cercanas.</p>
            {(() => {
              const prox = appointments
                .filter((a) => (a.status === "pending" || a.status === "confirmed") && daysFromToday(new Date(a.startsAt)) >= 0)
                .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
                .slice(0, 6);
              if (!prox.length) return <div className="admin-empty">No hay citas próximas.</div>;
              return prox.map((a) => {
                const d = new Date(a.startsAt);
                const diff = daysFromToday(d);
                const when = diff === 0 ? "Hoy" : diff === 1 ? "Mañana" : `En ${diff} días`;
                return (
                  <div className="rmd r-blue" key={a.id} style={{ cursor: "pointer" }} onClick={() => setSelected(a)}>
                    <div className="ic">📅</div>
                    <div className="tx"><b>{fullName(a)} · {meta(a.status).label}</b>{fmtDate(d)} {fmtTime(d)} — <b>{when}</b> · 📞 {a.lead.phone}</div>
                  </div>
                );
              });
            })()}
          </div>
        </>
      )}

      {/* PIPELINE */}
      {tab === "pipeline" && (
        <div className="admin-block">
          <h3 className="card-h3">Embudo de citas</h3>
          <p className="card-sub">Haz clic en una cita para ver detalle y cambiar su estado.</p>
          <div className="pipeline">
            {(["pending", "confirmed", "completed", "cancelled"] as Status[]).map((s) => {
              const items = appointments.filter((a) => a.status === s);
              return (
                <div className="pcol" key={s}>
                  <h5>{meta(s).ico} {meta(s).label} <b>{items.length}</b></h5>
                  {items.length === 0 ? (
                    <div className="pcol-empty">—</div>
                  ) : (
                    items.map((a) => {
                      const d = new Date(a.startsAt);
                      return (
                        <div className="pitem" key={a.id} role="button" tabIndex={0} onClick={() => setSelected(a)} onKeyDown={(e) => e.key === "Enter" && setSelected(a)}>
                          <b>{fullName(a)}</b>
                          <span className="m">📅 {fmtDate(d)} {fmtTime(d)}</span>
                          <span className="m">📞 {a.lead.phone}</span>
                        </div>
                      );
                    })
                  )}
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
              const evs = appointments.filter((a) => isoLocal(new Date(a.startsAt)) === iso);
              return (
                <div className={`cal-day ${c.out ? "out" : ""} ${iso === hoy ? "today" : ""}`} key={i}>
                  <div className="dn">{c.d.getDate()}</div>
                  {evs.map((a) => (
                    <div key={a.id} className={`cal-ev ${a.status === "completed" ? "done" : ""} ${a.status === "cancelled" ? "cx" : ""}`} title={fullName(a)} onClick={() => setSelected(a)}>
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
          <h3 className="card-h3">Centro de recordatorios</h3>
          <p className="card-sub">Acciones sugeridas según fechas y estados.</p>
          {reminders.length === 0 ? (
            <div className="rmd r-green"><div className="ic">✅</div><div className="tx"><b>Todo al día</b>No hay acciones pendientes.</div></div>
          ) : (
            reminders.map((r, i) => (
              <div className={`rmd ${r.tone}`} key={i}>
                <div className="ic">{r.ico}</div>
                <div className="tx"><b>{r.title}</b>{r.text}</div>
                <button className="btn btn-ghost btn-sm" onClick={() => setSelected(r.appt)}>Gestionar</button>
              </div>
            ))
          )}
        </div>
      )}

      {/* CITAS (tabla) */}
      {tab === "citas" && (
        <div className="admin-card">
          {appointments.length === 0 ? (
            <div className="admin-empty">Aún no hay citas agendadas.</div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr><th>Fecha</th><th>Cliente</th><th>Contacto</th><th>Estado</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {appointments.map((a) => {
                  const d = new Date(a.startsAt);
                  const acts = actionsFor(a);
                  return (
                    <tr key={a.id}>
                      <td>{fmtDate(d)} {fmtTime(d)}</td>
                      <td><b>{fullName(a)}</b></td>
                      <td className="muted">📞 {a.lead.phone}</td>
                      <td><span className={`status ${meta(a.status).cls}`}>{meta(a.status).label}</span></td>
                      <td>
                        <div className="row-actions">
                          <button className="btn btn-ghost btn-sm" onClick={() => setSelected(a)}>Ver</button>
                          {acts.slice(0, 1).map((ac) => (
                            <button key={ac.status} className={`btn ${ac.cls} btn-sm`} disabled={busy === a.id} onClick={() => update(a.id, ac.status)}>{ac.label}</button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* MODAL DETALLE */}
      {selected && (
        <div className="modal-bg" onClick={(e) => e.target === e.currentTarget && setSelected(null)}>
          <div className="modal">
            <div className="modal-h">
              <h3>{fullName(selected)}</h3>
              <button className="x" onClick={() => setSelected(null)}>×</button>
            </div>
            <div className="modal-row"><span>Estado</span><b><span className={`status ${meta(selected.status).cls}`}>{meta(selected.status).label}</span></b></div>
            <div className="modal-row"><span>Fecha</span><b>{fmtDate(new Date(selected.startsAt))} · {fmtTime(new Date(selected.startsAt))}</b></div>
            <div className="modal-row"><span>Teléfono</span><b>{selected.lead.phone}</b></div>
            <div className="modal-row"><span>Correo</span><b>{selected.lead.email || "—"}</b></div>
            <div className="modal-row"><span>Idioma</span><b>{selected.lead.language}</b></div>
            {selected.notes && <div className="modal-row"><span>Notas</span><b style={{ maxWidth: 260, textAlign: "right" }}>{selected.notes}</b></div>}

            <div className="modal-actions">
              <a className="btn btn-primary btn-sm" href={`tel:${selected.lead.phone}`}>📞 Llamar</a>
              <a className="btn btn-ink btn-sm" href={`https://wa.me/${selected.lead.phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer">💬 WhatsApp</a>
            </div>
            {actionsFor(selected).length > 0 && (
              <div className="modal-actions" style={{ borderTop: "1px solid var(--line)", paddingTop: 14 }}>
                {actionsFor(selected).map((ac) => (
                  <button key={ac.status} className={`btn ${ac.cls} btn-sm`} disabled={busy === selected.id} onClick={() => update(selected.id, ac.status)}>{ac.label}</button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
