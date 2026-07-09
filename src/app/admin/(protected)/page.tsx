import { prisma } from "@/lib/db";
import { brand } from "@/lib/brand";
import { AppointmentRow } from "./AppointmentRow";
import { LogoutButton } from "./LogoutButton";

export default async function AdminDashboardPage() {
  const appointments = await prisma.appointment.findMany({
    include: { lead: true },
    orderBy: { startsAt: "asc" },
  });

  const total = appointments.length;
  const upcoming = appointments.filter((a) => a.status === "pending" || a.status === "confirmed").length;
  const completed = appointments.filter((a) => a.status === "completed").length;
  const cancelled = appointments.filter((a) => a.status === "cancelled").length;

  return (
    <>
      <header className="admin-topbar">
        <div className="admin-topbar-in">
          <div className="logo">
            <span className="badge">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></svg>
            </span> {brand.name} <span className="tag">· Panel</span>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="admin-wrap">
        <h1>Citas</h1>
        <p className="subtitle">Gestiona las inspecciones agendadas.</p>

        <div className="admin-kpis">
          <div className="admin-kpi k1"><div className="lbl">Total</div><div className="val">{total}</div></div>
          <div className="admin-kpi k2"><div className="lbl">Próximas</div><div className="val">{upcoming}</div></div>
          <div className="admin-kpi k3"><div className="lbl">Completadas</div><div className="val">{completed}</div></div>
          <div className="admin-kpi k4"><div className="lbl">Canceladas</div><div className="val">{cancelled}</div></div>
        </div>

        <div className="admin-card">
          {appointments.length === 0 ? (
            <div className="admin-empty">Aún no hay citas agendadas.</div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appointment) => (
                  <AppointmentRow key={appointment.id} appointment={appointment} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </>
  );
}
