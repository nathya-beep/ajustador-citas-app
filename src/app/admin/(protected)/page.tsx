import { prisma } from "@/lib/db";
import { brand } from "@/lib/brand";
import { LogoutButton } from "./LogoutButton";
import { Dashboard, type Appt } from "./Dashboard";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const rows = await prisma.appointment.findMany({
    include: { lead: true },
    orderBy: { startsAt: "asc" },
  });

  const appointments: Appt[] = rows.map((a) => ({
    id: a.id,
    startsAt: a.startsAt.toISOString(),
    status: a.status,
    notes: a.notes ?? null,
    lead: {
      firstName: a.lead.firstName,
      lastName: a.lead.lastName,
      email: a.lead.email,
      phone: a.lead.phone,
      language: a.lead.language,
    },
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
        <p className="subtitle">Gestiona tus citas de inspección: embudo, calendario y seguimiento.</p>
        <Dashboard appointments={appointments} />
      </main>
    </>
  );
}
