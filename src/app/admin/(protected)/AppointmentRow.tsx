"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Appointment = {
  id: string;
  startsAt: string | Date;
  status: string;
  lead: { firstName: string; lastName: string };
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  completed: "Completada",
  cancelled: "Cancelada",
  no_response: "Sin respuesta",
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

  const isClosed = appointment.status === "completed" || appointment.status === "cancelled";

  return (
    <tr>
      <td>
        {new Date(appointment.startsAt).toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" })}
      </td>
      <td><b>{appointment.lead.firstName} {appointment.lead.lastName}</b></td>
      <td>
        <span className={`status status-${appointment.status}`}>
          {STATUS_LABEL[appointment.status] ?? appointment.status}
        </span>
      </td>
      <td>
        <div className="row-actions">
          {!isClosed && (
            <>
              <button className="btn btn-primary btn-sm" disabled={updating} onClick={() => updateStatus("completed")}>
                Completada
              </button>
              <button className="btn btn-ghost btn-sm" disabled={updating} onClick={() => updateStatus("cancelled")}>
                Cancelar
              </button>
            </>
          )}
          {isClosed && <span className="muted">—</span>}
          {error && <span className="alert-err" role="alert">{error}</span>}
        </div>
      </td>
    </tr>
  );
}
