import { describe, it, expect, beforeEach, beforeAll, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/appointments/route";
import { POST as cancelAppointment } from "@/app/api/appointments/cancel/[token]/route";
import { PATCH as patchAppointment } from "@/app/api/appointments/[id]/route";
import { prisma } from "@/lib/db";
import { createSessionToken, SESSION_COOKIE } from "@/lib/auth";

// Mock the email layer so we can assert on send behavior (e.g. no duplicate follow-ups)
// without hitting the network. All senders report success by default.
vi.mock("@/lib/email", () => ({
  sendConfirmationEmail: vi.fn(async () => ({ success: true })),
  sendReminderEmail: vi.fn(async () => ({ success: true })),
  sendFollowUpEmail: vi.fn(async () => ({ success: true })),
}));

import { sendFollowUpEmail } from "@/lib/email";

// Safety guard: prevent this test file from running against non-test databases
if (!process.env.DATABASE_URL?.includes("_test")) {
  throw new Error(
    'Refusing to run tests/api/appointments.test.ts: DATABASE_URL does not point at a "_test" database. ' +
    "This test file deletes all Appointment/Lead/Adjuster rows in its beforeEach. " +
    'Set DATABASE_URL to a database whose name contains "_test" before running this file, e.g.:\n' +
    '  DATABASE_URL="postgresql://ajustador:ajustador_dev_pw@localhost:5432/ajustador_citas_test" npx vitest run tests/api/appointments.test.ts'
  );
}

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

  it("allows re-booking a slot after the original appointment is cancelled", async () => {
    const startsAt = nextMonday9am();
    const firstResponse = await POST(
      makeRequest({
        firstName: "Ana",
        lastName: "Gomez",
        email: "ana5@test.com",
        phone: "555-1111",
        language: "es",
        startsAt: startsAt.toISOString(),
      })
    );
    expect(firstResponse.status).toBe(201);
    const firstBody = await firstResponse.json();

    // Simulate the cancel route: mark the appointment as cancelled directly.
    await prisma.appointment.update({
      where: { id: firstBody.appointment.id },
      data: { status: "cancelled" },
    });

    // The freed slot must now be bookable again (partial unique index scoped to active statuses).
    const response = await POST(
      makeRequest({
        firstName: "Beto",
        lastName: "Ruiz",
        email: "beto2@test.com",
        phone: "555-2222",
        language: "es",
        startsAt: startsAt.toISOString(),
      })
    );

    expect(response.status).toBe(201);
  });

  it("rejects a booking outside the adjuster's available hours", async () => {
    // 22:00 on the next available weekday is outside the seeded Mon-Fri 09:00-17:00 window.
    const startsAt = nextMonday9am();
    startsAt.setHours(22, 0, 0, 0);
    const response = await POST(
      makeRequest({
        firstName: "Ana",
        lastName: "Gomez",
        email: "ana6@test.com",
        phone: "555-1111",
        language: "es",
        startsAt: startsAt.toISOString(),
      })
    );

    expect(response.status).toBe(422);
  });
});

let slotCounter = 0;

async function createLeadWithAppointment(status: "pending" | "confirmed" | "completed" | "cancelled") {
  const lead = await prisma.lead.create({
    data: {
      firstName: "Lia",
      lastName: "Test",
      email: `lia-${Math.random().toString(36).slice(2)}@test.com`,
      phone: "555-9999",
      language: "es",
    },
  });
  // Use a distinct slot per appointment so active (pending/confirmed) rows never collide
  // on the partial unique index (Appointment_active_slot_key).
  const startsAt = nextMonday9am();
  startsAt.setDate(startsAt.getDate() + slotCounter++);
  const endsAt = new Date(startsAt.getTime() + 60 * 60 * 1000);
  const appointment = await prisma.appointment.create({
    data: { leadId: lead.id, startsAt, endsAt, status },
  });
  return { lead, appointment };
}

describe("POST /api/appointments/cancel/[token]", () => {
  it("cancels an active (pending) appointment", async () => {
    const { appointment } = await createLeadWithAppointment("pending");
    const request = new NextRequest("http://localhost/api/appointments/cancel/x", { method: "POST" });
    const response = await cancelAppointment(request, { params: { token: appointment.cancelToken } });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.appointment.status).toBe("cancelled");
  });

  it("refuses to cancel an already-completed appointment (409) and leaves status unchanged", async () => {
    const { appointment } = await createLeadWithAppointment("completed");
    const request = new NextRequest("http://localhost/api/appointments/cancel/x", { method: "POST" });
    const response = await cancelAppointment(request, { params: { token: appointment.cancelToken } });

    expect(response.status).toBe(409);
    const stored = await prisma.appointment.findUnique({ where: { id: appointment.id } });
    expect(stored?.status).toBe("completed");
  });

  it("returns 404 for an unknown token", async () => {
    const request = new NextRequest("http://localhost/api/appointments/cancel/x", { method: "POST" });
    const response = await cancelAppointment(request, { params: { token: "does-not-exist" } });
    expect(response.status).toBe(404);
  });
});

describe("PATCH /api/appointments/[id]", () => {
  beforeAll(() => {
    process.env.SESSION_SECRET = "test-secret";
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function adminPatch(id: string, status: string): NextRequest {
    const request = new NextRequest(`http://localhost/api/appointments/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    request.cookies.set(SESSION_COOKIE, createSessionToken());
    return request;
  }

  it("sends the follow-up email once when transitioning into completed", async () => {
    const { appointment } = await createLeadWithAppointment("confirmed");
    const response = await patchAppointment(adminPatch(appointment.id, "completed"), {
      params: { id: appointment.id },
    });

    expect(response.status).toBe(200);
    expect(sendFollowUpEmail).toHaveBeenCalledTimes(1);
  });

  it("does not re-send the follow-up email on a repeated completed PATCH", async () => {
    const { appointment } = await createLeadWithAppointment("completed");
    const response = await patchAppointment(adminPatch(appointment.id, "completed"), {
      params: { id: appointment.id },
    });

    expect(response.status).toBe(200);
    expect(sendFollowUpEmail).not.toHaveBeenCalled();
  });

  it("rejects the removed 'rescheduled' status with 400", async () => {
    const { appointment } = await createLeadWithAppointment("confirmed");
    const response = await patchAppointment(adminPatch(appointment.id, "rescheduled"), {
      params: { id: appointment.id },
    });

    expect(response.status).toBe(400);
  });
});
