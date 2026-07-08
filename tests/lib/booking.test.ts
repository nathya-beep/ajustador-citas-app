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
