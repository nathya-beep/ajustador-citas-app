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
