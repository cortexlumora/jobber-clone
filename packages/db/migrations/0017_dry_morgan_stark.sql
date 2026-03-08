CREATE TYPE "public"."billing_type" AS ENUM('visit_based', 'fixed_price');--> statement-breakpoint
CREATE TYPE "public"."ends_type" AS ENUM('after', 'on');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('draft', 'active', 'action_required', 'complete', 'archived');--> statement-breakpoint
CREATE TYPE "public"."job_type" AS ENUM('one_off', 'recurring');--> statement-breakpoint
CREATE TABLE "job_files" (
	"job_id" uuid NOT NULL,
	"file_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "job_files_job_id_file_id_pk" PRIMARY KEY("job_id","file_id")
);
--> statement-breakpoint
CREATE TABLE "job_line_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"qty" integer DEFAULT 1 NOT NULL,
	"unit_cost" numeric(10, 2) DEFAULT '0' NOT NULL,
	"unit_price" numeric(10, 2) DEFAULT '0' NOT NULL,
	"image_file_id" uuid,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"job_number" varchar(50),
	"salesperson" varchar(255),
	"status" "job_status" DEFAULT 'draft' NOT NULL,
	"job_type" "job_type" DEFAULT 'one_off' NOT NULL,
	"start_date" varchar(10),
	"start_time" varchar(5),
	"end_time" varchar(5),
	"repeats" varchar(50),
	"repeat_days" jsonb,
	"ends_type" "ends_type",
	"ends_after_visits" integer,
	"ends_on_date" varchar(10),
	"visit_instructions" text,
	"assigned_user_ids" jsonb,
	"billing_type" "billing_type",
	"invoice_frequency" varchar(50),
	"auto_pay" boolean DEFAULT false NOT NULL,
	"notes" text,
	"related_quote_id" uuid,
	"related_request_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "job_files" ADD CONSTRAINT "job_files_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_files" ADD CONSTRAINT "job_files_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_line_items" ADD CONSTRAINT "job_line_items_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_line_items" ADD CONSTRAINT "job_line_items_image_file_id_files_id_fk" FOREIGN KEY ("image_file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;