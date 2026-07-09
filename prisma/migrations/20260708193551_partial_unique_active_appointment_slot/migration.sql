-- DropIndex
-- Remove the unconditional unique index on (startsAt, endsAt). It blocked re-booking a
-- freed slot because cancelled rows keep their original startsAt/endsAt.
DROP INDEX IF EXISTS "Appointment_startsAt_endsAt_key";

-- AlterTable
-- Fix #2: track when a reminder email was sent so the hourly cron does not send duplicates.
ALTER TABLE "Appointment" ADD COLUMN     "reminderSentAt" TIMESTAMP(3);

-- CreateIndex
-- Fix #1: partial unique index scoped to active statuses only, so cancelled/completed/rescheduled
-- rows no longer occupy the slot and it can be booked again.
CREATE UNIQUE INDEX "Appointment_active_slot_key" ON "Appointment" ("startsAt", "endsAt") WHERE "status" IN ('pending', 'confirmed');
