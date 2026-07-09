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
  const [error, setError] = useState("");

  async function updateStatus(status: string) {
    setUpdating(true);
    setError("");
    try {
      const response = await fetch(`/api/appointments/${appointment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        setError("No se pudo actualizar la cita. Intenta de nuevo.");
        return;
      }
      router.refresh();
    } catch {
      setError("No se pudo conectar. Intenta de nuevo.");
    } finally {
      setUpdating(false);
    }
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
        {error && (
          <p role="alert" style={{ color: "red" }}>
            {error}
          </p>
        )}
      </td>
    </tr>
  );
}
