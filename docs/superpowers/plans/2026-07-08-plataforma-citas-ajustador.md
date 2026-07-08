# Plataforma de Citas para Ajustador — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a working Next.js application that lets leads book insurance-inspection appointments online (bilingual en/es), enforces the booking business rules, sends confirmation emails, and gives the adjuster a private dashboard to manage appointments.

**Architecture:** A single Next.js 14 (App Router, TypeScript) app with two surfaces — a public marketing/booking site under `/[locale]/...` and a cookie-authenticated admin dashboard under `/admin/...` — backed by PostgreSQL via Prisma and Resend for email. Business rules (24h advance minimum, no double-booking, single active appointment per lead) live in pure, unit-tested functions in `src/lib/`, consumed by API routes that wrap them in a serializable database transaction.

**Tech Stack:** Next.js 14+ (App Router, TypeScript), PostgreSQL, Prisma ORM, Resend (email), Vitest (testing), Vercel (hosting + cron).

## Global Constraints

- Appointments must be booked at least 24 hours in advance (spec: "Reglas de Negocio").
- A lead may not have more than one active (`pending`/`confirmed`) appointment at a time.
- No two appointments may overlap on the adjuster's calendar.
- Single adjuster only — no multi-tenant account system.
- Notifications are email-only (Resend), no SMS.
- Admin panel is built into this same app — no external calendar sync.
- All public-facing pages must render in both `en` and `es`.

---

## File Structure

```
ajustador-citas-app/
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── vercel.json
├── .env.example
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── lib/
│   │   ├── db.ts               # Prisma client singleton
│   │   ├── availability.ts     # pure: compute open slots
│   │   ├── booking.ts          # pure: business rule checks
│   │   ├── auth.ts             # admin session token create/verify
│   │   ├── email.ts            # Resend confirmation email
│   │   └── i18n.ts             # en/es dictionary + helpers
│   └── app/
│       ├── layout.tsx
│       ├── globals.css
│       ├── [locale]/
│       │   ├── layout.tsx
│       │   ├── page.tsx            # marketing landing
│       │   ├── schedule/page.tsx   # booking UI
│       │   └── cancel/[token]/page.tsx
│       ├── admin/
│       │   ├── layout.tsx          # auth guard
│       │   ├── login/page.tsx
│       │   ├── page.tsx            # dashboard
│       │   └── AppointmentRow.tsx
│       └── api/
│           ├── availability/route.ts
│           ├── appointments/route.ts
│           ├── appointments/[id]/route.ts
│           ├── appointments/cancel/[token]/route.ts
│           ├── admin/login/route.ts
│           └── cron/no-response/route.ts
└── tests/
    ├── lib/availability.test.ts
    ├── lib/booking.test.ts
    ├── lib/auth.test.ts
    └── api/appointments.test.ts
```

---

### Task 1: Project Scaffold & Configuration

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `.env.example`
- Create: `.gitignore`
- Create: `src/app/layout.tsx`
- Create: `src/app/globals.css`
- Create: `next.config.mjs`

**Interfaces:**
- Produces: `@/*` path alias resolving to `src/*`, `npm test` running Vitest, `npm run dev` running Next.js.

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "ajustador-citas-app",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest run",
    "test:watch": "vitest",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:seed": "ts-node prisma/seed.ts"
  },
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  },
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@prisma/client": "^5.16.0",
    "resend": "^3.4.0"
  },
  "devDependencies": {
    "prisma": "^5.16.0",
    "typescript": "^5.5.0",
    "ts-node": "^10.9.0",
    "@types/node": "^20.14.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "vitest": "^1.6.0"
  }
}
```

- [ ] **Step 2: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Write `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  test: {
    environment: "node",
  },
});
```

- [ ] **Step 4: Write `next.config.mjs`**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {};

export default nextConfig;
```

- [ ] **Step 5: Write `.env.example`**

```
DATABASE_URL="postgresql://user:password@localhost:5432/ajustador_citas"
RESEND_API_KEY=""
SESSION_SECRET=""
ADMIN_EMAIL=""
ADMIN_PASSWORD=""
CRON_SECRET=""
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

- [ ] **Step 6: Write `.gitignore`**

```
node_modules/
.next/
.env
.env.local
```

- [ ] **Step 7: Write `src/app/globals.css`**

```css
* {
  box-sizing: border-box;
}

body {
  font-family: system-ui, sans-serif;
  margin: 0;
  padding: 0;
}
```

- [ ] **Step 8: Write `src/app/layout.tsx`**

```tsx
import "./globals.css";

export const metadata = {
  title: "Inspecciones de Seguros",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 9: Install dependencies and verify the toolchain runs**

Run: `npm install`
Expected: dependencies install without errors.

Run: `npm test`
Expected: Vitest runs with "No test files found" (no tests exist yet) — this confirms the runner is wired up correctly.

- [ ] **Step 10: Commit**

```bash
git add package.json tsconfig.json vitest.config.ts next.config.mjs .env.example .gitignore src/app/globals.css src/app/layout.tsx package-lock.json
git commit -m "chore: scaffold Next.js + Vitest project"
```

---

### Task 2: Prisma Schema & Database Client

**Files:**
- Create: `prisma/schema.prisma`
- Create: `src/lib/db.ts`

**Interfaces:**
- Produces: Prisma models `Adjuster`, `Lead`, `Appointment`, `FollowUp`; `prisma` singleton exported from `src/lib/db.ts`.

- [ ] **Step 1: Write `prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum LeadStatus {
  new
  contacted
  scheduled
  no_response
  not_interested
}

enum AppointmentStatus {
  pending
  confirmed
  completed
  cancelled
  rescheduled
}

model Adjuster {
  id           String   @id @default(cuid())
  name         String
  email        String
  phone        String
  serviceAreas String
  availability Json
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model Lead {
  id           String        @id @default(cuid())
  firstName    String
  lastName     String
  email        String        @unique
  phone        String
  language     String        @default("es")
  status       LeadStatus    @default(new)
  appointments Appointment[]
  followUps    FollowUp[]
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
}

model Appointment {
  id          String            @id @default(cuid())
  leadId      String
  lead        Lead              @relation(fields: [leadId], references: [id])
  startsAt    DateTime
  endsAt      DateTime
  status      AppointmentStatus @default(pending)
  notes       String?
  cancelToken String            @unique @default(cuid())
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt

  @@unique([startsAt, endsAt])
}

model FollowUp {
  id          String   @id @default(cuid())
  leadId      String
  lead        Lead     @relation(fields: [leadId], references: [id])
  attemptedAt DateTime @default(now())
  result      String
}
```

- [ ] **Step 2: Write `src/lib/db.ts`**

```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

- [ ] **Step 3: Generate the Prisma client and run the first migration**

Set `DATABASE_URL` in a local `.env` file pointing at a real Postgres instance before running this step.

Run: `npx prisma migrate dev --name init`
Expected: migration created under `prisma/migrations/`, and "Your database is now in sync with your schema" printed.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma src/lib/db.ts prisma/migrations
git commit -m "feat: add Prisma schema and database client"
```

---

### Task 3: Availability Calculation Logic (TDD)

**Files:**
- Create: `src/lib/availability.ts`
- Test: `tests/lib/availability.test.ts`

**Interfaces:**
- Produces: `computeAvailableSlots(date, weeklyAvailability, busySlots, slotDurationMinutes?)`, `SLOT_DURATION_MINUTES`, types `WeeklyAvailability`, `BusySlot`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/availability.test.ts
import { describe, it, expect } from "vitest";
import { computeAvailableSlots } from "@/lib/availability";

describe("computeAvailableSlots", () => {
  it("returns all slots when there are no busy slots", () => {
    const date = new Date("2026-07-13T00:00:00"); // a Monday
    const weeklyAvailability = { mon: ["09:00-11:00"] };
    const slots = computeAvailableSlots(date, weeklyAvailability, []);
    expect(slots).toHaveLength(2);
    expect(slots[0].getHours()).toBe(9);
    expect(slots[1].getHours()).toBe(10);
  });

  it("excludes slots that overlap with a busy appointment", () => {
    const date = new Date("2026-07-13T00:00:00");
    const weeklyAvailability = { mon: ["09:00-11:00"] };
    const busySlots = [
      { startsAt: new Date("2026-07-13T09:00:00"), endsAt: new Date("2026-07-13T10:00:00") },
    ];
    const slots = computeAvailableSlots(date, weeklyAvailability, busySlots);
    expect(slots).toHaveLength(1);
    expect(slots[0].getHours()).toBe(10);
  });

  it("returns no slots for a day with no configured availability", () => {
    const date = new Date("2026-07-14T00:00:00"); // Tuesday
    const weeklyAvailability = { mon: ["09:00-11:00"] };
    const slots = computeAvailableSlots(date, weeklyAvailability, []);
    expect(slots).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/availability.test.ts`
Expected: FAIL — `Cannot find module '@/lib/availability'`

- [ ] **Step 3: Write the implementation**

```ts
// src/lib/availability.ts
export const SLOT_DURATION_MINUTES = 60;

export type WeeklyAvailability = Record<string, string[]>;

export type BusySlot = { startsAt: Date; endsAt: Date };

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function parseTimeRange(range: string, date: Date): { start: Date; end: Date } {
  const [startStr, endStr] = range.split("-");
  const [startH, startM] = startStr.split(":").map(Number);
  const [endH, endM] = endStr.split(":").map(Number);
  const start = new Date(date);
  start.setHours(startH, startM, 0, 0);
  const end = new Date(date);
  end.setHours(endH, endM, 0, 0);
  return { start, end };
}

export function computeAvailableSlots(
  date: Date,
  weeklyAvailability: WeeklyAvailability,
  busySlots: BusySlot[],
  slotDurationMinutes: number = SLOT_DURATION_MINUTES
): Date[] {
  const dayKey = DAY_KEYS[date.getDay()];
  const ranges = weeklyAvailability[dayKey] ?? [];
  const slots: Date[] = [];

  for (const range of ranges) {
    const { start, end } = parseTimeRange(range, date);
    let cursor = new Date(start);

    while (cursor.getTime() + slotDurationMinutes * 60_000 <= end.getTime()) {
      const slotEnd = new Date(cursor.getTime() + slotDurationMinutes * 60_000);
      const overlaps = busySlots.some(
        (busy) => cursor.getTime() < busy.endsAt.getTime() && slotEnd.getTime() > busy.startsAt.getTime()
      );
      if (!overlaps) {
        slots.push(new Date(cursor));
      }
      cursor = new Date(cursor.getTime() + slotDurationMinutes * 60_000);
    }
  }

  return slots;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/availability.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/availability.ts tests/lib/availability.test.ts
git commit -m "feat: compute available appointment slots"
```

---

### Task 4: Booking Rules Logic (TDD)

**Files:**
- Create: `src/lib/booking.ts`
- Test: `tests/lib/booking.test.ts`

**Interfaces:**
- Consumes: none.
- Produces: `MIN_ADVANCE_HOURS`, `isAtLeastAdvanceHours(startsAt, now, minAdvanceHours?)`, `ACTIVE_APPOINTMENT_STATUSES`, `hasActiveAppointmentConflict(existingStatuses)`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/booking.test.ts
import { describe, it, expect } from "vitest";
import { isAtLeastAdvanceHours, hasActiveAppointmentConflict } from "@/lib/booking";

describe("isAtLeastAdvanceHours", () => {
  it("returns true when the appointment is more than 24 hours away", () => {
    const now = new Date("2026-07-08T10:00:00Z");
    const startsAt = new Date("2026-07-10T10:00:00Z");
    expect(isAtLeastAdvanceHours(startsAt, now)).toBe(true);
  });

  it("returns false when the appointment is less than 24 hours away", () => {
    const now = new Date("2026-07-08T10:00:00Z");
    const startsAt = new Date("2026-07-08T20:00:00Z");
    expect(isAtLeastAdvanceHours(startsAt, now)).toBe(false);
  });

  it("returns false when the appointment is one minute short of 24 hours", () => {
    const now = new Date("2026-07-08T10:00:00Z");
    const startsAt = new Date("2026-07-09T09:59:00Z");
    expect(isAtLeastAdvanceHours(startsAt, now)).toBe(false);
  });
});

describe("hasActiveAppointmentConflict", () => {
  it("returns true if any existing appointment is pending", () => {
    expect(hasActiveAppointmentConflict(["pending"])).toBe(true);
  });

  it("returns true if any existing appointment is confirmed", () => {
    expect(hasActiveAppointmentConflict(["cancelled", "confirmed"])).toBe(true);
  });

  it("returns false if all existing appointments are cancelled or completed", () => {
    expect(hasActiveAppointmentConflict(["cancelled", "completed"])).toBe(false);
  });

  it("returns false for an empty list", () => {
    expect(hasActiveAppointmentConflict([])).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/booking.test.ts`
Expected: FAIL — `Cannot find module '@/lib/booking'`

- [ ] **Step 3: Write the implementation**

```ts
// src/lib/booking.ts
export const MIN_ADVANCE_HOURS = 24;

export function isAtLeastAdvanceHours(
  startsAt: Date,
  now: Date,
  minAdvanceHours: number = MIN_ADVANCE_HOURS
): boolean {
  const diffMs = startsAt.getTime() - now.getTime();
  return diffMs >= minAdvanceHours * 60 * 60 * 1000;
}

export const ACTIVE_APPOINTMENT_STATUSES = ["pending", "confirmed"] as const;

export function hasActiveAppointmentConflict(existingStatuses: string[]): boolean {
  return existingStatuses.some((status) =>
    (ACTIVE_APPOINTMENT_STATUSES as readonly string[]).includes(status)
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/booking.test.ts`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/booking.ts tests/lib/booking.test.ts
git commit -m "feat: add booking business rule checks"
```

---

### Task 5: Admin Session Auth (TDD)

**Files:**
- Create: `src/lib/auth.ts`
- Test: `tests/lib/auth.test.ts`

**Interfaces:**
- Produces: `createSessionToken()`, `verifySessionToken(token)`, `requireAdminSession(request)`, `SESSION_COOKIE`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/auth.test.ts
import { describe, it, expect, beforeAll } from "vitest";
import { createSessionToken, verifySessionToken } from "@/lib/auth";

beforeAll(() => {
  process.env.SESSION_SECRET = "test-secret";
});

describe("session tokens", () => {
  it("verifies a freshly created token", () => {
    const token = createSessionToken();
    expect(verifySessionToken(token)).toBe(true);
  });

  it("rejects a tampered token", () => {
    const token = createSessionToken();
    const tampered = token.slice(0, -1) + (token.endsWith("a") ? "b" : "a");
    expect(verifySessionToken(tampered)).toBe(false);
  });

  it("rejects a malformed token", () => {
    expect(verifySessionToken("not-a-real-token")).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/auth.test.ts`
Expected: FAIL — `Cannot find module '@/lib/auth'`

- [ ] **Step 3: Write the implementation**

```ts
// src/lib/auth.ts
import type { NextRequest } from "next/server";
import crypto from "crypto";

export const SESSION_COOKIE = "admin_session";
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is not set");
  }
  return secret;
}

export function createSessionToken(): string {
  const issuedAt = Date.now().toString();
  const signature = crypto.createHmac("sha256", getSecret()).update(issuedAt).digest("hex");
  return `${issuedAt}.${signature}`;
}

export function verifySessionToken(token: string): boolean {
  const [issuedAt, signature] = token.split(".");
  if (!issuedAt || !signature) return false;

  const expectedSignature = crypto.createHmac("sha256", getSecret()).update(issuedAt).digest("hex");

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (signatureBuffer.length !== expectedBuffer.length) return false;

  const isValidSignature = crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
  const isNotExpired = Date.now() - Number(issuedAt) < SESSION_MAX_AGE_MS;

  return isValidSignature && isNotExpired;
}

export async function requireAdminSession(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return false;
  return verifySessionToken(token);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/auth.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth.ts tests/lib/auth.test.ts
git commit -m "feat: add admin session token auth"
```

---

### Task 6: Email Confirmation Service

**Files:**
- Create: `src/lib/email.ts`

**Interfaces:**
- Consumes: `RESEND_API_KEY` env var.
- Produces: `sendConfirmationEmail({ to, language, leadFirstName, startsAt, cancelUrl })` returning `Promise<{ success: boolean }>`.

- [ ] **Step 1: Write `src/lib/email.ts`**

```ts
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_ADDRESS = "citas@tudominio.com";

type ConfirmationEmailParams = {
  to: string;
  language: "en" | "es";
  leadFirstName: string;
  startsAt: Date;
  cancelUrl: string;
};

const CONFIRMATION_SUBJECT = {
  en: "Your inspection appointment is confirmed",
  es: "Tu cita de inspección está confirmada",
};

function formatConfirmationBody(params: ConfirmationEmailParams): string {
  const formattedDate = params.startsAt.toLocaleString(
    params.language === "en" ? "en-US" : "es-ES",
    { dateStyle: "full", timeStyle: "short" }
  );

  if (params.language === "en") {
    return `Hi ${params.leadFirstName},\n\nYour inspection appointment is confirmed for ${formattedDate}.\n\nNeed to cancel or reschedule? ${params.cancelUrl}\n\nThanks!`;
  }

  return `Hola ${params.leadFirstName},\n\nTu cita de inspección está confirmada para el ${formattedDate}.\n\n¿Necesitas cancelar o reprogramar? ${params.cancelUrl}\n\n¡Gracias!`;
}

export async function sendConfirmationEmail(
  params: ConfirmationEmailParams
): Promise<{ success: boolean }> {
  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: params.to,
      subject: CONFIRMATION_SUBJECT[params.language],
      text: formatConfirmationBody(params),
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send confirmation email", error);
    return { success: false };
  }
}
```

- [ ] **Step 2: Verify the module compiles**

Run: `npx tsc --noEmit`
Expected: no errors related to `src/lib/email.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/email.ts
git commit -m "feat: add Resend confirmation email service"
```

---

### Task 7: Availability API Route

**Files:**
- Create: `src/app/api/availability/route.ts`

**Interfaces:**
- Consumes: `computeAvailableSlots` (Task 3), `ACTIVE_APPOINTMENT_STATUSES` (Task 4), `prisma` (Task 2).
- Produces: `GET /api/availability?date=YYYY-MM-DD` → `{ slots: string[] }` (ISO timestamps).

- [ ] **Step 1: Write `src/app/api/availability/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computeAvailableSlots, WeeklyAvailability } from "@/lib/availability";
import { ACTIVE_APPOINTMENT_STATUSES } from "@/lib/booking";

export async function GET(request: NextRequest) {
  const dateParam = request.nextUrl.searchParams.get("date");
  if (!dateParam) {
    return NextResponse.json({ error: "Missing date parameter" }, { status: 400 });
  }

  const date = new Date(`${dateParam}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return NextResponse.json({ error: "Invalid date parameter" }, { status: 400 });
  }

  const adjuster = await prisma.adjuster.findFirst();
  if (!adjuster) {
    return NextResponse.json({ error: "Adjuster not configured" }, { status: 500 });
  }

  const dayStart = new Date(date);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const busyAppointments = await prisma.appointment.findMany({
    where: {
      startsAt: { gte: dayStart, lte: dayEnd },
      status: { in: [...ACTIVE_APPOINTMENT_STATUSES] },
    },
    select: { startsAt: true, endsAt: true },
  });

  const slots = computeAvailableSlots(date, adjuster.availability as WeeklyAvailability, busyAppointments);

  return NextResponse.json({ slots: slots.map((s) => s.toISOString()) });
}
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/availability/route.ts
git commit -m "feat: add availability API route"
```

---

### Task 8: Create Appointment API Route (integration test)

**Files:**
- Create: `src/app/api/appointments/route.ts`
- Test: `tests/api/appointments.test.ts`

**Interfaces:**
- Consumes: `isAtLeastAdvanceHours`, `ACTIVE_APPOINTMENT_STATUSES` (Task 4), `SLOT_DURATION_MINUTES` (Task 3), `sendConfirmationEmail` (Task 6), `prisma` (Task 2).
- Produces: `POST /api/appointments` → `201 { appointment }` on success, `422`/`409`/`400` on rule violations.

This task requires a real Postgres test database. Point `DATABASE_URL` at a disposable database before running the tests (e.g. a local `ajustador_citas_test` database with migrations applied via `npx prisma migrate deploy`).

- [ ] **Step 1: Write the failing test**

```ts
// tests/api/appointments.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/appointments/route";
import { prisma } from "@/lib/db";

function nextMonday9am(): Date {
  const date = new Date();
  const daysUntilMonday = (1 + 7 - date.getDay()) % 7 || 7;
  date.setDate(date.getDate() + daysUntilMonday);
  date.setHours(9, 0, 0, 0);
  return date;
}

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost/api/appointments", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/appointments", () => {
  beforeEach(async () => {
    await prisma.appointment.deleteMany();
    await prisma.lead.deleteMany();
    await prisma.adjuster.deleteMany();
    await prisma.adjuster.create({
      data: {
        name: "Test Adjuster",
        email: "adjuster@test.com",
        phone: "555-0000",
        serviceAreas: "Test Area",
        availability: {
          mon: ["09:00-17:00"],
          tue: ["09:00-17:00"],
          wed: ["09:00-17:00"],
          thu: ["09:00-17:00"],
          fri: ["09:00-17:00"],
        },
      },
    });
  });

  it("creates an appointment for a valid request", async () => {
    const startsAt = nextMonday9am();
    const response = await POST(
      makeRequest({
        firstName: "Ana",
        lastName: "Gomez",
        email: "ana@test.com",
        phone: "555-1111",
        language: "es",
        startsAt: startsAt.toISOString(),
      })
    );

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.appointment.status).toBe("pending");
  });

  it("rejects an appointment less than 24 hours away", async () => {
    const startsAt = new Date(Date.now() + 60 * 60 * 1000);
    const response = await POST(
      makeRequest({
        firstName: "Ana",
        lastName: "Gomez",
        email: "ana2@test.com",
        phone: "555-1111",
        language: "es",
        startsAt: startsAt.toISOString(),
      })
    );

    expect(response.status).toBe(422);
  });

  it("rejects a second active appointment for the same lead", async () => {
    const startsAt = nextMonday9am();
    await POST(
      makeRequest({
        firstName: "Ana",
        lastName: "Gomez",
        email: "ana3@test.com",
        phone: "555-1111",
        language: "es",
        startsAt: startsAt.toISOString(),
      })
    );

    const secondStartsAt = new Date(startsAt.getTime() + 2 * 60 * 60 * 1000);
    const response = await POST(
      makeRequest({
        firstName: "Ana",
        lastName: "Gomez",
        email: "ana3@test.com",
        phone: "555-1111",
        language: "es",
        startsAt: secondStartsAt.toISOString(),
      })
    );

    expect(response.status).toBe(409);
  });

  it("rejects a second lead booking the same slot", async () => {
    const startsAt = nextMonday9am();
    await POST(
      makeRequest({
        firstName: "Ana",
        lastName: "Gomez",
        email: "ana4@test.com",
        phone: "555-1111",
        language: "es",
        startsAt: startsAt.toISOString(),
      })
    );

    const response = await POST(
      makeRequest({
        firstName: "Beto",
        lastName: "Ruiz",
        email: "beto@test.com",
        phone: "555-2222",
        language: "es",
        startsAt: startsAt.toISOString(),
      })
    );

    expect(response.status).toBe(409);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/api/appointments.test.ts`
Expected: FAIL — `Cannot find module '@/app/api/appointments/route'`

- [ ] **Step 3: Write the implementation**

```ts
// src/app/api/appointments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAtLeastAdvanceHours, ACTIVE_APPOINTMENT_STATUSES } from "@/lib/booking";
import { SLOT_DURATION_MINUTES } from "@/lib/availability";
import { sendConfirmationEmail } from "@/lib/email";

type CreateAppointmentBody = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  language: "en" | "es";
  startsAt: string;
};

export async function POST(request: NextRequest) {
  const body = (await request.json()) as Partial<CreateAppointmentBody>;

  if (!body.firstName || !body.lastName || !body.email || !body.phone || !body.startsAt || !body.language) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const startsAt = new Date(body.startsAt);
  if (Number.isNaN(startsAt.getTime())) {
    return NextResponse.json({ error: "Invalid startsAt" }, { status: 400 });
  }

  if (!isAtLeastAdvanceHours(startsAt, new Date())) {
    return NextResponse.json(
      { error: "Appointments must be booked at least 24 hours in advance" },
      { status: 422 }
    );
  }

  const endsAt = new Date(startsAt.getTime() + SLOT_DURATION_MINUTES * 60_000);

  try {
    const appointment = await prisma.$transaction(
      async (tx) => {
        const lead = await tx.lead.upsert({
          where: { email: body.email! },
          update: {
            firstName: body.firstName!,
            lastName: body.lastName!,
            phone: body.phone!,
            language: body.language!,
          },
          create: {
            firstName: body.firstName!,
            lastName: body.lastName!,
            email: body.email!,
            phone: body.phone!,
            language: body.language!,
          },
        });

        const activeLeadAppointments = await tx.appointment.findMany({
          where: { leadId: lead.id, status: { in: [...ACTIVE_APPOINTMENT_STATUSES] } },
        });
        if (activeLeadAppointments.length > 0) {
          throw new Error("LEAD_HAS_ACTIVE_APPOINTMENT");
        }

        const overlapping = await tx.appointment.findFirst({
          where: {
            status: { in: [...ACTIVE_APPOINTMENT_STATUSES] },
            startsAt: { lt: endsAt },
            endsAt: { gt: startsAt },
          },
        });
        if (overlapping) {
          throw new Error("SLOT_TAKEN");
        }

        const created = await tx.appointment.create({
          data: { leadId: lead.id, startsAt, endsAt, status: "pending" },
        });

        await tx.lead.update({ where: { id: lead.id }, data: { status: "scheduled" } });

        return created;
      },
      { isolationLevel: "Serializable" }
    );

    const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${body.language}/cancel/${appointment.cancelToken}`;
    await sendConfirmationEmail({
      to: body.email!,
      language: body.language!,
      leadFirstName: body.firstName!,
      startsAt,
      cancelUrl,
    });

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "SLOT_TAKEN") {
      return NextResponse.json({ error: "This time slot is no longer available" }, { status: 409 });
    }
    if (error instanceof Error && error.message === "LEAD_HAS_ACTIVE_APPOINTMENT") {
      return NextResponse.json({ error: "You already have an active appointment" }, { status: 409 });
    }
    console.error("Failed to create appointment", error);
    return NextResponse.json({ error: "Failed to create appointment" }, { status: 500 });
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/api/appointments.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/app/api/appointments/route.ts tests/api/appointments.test.ts
git commit -m "feat: add create-appointment API route with booking rules"
```

---

### Task 9: Cancel & Admin Status-Update Appointment Routes

**Files:**
- Create: `src/app/api/appointments/cancel/[token]/route.ts`
- Create: `src/app/api/appointments/[id]/route.ts`

**Interfaces:**
- Consumes: `prisma` (Task 2), `requireAdminSession` (Task 5).
- Produces: `POST /api/appointments/cancel/[token]` → `{ appointment }`; `PATCH /api/appointments/[id]` (admin-only) → `{ appointment }`.

- [ ] **Step 1: Write `src/app/api/appointments/cancel/[token]/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest, { params }: { params: { token: string } }) {
  const appointment = await prisma.appointment.findUnique({ where: { cancelToken: params.token } });
  if (!appointment) {
    return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  }

  const updated = await prisma.appointment.update({
    where: { id: appointment.id },
    data: { status: "cancelled" },
  });

  return NextResponse.json({ appointment: updated });
}
```

- [ ] **Step 2: Write `src/app/api/appointments/[id]/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth";

const VALID_STATUSES = ["pending", "confirmed", "completed", "cancelled", "rescheduled"] as const;

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const isAuthenticated = await requireAdminSession(request);
  if (!isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const status = body.status as string | undefined;

  if (!status || !VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const appointment = await prisma.appointment.update({
    where: { id: params.id },
    data: { status: status as (typeof VALID_STATUSES)[number] },
  });

  return NextResponse.json({ appointment });
}
```

- [ ] **Step 3: Verify compilation**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/appointments/cancel src/app/api/appointments/[id]
git commit -m "feat: add cancel and admin status-update appointment routes"
```

---

### Task 10: Admin Login & Appointments List API Routes

**Files:**
- Create: `src/app/api/admin/login/route.ts`
- Create: `src/app/api/admin/appointments/route.ts`

**Interfaces:**
- Consumes: `createSessionToken`, `SESSION_COOKIE`, `requireAdminSession` (Task 5), `prisma` (Task 2).
- Produces: `POST /api/admin/login` → sets `admin_session` cookie; `GET /api/admin/appointments` (admin-only) → `{ appointments }`.

- [ ] **Step 1: Write `src/app/api/admin/login/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, SESSION_COOKIE } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  const isValid = email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD;

  if (!isValid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE, createSessionToken(), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
  return response;
}
```

- [ ] **Step 2: Write `src/app/api/admin/appointments/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const isAuthenticated = await requireAdminSession(request);
  if (!isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const appointments = await prisma.appointment.findMany({
    include: { lead: true },
    orderBy: { startsAt: "asc" },
  });

  return NextResponse.json({ appointments });
}
```

- [ ] **Step 3: Verify compilation**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/admin/login src/app/api/admin/appointments
git commit -m "feat: add admin login and appointments-list API routes"
```

---

### Task 11: No-Response Cron Job

**Files:**
- Create: `src/app/api/cron/no-response/route.ts`
- Create: `vercel.json`

**Interfaces:**
- Consumes: `prisma` (Task 2), `CRON_SECRET` env var.
- Produces: `GET /api/cron/no-response` → `{ processed: number }`.

- [ ] **Step 1: Write `src/app/api/cron/no-response/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  const staleAppointments = await prisma.appointment.findMany({
    where: { status: "pending", startsAt: { lt: now } },
  });

  for (const appointment of staleAppointments) {
    await prisma.$transaction([
      prisma.appointment.update({
        where: { id: appointment.id },
        data: { status: "cancelled" },
      }),
      prisma.lead.update({
        where: { id: appointment.leadId },
        data: { status: "no_response" },
      }),
      prisma.followUp.create({
        data: { leadId: appointment.leadId, result: "no_response_auto" },
      }),
    ]);
  }

  return NextResponse.json({ processed: staleAppointments.length });
}
```

- [ ] **Step 2: Write `vercel.json`**

```json
{
  "crons": [{ "path": "/api/cron/no-response", "schedule": "0 * * * *" }]
}
```

- [ ] **Step 3: Verify compilation**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/cron/no-response vercel.json
git commit -m "feat: add hourly no-response cron job"
```

---

### Task 12: i18n Dictionary

**Files:**
- Create: `src/lib/i18n.ts`

**Interfaces:**
- Produces: `Locale`, `locales`, `defaultLocale`, `getDictionary(locale)`, `isValidLocale(value)`.

- [ ] **Step 1: Write `src/lib/i18n.ts`**

```ts
export type Locale = "en" | "es";

export const locales: Locale[] = ["en", "es"];
export const defaultLocale: Locale = "es";

export const dictionary = {
  en: {
    heroTitle: "Fast, reliable insurance inspections",
    heroSubtitle: "Book your inspection appointment online in minutes.",
    scheduleCta: "Schedule an inspection",
    contactFormTitle: "Have a question? Contact us",
  },
  es: {
    heroTitle: "Inspecciones de seguros rápidas y confiables",
    heroSubtitle: "Agenda tu cita de inspección en línea en minutos.",
    scheduleCta: "Agendar una inspección",
    contactFormTitle: "¿Tienes una pregunta? Contáctanos",
  },
} as const;

export function getDictionary(locale: Locale) {
  return dictionary[locale] ?? dictionary[defaultLocale];
}

export function isValidLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}
```

- [ ] **Step 2: Write the test**

```ts
// tests/lib/i18n.test.ts
import { describe, it, expect } from "vitest";
import { getDictionary, isValidLocale } from "@/lib/i18n";

describe("i18n", () => {
  it("returns the English dictionary for 'en'", () => {
    expect(getDictionary("en").scheduleCta).toBe("Schedule an inspection");
  });

  it("returns the Spanish dictionary for 'es'", () => {
    expect(getDictionary("es").scheduleCta).toBe("Agendar una inspección");
  });

  it("validates known locales", () => {
    expect(isValidLocale("en")).toBe(true);
    expect(isValidLocale("fr")).toBe(false);
  });
});
```

- [ ] **Step 3: Run the test**

Run: `npx vitest run tests/lib/i18n.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 4: Commit**

```bash
git add src/lib/i18n.ts tests/lib/i18n.test.ts
git commit -m "feat: add en/es i18n dictionary"
```

---

### Task 13: Public Landing & Schedule Pages

**Files:**
- Create: `src/app/[locale]/layout.tsx`
- Create: `src/app/[locale]/page.tsx`
- Create: `src/app/[locale]/schedule/page.tsx`

**Interfaces:**
- Consumes: `isValidLocale`, `getDictionary`, `defaultLocale` (Task 12), `GET /api/availability` (Task 7), `POST /api/appointments` (Task 8).

- [ ] **Step 1: Write `src/app/[locale]/layout.tsx`**

```tsx
import { isValidLocale } from "@/lib/i18n";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "es" }];
}

export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!isValidLocale(params.locale)) {
    notFound();
  }
  return <>{children}</>;
}
```

- [ ] **Step 2: Write `src/app/[locale]/page.tsx`**

```tsx
import Link from "next/link";
import { getDictionary, isValidLocale, defaultLocale } from "@/lib/i18n";

export default function LandingPage({ params }: { params: { locale: string } }) {
  const locale = isValidLocale(params.locale) ? params.locale : defaultLocale;
  const t = getDictionary(locale);

  return (
    <main>
      <h1>{t.heroTitle}</h1>
      <p>{t.heroSubtitle}</p>
      <Link href={`/${locale}/schedule`}>{t.scheduleCta}</Link>
    </main>
  );
}
```

- [ ] **Step 3: Write `src/app/[locale]/schedule/page.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getDictionary, isValidLocale, defaultLocale } from "@/lib/i18n";

export default function SchedulePage() {
  const params = useParams<{ locale: string }>();
  const locale = isValidLocale(params.locale) ? params.locale : defaultLocale;
  const t = getDictionary(locale);

  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "" });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!date) return;
    fetch(`/api/availability?date=${date}`)
      .then((res) => res.json())
      .then((data) => setSlots(data.slots ?? []));
  }, [date]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedSlot) return;

    setStatus("submitting");
    const response = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, language: locale, startsAt: selectedSlot }),
    });

    if (response.ok) {
      setStatus("success");
    } else {
      const data = await response.json();
      setErrorMessage(data.error ?? "Unknown error");
      setStatus("error");
    }
  }

  if (status === "success") {
    return <p>{locale === "en" ? "Your appointment is confirmed!" : "¡Tu cita está confirmada!"}</p>;
  }

  return (
    <main>
      <h1>{t.scheduleCta}</h1>
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <ul>
        {slots.map((slot) => (
          <li key={slot}>
            <button type="button" onClick={() => setSelectedSlot(slot)}>
              {new Date(slot).toLocaleTimeString(locale === "en" ? "en-US" : "es-ES", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </button>
          </li>
        ))}
      </ul>

      {selectedSlot && (
        <form onSubmit={handleSubmit}>
          <input
            required
            placeholder={locale === "en" ? "First name" : "Nombre"}
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
          />
          <input
            required
            placeholder={locale === "en" ? "Last name" : "Apellido"}
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
          />
          <input
            required
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            required
            placeholder={locale === "en" ? "Phone" : "Teléfono"}
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <button type="submit" disabled={status === "submitting"}>
            {t.scheduleCta}
          </button>
          {status === "error" && <p role="alert">{errorMessage}</p>}
        </form>
      )}
    </main>
  );
}
```

- [ ] **Step 4: Verify compilation**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add "src/app/[locale]"
git commit -m "feat: add bilingual landing and schedule pages"
```

---

### Task 14: Cancel Page

**Files:**
- Create: `src/app/[locale]/cancel/[token]/page.tsx`

**Interfaces:**
- Consumes: `isValidLocale`, `defaultLocale` (Task 12), `POST /api/appointments/cancel/[token]` (Task 9).

- [ ] **Step 1: Write `src/app/[locale]/cancel/[token]/page.tsx`**

```tsx
"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { isValidLocale, defaultLocale } from "@/lib/i18n";

export default function CancelPage() {
  const params = useParams<{ locale: string; token: string }>();
  const locale = isValidLocale(params.locale) ? params.locale : defaultLocale;
  const [status, setStatus] = useState<"idle" | "cancelling" | "done" | "error">("idle");

  async function handleCancel() {
    setStatus("cancelling");
    const response = await fetch(`/api/appointments/cancel/${params.token}`, { method: "POST" });
    setStatus(response.ok ? "done" : "error");
  }

  if (status === "done") {
    return <p>{locale === "en" ? "Your appointment has been cancelled." : "Tu cita ha sido cancelada."}</p>;
  }

  return (
    <main>
      <p>{locale === "en" ? "Cancel your appointment?" : "¿Cancelar tu cita?"}</p>
      <button onClick={handleCancel} disabled={status === "cancelling"}>
        {locale === "en" ? "Confirm cancellation" : "Confirmar cancelación"}
      </button>
      {status === "error" && (
        <p role="alert">{locale === "en" ? "Something went wrong." : "Algo salió mal."}</p>
      )}
    </main>
  );
}
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "src/app/[locale]/cancel"
git commit -m "feat: add self-service appointment cancellation page"
```

---

### Task 15: Admin Dashboard Pages

**Files:**
- Create: `src/app/admin/layout.tsx`
- Create: `src/app/admin/login/page.tsx`
- Create: `src/app/admin/page.tsx`
- Create: `src/app/admin/AppointmentRow.tsx`

**Interfaces:**
- Consumes: `SESSION_COOKIE`, `verifySessionToken` (Task 5), `prisma` (Task 2), `PATCH /api/appointments/[id]` (Task 9), `POST /api/admin/login` (Task 10).

- [ ] **Step 1: Write `src/app/admin/layout.tsx`**

```tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token || !verifySessionToken(token)) {
    redirect("/admin/login");
  }
  return <>{children}</>;
}
```

- [ ] **Step 2: Write `src/app/admin/login/page.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
      router.push("/admin");
    } else {
      setError("Credenciales inválidas");
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>Admin Login</h1>
      <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
      <input
        type="password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button type="submit">Entrar</button>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
```

- [ ] **Step 3: Write `src/app/admin/AppointmentRow.tsx`**

```tsx
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
```

- [ ] **Step 4: Write `src/app/admin/page.tsx`**

```tsx
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
```

- [ ] **Step 5: Verify compilation**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/admin
git commit -m "feat: add admin dashboard with appointment management"
```

---

### Task 16: Seed Script & Deployment Readiness

**Files:**
- Create: `prisma/seed.ts`

**Interfaces:**
- Consumes: `PrismaClient`, `ADMIN_EMAIL`, `ADJUSTER_NAME`, `ADJUSTER_PHONE`, `ADJUSTER_SERVICE_AREAS` env vars.
- Produces: one `Adjuster` row with a Mon–Fri 09:00–17:00 schedule, used by `/api/availability` and manual QA.

- [ ] **Step 1: Write `prisma/seed.ts`**

```ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.adjuster.findFirst();
  if (existing) {
    console.log("Adjuster already exists, skipping seed.");
    return;
  }

  await prisma.adjuster.create({
    data: {
      name: process.env.ADJUSTER_NAME ?? "Ajustador",
      email: process.env.ADMIN_EMAIL ?? "ajustador@example.com",
      phone: process.env.ADJUSTER_PHONE ?? "555-0000",
      serviceAreas: process.env.ADJUSTER_SERVICE_AREAS ?? "Área metropolitana",
      availability: {
        mon: ["09:00-17:00"],
        tue: ["09:00-17:00"],
        wed: ["09:00-17:00"],
        thu: ["09:00-17:00"],
        fri: ["09:00-17:00"],
      },
    },
  });

  console.log("Seeded adjuster record.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

- [ ] **Step 2: Run the seed script against the local database**

Run: `npx prisma db seed`
Expected: "Seeded adjuster record." printed, one row in the `Adjuster` table.

- [ ] **Step 3: Run the full test suite end to end**

Run: `npm test`
Expected: all test files pass (availability, booking, auth, i18n, appointments API).

- [ ] **Step 4: Manual verification in the browser**

Run: `npm run dev`, then in a browser:
1. Visit `/es/schedule`, pick a date at least 2 days out, pick a slot, submit the form with test data — confirm the success message appears and a confirmation email arrives (check Resend dashboard/logs).
2. Visit `/en/schedule` and repeat in English.
3. Visit `/admin/login`, log in with `ADMIN_EMAIL`/`ADMIN_PASSWORD`, confirm the new appointment appears on `/admin`, and mark it "Completada".
4. Open the cancellation link from the confirmation email and confirm the appointment status changes to `cancelled` and the slot reopens on `/es/schedule`.

- [ ] **Step 5: Commit**

```bash
git add prisma/seed.ts
git commit -m "feat: add adjuster seed script"
```

---

### Task 17: Reminder & Follow-up Emails Cron Job

**Files:**
- Modify: `src/lib/email.ts`
- Create: `src/app/api/cron/reminders/route.ts`
- Modify: `vercel.json`
- Modify: `src/app/api/appointments/[id]/route.ts:1-27` (send follow-up on transition to `completed`)

**Interfaces:**
- Consumes: `prisma` (Task 2), `CRON_SECRET` env var, `Appointment.status` transitions (Task 4/9).
- Produces: `sendReminderEmail(...)`, `sendFollowUpEmail(...)` in `src/lib/email.ts`; `GET /api/cron/reminders` → `{ sent: number }`; a follow-up email fires automatically when an admin marks an appointment `completed`.

- [ ] **Step 1: Add reminder and follow-up senders to `src/lib/email.ts`**

Append below `sendConfirmationEmail`:

```ts
type ReminderEmailParams = {
  to: string;
  language: "en" | "es";
  leadFirstName: string;
  startsAt: Date;
  cancelUrl: string;
};

const REMINDER_SUBJECT = {
  en: "Reminder: your inspection appointment is tomorrow",
  es: "Recordatorio: tu cita de inspección es mañana",
};

function formatReminderBody(params: ReminderEmailParams): string {
  const formattedDate = params.startsAt.toLocaleString(
    params.language === "en" ? "en-US" : "es-ES",
    { dateStyle: "full", timeStyle: "short" }
  );

  if (params.language === "en") {
    return `Hi ${params.leadFirstName},\n\nThis is a reminder that your inspection appointment is on ${formattedDate}.\n\nNeed to cancel or reschedule? ${params.cancelUrl}\n\nSee you soon!`;
  }

  return `Hola ${params.leadFirstName},\n\nEste es un recordatorio de que tu cita de inspección es el ${formattedDate}.\n\n¿Necesitas cancelar o reprogramar? ${params.cancelUrl}\n\n¡Nos vemos pronto!`;
}

export async function sendReminderEmail(params: ReminderEmailParams): Promise<{ success: boolean }> {
  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: params.to,
      subject: REMINDER_SUBJECT[params.language],
      text: formatReminderBody(params),
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send reminder email", error);
    return { success: false };
  }
}

type FollowUpEmailParams = {
  to: string;
  language: "en" | "es";
  leadFirstName: string;
};

const FOLLOW_UP_SUBJECT = {
  en: "Thanks for your inspection",
  es: "Gracias por tu inspección",
};

function formatFollowUpBody(params: FollowUpEmailParams): string {
  if (params.language === "en") {
    return `Hi ${params.leadFirstName},\n\nThank you for completing your inspection with us. If you have any questions about next steps, just reply to this email.\n\nBest regards.`;
  }

  return `Hola ${params.leadFirstName},\n\nGracias por completar tu inspección con nosotros. Si tienes preguntas sobre los siguientes pasos, responde este correo.\n\nSaludos.`;
}

export async function sendFollowUpEmail(params: FollowUpEmailParams): Promise<{ success: boolean }> {
  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: params.to,
      subject: FOLLOW_UP_SUBJECT[params.language],
      text: formatFollowUpBody(params),
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send follow-up email", error);
    return { success: false };
  }
}
```

- [ ] **Step 2: Write `src/app/api/cron/reminders/route.ts`**

Sends a reminder for every `pending`/`confirmed` appointment starting between 23 and 25 hours from now (a 2-hour window matched against an hourly cron so each appointment gets exactly one reminder).

```ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendReminderEmail } from "@/lib/email";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const windowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);

  const dueAppointments = await prisma.appointment.findMany({
    where: {
      status: { in: ["pending", "confirmed"] },
      startsAt: { gte: windowStart, lte: windowEnd },
    },
    include: { lead: true },
  });

  for (const appointment of dueAppointments) {
    const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${appointment.lead.language}/cancel/${appointment.cancelToken}`;
    await sendReminderEmail({
      to: appointment.lead.email,
      language: appointment.lead.language === "en" ? "en" : "es",
      leadFirstName: appointment.lead.firstName,
      startsAt: appointment.startsAt,
      cancelUrl,
    });
  }

  return NextResponse.json({ sent: dueAppointments.length });
}
```

- [ ] **Step 3: Add the reminders cron to `vercel.json`**

```json
{
  "crons": [
    { "path": "/api/cron/no-response", "schedule": "0 * * * *" },
    { "path": "/api/cron/reminders", "schedule": "0 * * * *" }
  ]
}
```

- [ ] **Step 4: Send the follow-up email when an appointment is marked completed**

Modify `src/app/api/appointments/[id]/route.ts` — replace the `PATCH` handler body with:

```ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth";
import { sendFollowUpEmail } from "@/lib/email";

const VALID_STATUSES = ["pending", "confirmed", "completed", "cancelled", "rescheduled"] as const;

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const isAuthenticated = await requireAdminSession(request);
  if (!isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const status = body.status as string | undefined;

  if (!status || !VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const appointment = await prisma.appointment.update({
    where: { id: params.id },
    data: { status: status as (typeof VALID_STATUSES)[number] },
    include: { lead: true },
  });

  if (status === "completed") {
    await sendFollowUpEmail({
      to: appointment.lead.email,
      language: appointment.lead.language === "en" ? "en" : "es",
      leadFirstName: appointment.lead.firstName,
    });
  }

  return NextResponse.json({ appointment });
}
```

- [ ] **Step 5: Verify compilation**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/lib/email.ts src/app/api/cron/reminders vercel.json "src/app/api/appointments/[id]/route.ts"
git commit -m "feat: send appointment reminders and post-inspection follow-up emails"
```

---

## Deployment Notes (not automated by this plan)

- Provision a PostgreSQL database (Neon or Supabase) and set `DATABASE_URL` in Vercel project settings.
- Set `RESEND_API_KEY`, `SESSION_SECRET` (a long random string), `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `CRON_SECRET`, and `NEXT_PUBLIC_APP_URL` (the production URL) as Vercel environment variables.
- Run `npx prisma migrate deploy` against the production database as part of the deploy step.
- Run `npx prisma db seed` once against production to create the `Adjuster` row (or create it manually with the adjuster's real schedule).
- Verify the Vercel Cron job (`vercel.json`) is enabled in the project's Cron tab after the first deploy.
