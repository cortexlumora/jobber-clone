CREATE TYPE "public"."applies_to" AS ENUM('client', 'property', 'request', 'job', 'quote', 'invoice', 'team');--> statement-breakpoint
CREATE TYPE "public"."field_type" AS ENUM('text', 'number', 'dropdown', 'checkbox', 'date', 'true_false', 'area');--> statement-breakpoint
CREATE TYPE "public"."email_resource_type" AS ENUM('quote', 'invoice', 'job');--> statement-breakpoint
CREATE TYPE "public"."billing_type" AS ENUM('visit_based', 'fixed_price');--> statement-breakpoint
CREATE TYPE "public"."client_status" AS ENUM('lead', 'active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."client_title" AS ENUM('none', 'Mr.', 'Ms.', 'Mrs.', 'Miss.', 'Dr.');--> statement-breakpoint
CREATE TYPE "public"."deposit_mode" AS ENUM('%', '$');--> statement-breakpoint
CREATE TYPE "public"."deposit_type" AS ENUM('none', 'deposit', 'schedule');--> statement-breakpoint
CREATE TYPE "public"."email_type" AS ENUM('primary', 'secondary', 'work', 'other');--> statement-breakpoint
CREATE TYPE "public"."ends_type" AS ENUM('after', 'on');--> statement-breakpoint
CREATE TYPE "public"."invoice_reminder_status" AS ENUM('scheduled', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('draft', 'sent', 'paid', 'partial', 'overdue', 'void');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('draft', 'active', 'action_required', 'complete', 'archived');--> statement-breakpoint
CREATE TYPE "public"."job_type" AS ENUM('one_off', 'recurring');--> statement-breakpoint
CREATE TYPE "public"."lead_source" AS ENUM('facebook', 'existing_client', 'flyer', 'google', 'instagram', 'referral', 'other');--> statement-breakpoint
CREATE TYPE "public"."payroll_status" AS ENUM('awaiting_payment', 'paid');--> statement-breakpoint
CREATE TYPE "public"."phone_type" AS ENUM('mobile', 'landline');--> statement-breakpoint
CREATE TYPE "public"."quote_status" AS ENUM('draft', 'sent', 'approved', 'rejected', 'archived');--> statement-breakpoint
CREATE TYPE "public"."team_reminder" AS ENUM('none', 'at_start', '30min', '1hour', '2hour', '5hour', '24hour');--> statement-breakpoint
CREATE TYPE "public"."request_status" AS ENUM('new', 'assessed', 'converted', 'archived');--> statement-breakpoint
CREATE TYPE "public"."schedule_status" AS ENUM('pending', 'active', 'paused', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."timesheet_category" AS ENUM('general', 'job', 'break');--> statement-breakpoint
CREATE TYPE "public"."timesheet_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'worker', 'dispatcher', 'manager');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('invited', 'active', 'deactivated');--> statement-breakpoint
CREATE TYPE "public"."visit_status" AS ENUM('scheduled', 'completed', 'cancelled');--> statement-breakpoint
CREATE TABLE "bookable_services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" varchar(1000),
	"duration_minutes" integer DEFAULT 60 NOT NULL,
	"price" numeric(10, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"company_name" varchar(255),
	"phone" varchar(50),
	"website_url" varchar(500),
	"email" varchar(255),
	"street1" varchar(255),
	"street2" varchar(255),
	"city" varchar(255),
	"state" varchar(255),
	"zip" varchar(20),
	"business_hours" jsonb,
	"show_business_hours" boolean DEFAULT true NOT NULL,
	"tax_id_name" varchar(100),
	"tax_id_number" varchar(100),
	"country" varchar(10),
	"timezone" varchar(100),
	"date_format" varchar(20) DEFAULT 'MM/DD/YYYY' NOT NULL,
	"time_format" varchar(10) DEFAULT '12h' NOT NULL,
	"first_day_of_week" varchar(10) DEFAULT 'sunday' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "company_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "custom_field_values" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"custom_field_id" uuid NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" uuid NOT NULL,
	"value" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "custom_field_definitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"field_type" "field_type" NOT NULL,
	"applies_to" "applies_to" NOT NULL,
	"default_value" text,
	"unit" varchar(50),
	"options" jsonb,
	"transferable" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"resource_type" "email_resource_type" NOT NULL,
	"resource_id" uuid NOT NULL,
	"sent_to" varchar(255) NOT NULL,
	"subject" varchar(500) NOT NULL,
	"message" text NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"content_length" integer NOT NULL,
	"content_type" varchar(255) NOT NULL,
	"key" varchar(512) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "files_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "client_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"property_id" uuid,
	"title" "client_title" DEFAULT 'none' NOT NULL,
	"first_name" varchar(255) NOT NULL,
	"last_name" varchar(255) NOT NULL,
	"role" varchar(255),
	"phone" varchar(50),
	"email" varchar(255),
	"notifications" jsonb DEFAULT '{"quoteFollowUp":true,"invoiceFollowUp":true,"appointmentReminders":true,"jobFollowUp":true}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_note_files" (
	"note_id" uuid NOT NULL,
	"file_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "client_note_files_note_id_file_id_pk" PRIMARY KEY("note_id","file_id")
);
--> statement-breakpoint
CREATE TABLE "client_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"created_by_id" uuid NOT NULL,
	"content" text NOT NULL,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"related_to_requests" boolean DEFAULT false NOT NULL,
	"related_to_quotes" boolean DEFAULT false NOT NULL,
	"related_to_jobs" boolean DEFAULT false NOT NULL,
	"related_to_invoices" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "client_tags" (
	"client_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "client_tags_client_id_tag_id_pk" PRIMARY KEY("client_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" "client_title" DEFAULT 'none' NOT NULL,
	"first_name" varchar(255) NOT NULL,
	"last_name" varchar(255) NOT NULL,
	"company_name" varchar(255),
	"status" "client_status" DEFAULT 'lead' NOT NULL,
	"lead_source" "lead_source",
	"use_company_as_primary" boolean DEFAULT false NOT NULL,
	"phones" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"emails" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"notifications" jsonb DEFAULT '{"quoteFollowUp":true,"appointmentReminders":true,"jobFollowUp":true,"invoiceFollowUp":true}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"item_name" varchar(255) NOT NULL,
	"accounting_code" varchar(100),
	"description" text,
	"date" varchar(10) NOT NULL,
	"total" numeric(10, 2) NOT NULL,
	"reimburse_to" varchar(255),
	"receipt_file_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_line_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"qty" integer DEFAULT 1 NOT NULL,
	"unit_price" numeric(10, 2) DEFAULT '0' NOT NULL,
	"image_file_id" uuid,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"job_id" uuid,
	"invoice_number" varchar(50),
	"status" "invoice_status" DEFAULT 'draft' NOT NULL,
	"subject" varchar(255),
	"issued_date" varchar(10),
	"due_date" varchar(10),
	"discount" numeric(10, 2),
	"tax" numeric(10, 2),
	"client_message" text,
	"subtotal" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total" numeric(10, 2) DEFAULT '0' NOT NULL,
	"amount_paid" numeric(10, 2) DEFAULT '0' NOT NULL,
	"balance" numeric(10, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
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
CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"job_number" varchar(50),
	"salesperson" varchar(255),
	"status" "job_status" DEFAULT 'draft' NOT NULL,
	"job_type" "job_type" DEFAULT 'one_off' NOT NULL,
	"assigned_user_ids" jsonb,
	"notes" text,
	"billing_type" "billing_type",
	"invoice_frequency" varchar(50),
	"auto_pay" boolean DEFAULT false NOT NULL,
	"related_quote_id" uuid,
	"related_request_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "payroll_periods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"period_start" varchar(10) NOT NULL,
	"period_end" varchar(10) NOT NULL,
	"total_minutes" integer DEFAULT 0 NOT NULL,
	"total_expenses" numeric(10, 2) DEFAULT '0' NOT NULL,
	"status" "payroll_status" DEFAULT 'awaiting_payment' NOT NULL,
	"confirmed_at" timestamp with time zone,
	"confirmed_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products_services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" varchar(1000),
	"type" varchar(50) DEFAULT 'service' NOT NULL,
	"cost" numeric(10, 2) DEFAULT '0' NOT NULL,
	"markup" numeric(10, 2) DEFAULT '0' NOT NULL,
	"unit_price" numeric(10, 2) DEFAULT '0' NOT NULL,
	"tax_exempt" boolean DEFAULT false NOT NULL,
	"online_booking" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "properties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"street1" varchar(255),
	"street2" varchar(255),
	"city" varchar(255),
	"state" varchar(255),
	"zip" varchar(20),
	"country" varchar(255),
	"billing_same_as_property" boolean DEFAULT true NOT NULL,
	"billing_street1" varchar(255),
	"billing_street2" varchar(255),
	"billing_city" varchar(255),
	"billing_state" varchar(255),
	"billing_zip" varchar(20),
	"billing_country" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quote_files" (
	"quote_id" uuid NOT NULL,
	"file_id" uuid NOT NULL,
	"category" varchar(20) DEFAULT 'attachment' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quote_files_quote_id_file_id_pk" PRIMARY KEY("quote_id","file_id")
);
--> statement-breakpoint
CREATE TABLE "quote_line_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quote_id" uuid NOT NULL,
	"type" varchar(20) DEFAULT 'line_item' NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"qty" integer DEFAULT 0 NOT NULL,
	"unit_price" numeric(10, 2) DEFAULT '0' NOT NULL,
	"image_file_id" uuid,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"quote_number" varchar(50),
	"salesperson" varchar(255),
	"status" "quote_status" DEFAULT 'draft' NOT NULL,
	"intro_title" varchar(255),
	"intro_description" text,
	"intro_image_file_id" uuid,
	"discount" varchar(50),
	"tax" varchar(50),
	"deposit_type" "deposit_type" DEFAULT 'none' NOT NULL,
	"deposit_mode" "deposit_mode" DEFAULT '%' NOT NULL,
	"deposit_value" varchar(50),
	"schedule_mode" "deposit_mode" DEFAULT '%' NOT NULL,
	"payments" jsonb,
	"client_message" text,
	"contract" text,
	"apply_contract_to_all" boolean DEFAULT false NOT NULL,
	"notes" text,
	"related_request_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
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
CREATE TABLE "request_files" (
	"request_id" uuid NOT NULL,
	"file_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "request_files_request_id_file_id_pk" PRIMARY KEY("request_id","file_id")
);
--> statement-breakpoint
CREATE TABLE "request_forms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" varchar(1000),
	"config" jsonb,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
CREATE TABLE "requests_bookings_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"request_form_visible" boolean DEFAULT true NOT NULL,
	"max_drive_time_minutes" integer DEFAULT 30 NOT NULL,
	"service_area_enabled" boolean DEFAULT false NOT NULL,
	"bookable_team_member_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "requests_bookings_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"service_description" text NOT NULL,
	"status" "request_status" DEFAULT 'new' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"color" varchar(7),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tags_user_id_name_unique" UNIQUE("user_id","name")
);
--> statement-breakpoint
CREATE TABLE "time_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"start_time" varchar(5),
	"end_time" varchar(5),
	"duration_minutes" integer NOT NULL,
	"notes" text,
	"date" varchar(10) NOT NULL,
	"employee" varchar(255) NOT NULL,
	"employee_cost_per_hour" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total_cost" numeric(10, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "timesheet_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"job_id" uuid,
	"category" timesheet_category DEFAULT 'general' NOT NULL,
	"date" varchar(10) NOT NULL,
	"start_time" varchar(5),
	"end_time" varchar(5),
	"duration_minutes" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"gps_start_coords" varchar(50),
	"gps_end_coords" varchar(50),
	"status" timesheet_status DEFAULT 'pending' NOT NULL,
	"approved_at" timestamp with time zone,
	"approved_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255),
	"role" "user_role" DEFAULT 'admin' NOT NULL,
	"status" "user_status" DEFAULT 'active' NOT NULL,
	"invite_token" varchar(255),
	"invite_expires_at" timestamp with time zone,
	"phone" varchar(50),
	"street" varchar(255),
	"city" varchar(255),
	"province" varchar(255),
	"postal_code" varchar(20),
	"country" varchar(100),
	"labor_cost_per_hour" numeric(10, 2),
	"permissions" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_invite_token_unique" UNIQUE("invite_token")
);
--> statement-breakpoint
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
ALTER TABLE "bookable_services" ADD CONSTRAINT "bookable_services_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_settings" ADD CONSTRAINT "company_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_field_values" ADD CONSTRAINT "custom_field_values_custom_field_id_custom_field_definitions_id_fk" FOREIGN KEY ("custom_field_id") REFERENCES "public"."custom_field_definitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_field_definitions" ADD CONSTRAINT "custom_field_definitions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_contacts" ADD CONSTRAINT "client_contacts_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_contacts" ADD CONSTRAINT "client_contacts_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_note_files" ADD CONSTRAINT "client_note_files_note_id_client_notes_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."client_notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_note_files" ADD CONSTRAINT "client_note_files_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_notes" ADD CONSTRAINT "client_notes_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_notes" ADD CONSTRAINT "client_notes_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_tags" ADD CONSTRAINT "client_tags_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_tags" ADD CONSTRAINT "client_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_receipt_file_id_files_id_fk" FOREIGN KEY ("receipt_file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_image_file_id_files_id_fk" FOREIGN KEY ("image_file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_reminders" ADD CONSTRAINT "invoice_reminders_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_line_items" ADD CONSTRAINT "job_line_items_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_line_items" ADD CONSTRAINT "job_line_items_image_file_id_files_id_fk" FOREIGN KEY ("image_file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_schedules" ADD CONSTRAINT "job_schedules_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_periods" ADD CONSTRAINT "payroll_periods_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_periods" ADD CONSTRAINT "payroll_periods_confirmed_by_id_users_id_fk" FOREIGN KEY ("confirmed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products_services" ADD CONSTRAINT "products_services_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_files" ADD CONSTRAINT "quote_files_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_files" ADD CONSTRAINT "quote_files_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_line_items" ADD CONSTRAINT "quote_line_items_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_line_items" ADD CONSTRAINT "quote_line_items_image_file_id_files_id_fk" FOREIGN KEY ("image_file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_intro_image_file_id_files_id_fk" FOREIGN KEY ("intro_image_file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_assessments" ADD CONSTRAINT "request_assessments_request_id_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_files" ADD CONSTRAINT "request_files_request_id_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_files" ADD CONSTRAINT "request_files_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_forms" ADD CONSTRAINT "request_forms_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_line_items" ADD CONSTRAINT "request_line_items_request_id_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_line_items" ADD CONSTRAINT "request_line_items_image_file_id_files_id_fk" FOREIGN KEY ("image_file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requests_bookings_settings" ADD CONSTRAINT "requests_bookings_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requests" ADD CONSTRAINT "requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requests" ADD CONSTRAINT "requests_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timesheet_entries" ADD CONSTRAINT "timesheet_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timesheet_entries" ADD CONSTRAINT "timesheet_entries_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timesheet_entries" ADD CONSTRAINT "timesheet_entries_approved_by_id_users_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visits" ADD CONSTRAINT "visits_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;