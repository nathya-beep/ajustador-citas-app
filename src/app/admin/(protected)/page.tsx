import { prisma } from "@/lib/db";
import { brand } from "@/lib/brand";
import { LogoutButton } from "./LogoutButton";
import { Dashboard, type Lead } from "./Dashboard";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const rows = await prisma.lead.findMany({
    include: {
      appointments: { orderBy: { startsAt: "asc" } },
      followUps: { orderBy: { attemptedAt: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  const leads: Lead[] = rows.map((l) => ({
    id: l.id,
    firstName: l.firstName,
    lastName: l.lastName,
    email: l.email,
    phone: l.phone,
    language: l.language,
    status: l.status,
    createdAt: l.createdAt.toISOString(),
    appointments: l.appointments.map((a) => ({ id: a.id, startsAt: a.startsAt.toISOString(), status: a.status })),
    followUps: l.followUps.map((f) => ({ attemptedAt: f.attemptedAt.toISOString(), result: f.result })),
  }));

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
        <h1>Panel del ajustador</h1>
        <p className="subtitle">Gestiona tus prospectos: embudo, calendario y seguimiento.</p>
        <Dashboard leads={leads} />
      </main>
    </>
  );
}
