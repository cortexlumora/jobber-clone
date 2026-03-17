CREATE TYPE "public"."email_resource_type" AS ENUM('quote', 'invoice', 'job');--> statement-breakpoint
CREATE TABLE "email_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"resource_type" "email_resource_type" NOT NULL,
	"resource_id" uuid NOT NULL,
	"sent_to" varchar(255) NOT NULL,
	"subject" varchar(500) NOT NULL,
	"message" text NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL
);
