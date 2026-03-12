CREATE TYPE "public"."deposit_mode" AS ENUM('%', '$');--> statement-breakpoint
CREATE TYPE "public"."deposit_type" AS ENUM('none', 'deposit', 'schedule');--> statement-breakpoint
CREATE TYPE "public"."quote_status" AS ENUM('draft', 'sent', 'approved', 'rejected', 'archived');--> statement-breakpoint
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
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "quote_files" ADD CONSTRAINT "quote_files_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_files" ADD CONSTRAINT "quote_files_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_line_items" ADD CONSTRAINT "quote_line_items_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_line_items" ADD CONSTRAINT "quote_line_items_image_file_id_files_id_fk" FOREIGN KEY ("image_file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_intro_image_file_id_files_id_fk" FOREIGN KEY ("intro_image_file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;