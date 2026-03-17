CREATE TYPE "public"."invoice_reminder_status" AS ENUM('scheduled', 'completed', 'cancelled');--> statement-breakpoint
CREATE TABLE "invoice_reminders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"details" text,
	"start_date" varchar(10),
	"end_date" varchar(10),
	"start_time" varchar(5),
	"end_time" varchar(5),
	"schedule_later" boolean DEFAULT false NOT NULL,
	"all_day" boolean DEFAULT true NOT NULL,
	"assigned_user_ids" jsonb,
	"email_team" boolean DEFAULT false NOT NULL,
	"status" "invoice_reminder_status" DEFAULT 'scheduled' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "invoice_reminders" ADD CONSTRAINT "invoice_reminders_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;