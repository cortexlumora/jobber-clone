CREATE TYPE "public"."client_status" AS ENUM('lead', 'active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."client_title" AS ENUM('none', 'Mr.', 'Ms.', 'Mrs.', 'Miss.', 'Dr.');--> statement-breakpoint
CREATE TYPE "public"."email_type" AS ENUM('primary', 'secondary', 'work', 'other');--> statement-breakpoint
CREATE TYPE "public"."phone_type" AS ENUM('mobile', 'landline');--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" "client_title" DEFAULT 'none' NOT NULL,
	"first_name" varchar(255) NOT NULL,
	"last_name" varchar(255) NOT NULL,
	"company_name" varchar(255),
	"use_company_as_primary" boolean DEFAULT false NOT NULL,
	"phones" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"emails" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"property_address" jsonb,
	"billing_same_as_property" boolean DEFAULT true NOT NULL,
	"billing_address" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;