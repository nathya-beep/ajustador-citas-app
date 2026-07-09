# Resumen del Proyecto — Plataforma de Citas para Ajustador de Seguros

**Fecha:** 2026-07-08 / 2026-07-09
**Repositorio:** https://github.com/nathya-beep/ajustador-citas-app (privado)
**Producción:** https://ajustador-citas-app.vercel.app

## Qué es

Plataforma web bilingüe (español/inglés) para un ajustador de seguros: un sitio público de marketing y agendamiento de citas de inspección, y un panel de administración privado para gestionar esas citas. Construida como aplicación web propia (no depende de WordPress/Wix/Calendly), reemplazando el enfoque original del "Prompt Master" inicial.

## Cómo se construyó

1. **Brainstorming** — se refinó el pedido original (un documento de "Prompt Master" genérico) en preguntas concretas: alcance completo (app funcional, no solo landing), stack (Next.js + PostgreSQL en vez de PHP/MySQL), un solo ajustador (sin multi-tenant), notificaciones solo por email, panel de administración propio.
2. **Diseño (spec)** — documentado en `docs/superpowers/specs/2026-07-08-plataforma-citas-ajustador-design.md`: arquitectura, modelo de datos, reglas de negocio, flujos, manejo de errores, testing.
3. **Plan de implementación** — 17 tareas detalladas con TDD en `docs/superpowers/plans/2026-07-08-plataforma-citas-ajustador.md`.
4. **Ejecución con subagentes** — cada tarea implementada por un subagente fresco, revisada por otro (spec + calidad), con ciclos de corrección cuando se encontraban problemas reales.
5. **Revisión final de toda la rama** — encontró y corrigió bugs de sistema que solo se ven al integrar todas las piezas.
6. **Segunda ronda de code review** (8 ángulos de búsqueda + verificación) sobre el PR ya fusionado, con 8 hallazgos corregidos.
7. **Despliegue real a producción** en Vercel con base de datos Neon Postgres.

## Stack técnico

- **Frontend/Backend:** Next.js 14 (App Router, TypeScript)
- **Base de datos:** PostgreSQL (Neon, vía marketplace de Vercel en producción; Docker local en desarrollo)
- **ORM:** Prisma
- **Email:** Resend (pendiente de configurar dominio real — ver sección "Pendiente")
- **Testing:** Vitest (35 tests: unitarios + integración)
- **Hosting:** Vercel (plan Hobby/gratuito)

## Funcionalidad implementada

**Sitio público (`/[locale]`, es/en):**
- Landing de marketing
- `/schedule` — calendario de disponibilidad y formulario de agendamiento
- `/cancel/[token]` — cancelación de citas vía enlace en el email

**Panel de administración (`/admin`):**
- Login con sesión firmada (cookie HMAC, expira a los 7 días)
- Dashboard de citas: ver, marcar como completada, cancelar

**Reglas de negocio (enforced en el servidor, dentro de una transacción `Serializable`):**
- Antelación mínima de 24 horas para agendar
- Un lead no puede tener más de una cita activa simultánea
- Sin citas superpuestas (índice único parcial en la base de datos, scoped a estados activos)
- Las citas deben caer dentro del horario configurado del ajustador

**Automatización (cron jobs, corren 1x/día por límite del plan gratuito de Vercel):**
- Recordatorio de cita (24h antes, ventana ampliada a 12-36h para cubrir la ejecución diaria)
- Marcar citas vencidas sin respuesta como "no_response" y liberar el horario

**Emails transaccionales (vía Resend, cuando esté configurado):**
- Confirmación de cita (con registro de si se envió exitosamente)
- Recordatorio 24h antes (con registro anti-duplicados)
- Seguimiento post-inspección (solo se envía una vez, no en reintentos)

## Bugs reales encontrados y corregidos

Durante la implementación y las dos rondas de revisión se encontraron y corrigieron 14 problemas reales (no hipotéticos), entre ellos:

- Crash del cliente de Resend al importarse si no había API key configurada
- Condiciones de carrera en reservas concurrentes mal mapeadas a error 500 en vez de 409
- Bucle infinito de redirección entre `/admin` y `/admin/login`
- Citas canceladas bloqueaban su horario para siempre (índice único de BD sin filtrar por estado)
- Bypass de autenticación en los cron jobs si `CRON_SECRET` no estaba configurado
- El enlace de cancelación (sin expiración) podía revertir una cita ya completada
- El estado "rescheduled" liberaba el horario sin crear una cita nueva, dejando al cliente sin nada
- Emails de recordatorio marcados como enviados aunque el envío hubiera fallado
- Emails de confirmación fallidos sin ningún registro ni reintento
- Email de seguimiento duplicado si se reintentaba la misma petición de "completar cita"
- Índice único parcial de la base de datos invisible para el schema de Prisma (riesgo de que se borrara solo en un futuro `migrate dev`/`db push`)
- Ruta muerta de administración nunca usada por el dashboard real
- `prisma generate` faltante en el build de Vercel (causaba error de cliente desactualizado)
- Raíz del sitio (`/`) devolvía 404 por no tener redirección al idioma por defecto

## Estado del despliegue en producción

| Componente | Estado |
|---|---|
| App desplegada en Vercel | ✅ https://ajustador-citas-app.vercel.app |
| Base de datos Postgres (Neon) | ✅ provisionada y migrada |
| Datos semilla (ajustador, horario Lun-Vie 9:00-17:00) | ✅ cargados |
| Login de administrador | ✅ funcionando (millionsjacob12@gmail.com) |
| `SESSION_SECRET` / `CRON_SECRET` | ✅ generados y configurados |
| Cron jobs (recordatorios, sin respuesta) | ✅ configurados (1x/día, límite del plan gratuito) |
| Envío real de emails (Resend) | ⏳ **pendiente** — necesita un dominio propio verificado |

## Pendiente

**Configurar Resend para envío real de emails.** Ya se instaló la integración de Resend en el marketplace de Vercel (aceptaste los términos), pero Resend requiere un **dominio propio verificado** para poder enviar correos a los clientes/leads (sin dominio, solo podría enviarte pruebas a tu propia dirección). Falta decidir:
- Comprar un dominio nuevo (a través de Vercel u otro proveedor), o
- Usar un dominio que ya tengas, o
- Quedarse por ahora en modo de prueba (emails solo llegan a tu propia dirección, no a clientes reales).

Una vez decidido, es un paso corto: conectar el dominio, generar el API key, y configurarlo como variable de entorno en Vercel.

## Enlaces

- Repositorio: https://github.com/nathya-beep/ajustador-citas-app
- Pull Request (fusionado): https://github.com/nathya-beep/ajustador-citas-app/pull/1
- Producción: https://ajustador-citas-app.vercel.app
- Panel admin: https://ajustador-citas-app.vercel.app/admin/login
