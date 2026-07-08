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
