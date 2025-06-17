ALTER TABLE "packages" ADD COLUMN "pre_alert_id" text;--> statement-breakpoint
ALTER TABLE "packages" ADD CONSTRAINT "packages_tracking_number_unique" UNIQUE("tracking_number");