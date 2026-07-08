import { prisma } from "@/lib/db";
import { AppointmentRow } from "./AppointmentRow";

export default async function AdminDashboardPage() {
  const appointments = await prisma.appointment.findMany({
    include: { lead: true },
    orderBy: { startsAt: "asc" },
  });

  return (
    <main>
      <h1>Citas</h1>
      <table>
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
    </main>
  );
}
