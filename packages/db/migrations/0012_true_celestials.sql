ALTER TABLE "requests" DROP COLUMN "best_day";--> statement-breakpoint
ALTER TABLE "requests" DROP COLUMN "alternate_day";--> statement-breakpoint
ALTER TABLE "requests" DROP COLUMN "preferred_arrival";--> statement-breakpoint
ALTER TABLE "requests" DROP COLUMN "assessment_required";--> statement-breakpoint
DROP TYPE "public"."preferred_arrival";