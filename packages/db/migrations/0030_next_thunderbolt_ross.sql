ALTER TABLE "requests" ADD COLUMN "reminder_schedule_name" varchar(255);--> statement-breakpoint
ALTER TABLE "requests" ADD COLUMN "reminder_scheduled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "requests" DROP COLUMN "internal_notes";