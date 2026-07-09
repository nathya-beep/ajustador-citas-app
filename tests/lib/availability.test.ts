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
