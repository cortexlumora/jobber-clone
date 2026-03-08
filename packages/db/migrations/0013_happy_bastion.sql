CREATE TYPE "public"."team_reminder" AS ENUM('none', 'at_start', '30min', '1hour', '2hour', '5hour', '24hour');--> statement-breakpoint
CREATE TABLE "request_line_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"qty" integer DEFAULT 1 NOT NULL,
	"unit_price" numeric(10, 2) DEFAULT '0' NOT NULL,
	"image_file_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "requests" ADD COLUMN "assessment_instructions" text;--> statement-breakpoint
ALTER TABLE "requests" ADD COLUMN "assessment_start_date" varchar(10);--> statement-breakpoint
ALTER TABLE "requests" ADD COLUMN "assessment_end_date" varchar(10);--> statement-breakpoint
ALTER TABLE "requests" ADD COLUMN "assessment_start_time" varchar(5);--> statement-breakpoint
ALTER TABLE "requests" ADD COLUMN "assessment_end_time" varchar(5);--> statement-breakpoint
ALTER TABLE "requests" ADD COLUMN "schedule_later" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "requests" ADD COLUMN "anytime" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "requests" ADD COLUMN "team_reminder" "team_reminder" DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "request_line_items" ADD CONSTRAINT "request_line_items_request_id_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_line_items" ADD CONSTRAINT "request_line_items_image_file_id_files_id_fk" FOREIGN KEY ("image_file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;