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
