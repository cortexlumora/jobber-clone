CREATE TYPE "public"."user_role" AS ENUM('admin', 'worker', 'dispatcher', 'manager');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('invited', 'active', 'deactivated');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "company_id" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_hash" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" "user_role" DEFAULT 'admin' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "status" "user_status" DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "invite_token" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "invite_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone" varchar(50);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "street" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "city" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "province" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "postal_code" varchar(20);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "country" varchar(100);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "labor_cost_per_hour" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "permissions" jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_invite_token_unique" UNIQUE("invite_token");