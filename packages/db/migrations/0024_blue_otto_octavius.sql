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
ALTER TABLE "products_services" ADD CONSTRAINT "products_services_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;