CREATE TABLE "request_assessments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"instructions" text,
	"start_date" varchar(10),
	"end_date" varchar(10),
	"start_time" varchar(5),
	"end_time" varchar(5),
	"schedule_later" boolean DEFAULT false NOT NULL,
	"anytime" boolean DEFAULT false NOT NULL,
	"team_reminder" "team_reminder" DEFAULT 'none' NOT NULL,
	"reminder_schedule_name" varchar(255),
	"reminder_scheduled_at" timestamp with time zone,
	"reminder_processed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "request_assessments_request_id_unique" UNIQUE("request_id")
);
--> statement-breakpoint
ALTER TABLE "request_assessments" ADD CONSTRAINT "request_assessments_request_id_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requests" DROP COLUMN "assessment_instructions";--> statement-breakpoint
ALTER TABLE "requests" DROP COLUMN "assessment_start_date";--> statement-breakpoint
ALTER TABLE "requests" DROP COLUMN "assessment_end_date";--> statement-breakpoint
ALTER TABLE "requests" DROP COLUMN "assessment_start_time";--> statement-breakpoint
ALTER TABLE "requests" DROP COLUMN "assessment_end_time";--> statement-breakpoint
ALTER TABLE "requests" DROP COLUMN "schedule_later";--> statement-breakpoint
ALTER TABLE "requests" DROP COLUMN "anytime";--> statement-breakpoint
ALTER TABLE "requests" DROP COLUMN "team_reminder";--> statement-breakpoint
ALTER TABLE "requests" DROP COLUMN "reminder_schedule_name";--> statement-breakpoint
ALTER TABLE "requests" DROP COLUMN "reminder_scheduled_at";--> statement-breakpoint
ALTER TABLE "requests" DROP COLUMN "reminder_processed_at";