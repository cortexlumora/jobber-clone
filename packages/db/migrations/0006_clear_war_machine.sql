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
ALTER TABLE "company_settings" ADD CONSTRAINT "company_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;