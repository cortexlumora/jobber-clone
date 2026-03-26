ALTER TABLE "jobs" ADD COLUMN "schedule_later" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "anytime" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "repeat_day" varchar(10);--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "ends_after_value" varchar(10);--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "ends_after_unit" varchar(20);--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "email_team_about_assignment" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "notes" text;