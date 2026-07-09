import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET as remindersGet } from "@/app/api/cron/reminders/route";
import { GET as noResponseGet } from "@/app/api/cron/no-response/route";
import { prisma } from "@/lib/db";

// Safety guard: prevent this test file from running against non-test databases
if (!process.env.DATABASE_URL?.includes("_test")) {
  throw new Error(
    'Refusing to run tests/api/cron.test.ts: DATABASE_URL does not point at a "_test" database. ' +
    "This test file deletes all Appointment/Lead/Adjuster rows in its beforeEach. " +
    'Set DATABASE_URL to a database whose name contains "_test" before running this file, e.g.:\n' +
    '  DATABASE_URL="postgresql://ajustador:ajustador_dev_pw@localhost:5432/ajustador_citas_test" npx vitest run tests/api/cron.test.ts'
  );
}

function makeCronRequest(url: string, authHeader?: string): NextRequest {
  const headers: Record<string, string> = {};
  if (authHeader !== undefined) {
    headers["authorization"] = authHeader;
  }
  return new NextRequest(url, { method: "GET", headers });
}

describe("cron routes auth", () => {
  const originalCronSecret = process.env.CRON_SECRET;

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

  afterEach(() => {
    if (originalCronSecret === undefined) {
      delete process.env.CRON_SECRET;
    } else {
      process.env.CRON_SECRET = originalCronSecret;
    }
  });

  describe("GET /api/cron/reminders", () => {
    it("rejects when CRON_SECRET is unset", async () => {
      delete process.env.CRON_SECRET;
      const request = makeCronRequest("http://localhost/api/cron/reminders", "Bearer undefined");
      const response = await remindersGet(request);
      expect(response.status).toBe(401);
    });

    it("rejects with a wrong secret", async () => {
      process.env.CRON_SECRET = "correct-secret";
      const request = makeCronRequest("http://localhost/api/cron/reminders", "Bearer wrong-secret");
      const response = await remindersGet(request);
      expect(response.status).toBe(401);
    });

    it("accepts with the correct secret", async () => {
      process.env.CRON_SECRET = "correct-secret";
      const request = makeCronRequest("http://localhost/api/cron/reminders", "Bearer correct-secret");
      const response = await remindersGet(request);
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({ sent: 0 });
    });
  });

  describe("GET /api/cron/no-response", () => {
    it("rejects when CRON_SECRET is unset", async () => {
      delete process.env.CRON_SECRET;
      const request = makeCronRequest("http://localhost/api/cron/no-response", "Bearer undefined");
      const response = await noResponseGet(request);
      expect(response.status).toBe(401);
    });

    it("rejects with a wrong secret", async () => {
      process.env.CRON_SECRET = "correct-secret";
      const request = makeCronRequest("http://localhost/api/cron/no-response", "Bearer wrong-secret");
      const response = await noResponseGet(request);
      expect(response.status).toBe(401);
    });

    it("accepts with the correct secret", async () => {
      process.env.CRON_SECRET = "correct-secret";
      const request = makeCronRequest("http://localhost/api/cron/no-response", "Bearer correct-secret");
      const response = await noResponseGet(request);
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({ processed: 0 });
    });
  });
});
