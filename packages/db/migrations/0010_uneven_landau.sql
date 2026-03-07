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
ALTER TABLE "client_contacts" ADD COLUMN "property_id" uuid;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_contacts" ADD CONSTRAINT "client_contacts_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" DROP COLUMN "property_address";--> statement-breakpoint
ALTER TABLE "clients" DROP COLUMN "billing_same_as_property";--> statement-breakpoint
ALTER TABLE "clients" DROP COLUMN "billing_address";