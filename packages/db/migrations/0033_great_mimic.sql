CREATE TYPE "public"."visit_status" AS ENUM('scheduled', 'completed', 'cancelled');--> statement-breakpoint
CREATE TABLE "visits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"instructions" text,
	"start_date" varchar(10),
	"end_date" varchar(10),
	"start_time" varchar(5),
	"end_time" varchar(5),
	"schedule_later" boolean DEFAULT false NOT NULL,
	"anytime" boolean DEFAULT false NOT NULL,
	"assigned_to" varchar(255),
	"email_on_assign" boolean DEFAULT false NOT NULL,
	"team_reminder" "team_reminder" DEFAULT 'none' NOT NULL,
	"reminder_schedule_name" varchar(255),
	"reminder_scheduled_at" timestamp with time zone,
	"reminder_processed_at" timestamp with time zone,
	"status" "visit_status" DEFAULT 'scheduled' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "visits" ADD CONSTRAINT "visits_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;