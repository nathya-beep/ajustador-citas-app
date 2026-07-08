"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Appointment = {
  id: string;
  startsAt: string | Date;
  status: string;
  lead: { firstName: string; lastName: string };
};

export function AppointmentRow({ appointment }: { appointment: Appointment }) {
  const router = useRouter();
  const [updating, setUpdating] = useState(false);

  async function updateStatus(status: string) {
    setUpdating(true);
    await fetch(`/api/appointments/${appointment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setUpdating(false);
    router.refresh();
  }

  return (
    <tr>
      <td>{new Date(appointment.startsAt).toLocaleString("es-ES")}</td>
      <td>
        {appointment.lead.firstName} {appointment.lead.lastName}
      </td>
      <td>{appointment.status}</td>
      <td>
        <button disabled={updating} onClick={() => updateStatus("completed")}>
          Completada
        </button>
        <button disabled={updating} onClick={() => updateStatus("cancelled")}>
          Cancelar
        </button>
      </td>
    </tr>
  );
}
