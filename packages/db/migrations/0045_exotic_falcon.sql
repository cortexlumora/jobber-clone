CREATE TYPE "public"."schedule_status" AS ENUM('pending', 'active', 'paused', 'completed', 'failed');--> statement-breakpoint
CREATE TABLE "job_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"start_date" varchar(10),
	"start_time" varchar(5),
	"end_time" varchar(5),
	"schedule_later" boolean DEFAULT false NOT NULL,
	"anytime" boolean DEFAULT false NOT NULL,
	"repeats" varchar(50),
	"repeat_day" varchar(10),
	"repeat_days" jsonb,
	"ends_type" "ends_type",
	"ends_after_value" varchar(10),
	"ends_after_unit" varchar(20),
	"ends_after_visits" integer,
	"ends_on_date" varchar(10),
	"visit_instructions" text,
	"email_team_about_assignment" boolean DEFAULT false NOT NULL,
	"schedule_arn" varchar(512),
	"schedule_name" varchar(255),
	"schedule_status" "schedule_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "job_schedules_job_id_unique" UNIQUE("job_id")
);
--> statement-breakpoint
ALTER TABLE "job_schedules" ADD CONSTRAINT "job_schedules_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
INSERT INTO "job_schedules" ("job_id", "start_date", "start_time", "end_time", "schedule_later", "anytime", "repeats", "repeat_day", "repeat_days", "ends_type", "ends_after_value", "ends_after_unit", "ends_after_visits", "ends_on_date", "visit_instructions", "email_team_about_assignment")
SELECT "id", "start_date", "start_time", "end_time", COALESCE("schedule_later", false), COALESCE("anytime", false), "repeats", "repeat_day", "repeat_days", "ends_type", "ends_after_value", "ends_after_unit", "ends_after_visits", "ends_on_date", "visit_instructions", COALESCE("email_team_about_assignment", false)
FROM "jobs";--> statement-breakpoint
ALTER TABLE "jobs" DROP COLUMN "start_date";--> statement-breakpoint
ALTER TABLE "jobs" DROP COLUMN "start_time";--> statement-breakpoint
ALTER TABLE "jobs" DROP COLUMN "end_time";--> statement-breakpoint
ALTER TABLE "jobs" DROP COLUMN "schedule_later";--> statement-breakpoint
ALTER TABLE "jobs" DROP COLUMN "anytime";--> statement-breakpoint
ALTER TABLE "jobs" DROP COLUMN "repeats";--> statement-breakpoint
ALTER TABLE "jobs" DROP COLUMN "repeat_day";--> statement-breakpoint
ALTER TABLE "jobs" DROP COLUMN "repeat_days";--> statement-breakpoint
ALTER TABLE "jobs" DROP COLUMN "ends_type";--> statement-breakpoint
ALTER TABLE "jobs" DROP COLUMN "ends_after_value";--> statement-breakpoint
ALTER TABLE "jobs" DROP COLUMN "ends_after_unit";--> statement-breakpoint
ALTER TABLE "jobs" DROP COLUMN "ends_after_visits";--> statement-breakpoint
ALTER TABLE "jobs" DROP COLUMN "ends_on_date";--> statement-breakpoint
ALTER TABLE "jobs" DROP COLUMN "visit_instructions";--> statement-breakpoint
ALTER TABLE "jobs" DROP COLUMN "email_team_about_assignment";