# Diseño: Plataforma de Marketing y Gestión de Citas para Ajustador de Seguros

**Fecha:** 2026-07-08
**Estado:** Aprobado

## Contexto y Problema

El ajustador necesita captar citas para inspecciones de manera más efectiva. Actualmente no existe una plataforma; el objetivo es construir un sitio web de marketing bilingüe (inglés/español) integrado con un sistema propio de gestión de citas, para un solo ajustador (sin necesidad de soporte multi-tenant).

## Alcance

- Construir una aplicación web funcional completa (no depender de WordPress/Wix/Calendly de terceros).
- Un solo ajustador usa el sistema; no hay necesidad de cuentas para múltiples negocios.
- Notificaciones únicamente por correo electrónico (sin SMS en esta fase).
- Panel de administración propio dentro de la misma app (sin sincronización con Google Calendar en esta fase).

## Stack Técnico

- **Frontend/Backend:** Next.js 14+ (App Router, TypeScript)
- **Base de datos:** PostgreSQL (Neon o Supabase)
- **ORM:** Prisma
- **Email:** Resend
- **Hosting:** Vercel

## Arquitectura

Dos superficies dentro de la misma app Next.js:

1. **Sitio público (marketing):** landing bilingüe con información de servicios del ajustador, formulario de contacto, y calendario público de disponibilidad para agendar citas de inspección.
2. **Panel de administración privado:** protegido con login (solo el ajustador), para ver/gestionar citas, marcar inspecciones como completadas, y ver el historial y estado de los leads.

La lógica de citas (disponibilidad, reglas de negocio, envío de emails automáticos) vive en el backend de la misma app (API routes / server actions de Next.js).

## Modelo de Datos

- **Adjuster** (fila única): nombre, email, teléfono, áreas de servicio, horario de disponibilidad.
- **Lead**: nombre, apellido, email, teléfono, idioma preferido (`en`/`es`), estado (`new`, `contacted`, `scheduled`, `no_response`, `not_interested`).
- **Appointment**: fecha, hora, `leadId`, estado (`pending`, `confirmed`, `completed`, `cancelled`, `rescheduled`), notas.
  - Se modela como una sola entidad para cita e inspección (no se separan en dos tablas), ya que representan el mismo evento en el tiempo con distinto estado.
- **FollowUp**: `leadId`, fecha del intento de contacto, resultado.

## Reglas de Negocio

1. No se puede agendar una cita con menos de 24 horas de anticipación (validado en cliente y servidor).
2. Un lead no puede tener más de una cita activa (`pending`/`confirmed`) simultáneamente.
3. No se permiten dos citas superpuestas en el calendario del ajustador (restricción única a nivel de base de datos sobre el slot de tiempo).

## Flujos Principales

### Flujo de agendamiento (lead nuevo)
1. El lead visita el sitio (en o es), completa el formulario de contacto o va directo al calendario de citas.
2. Ve los horarios disponibles (disponibilidad del ajustador menos citas ya tomadas) y agenda.
3. Recibe un email de confirmación inmediato y un recordatorio automático 24h antes de la cita.
4. El ajustador ve la cita en el panel de administración.
5. Tras la inspección, el ajustador marca la cita como `completed`, lo que dispara un email de seguimiento.

### Casos especiales
- **Sin respuesta:** si la fecha de la cita pasa sin confirmación del lead, el sistema la marca automáticamente como `no_response` y aparece en una lista de seguimiento pendiente en el panel.
- **Cancelación/reprogramación:** el email de confirmación incluye un enlace para cancelar o reprogramar sin llamar al ajustador; el horario se libera automáticamente al cancelar.
- **No interesado:** el lead puede indicarlo vía formulario; se marca como `not_interested` y se excluye de recordatorios futuros.

## Manejo de Errores

- **Validación de formulario:** en cliente y servidor (fecha válida, ≥24h de anticipación, formato de email/teléfono, campos requeridos).
- **Conflictos de horario (race condition):** al agendar, se usa una transacción de base de datos con restricción única sobre el slot; si dos personas agendan el mismo horario casi simultáneamente, solo una reserva tiene éxito y la otra recibe un mensaje de "horario ya no disponible" con alternativas sugeridas.
- **Fallos de envío de email:** la cita se guarda en base de datos independientemente del resultado del envío; el envío se reintenta en segundo plano y el fallo se registra (no se pierde silenciosamente).

## Testing

- Pruebas unitarias de las reglas de negocio: antelación de 24h, no-doble-booking, cálculo de disponibilidad.
- Pruebas de integración del flujo completo de agendar cita (API + base de datos).
- Verificación manual en navegador del flujo completo en ambos idiomas (en/es) antes de considerar terminada cualquier iteración.

## Fuera de Alcance (esta fase)

- Soporte multi-tenant (múltiples ajustadores con cuentas independientes).
- Notificaciones por SMS.
- Integración con Google Calendar u otros calendarios externos.
- Integraciones con WordPress/Wix/Calendly (reemplazadas por la app propia).
