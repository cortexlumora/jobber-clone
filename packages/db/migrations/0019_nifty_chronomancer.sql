ALTER TABLE "client_notes" ADD COLUMN "related_to_requests" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "client_notes" ADD COLUMN "related_to_quotes" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "client_notes" ADD COLUMN "related_to_jobs" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "client_notes" ADD COLUMN "related_to_invoices" boolean DEFAULT false NOT NULL;