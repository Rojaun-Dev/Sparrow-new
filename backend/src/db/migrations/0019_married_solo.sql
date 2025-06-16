ALTER TABLE "packages" DROP CONSTRAINT "packages_internal_tracking_id_unique";--> statement-breakpoint
ALTER TABLE "packages" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "packages" DROP COLUMN IF EXISTS "internal_tracking_id";