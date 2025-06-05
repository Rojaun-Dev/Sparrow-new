ALTER TABLE "company_assets" RENAME COLUMN "url" TO "image_data";--> statement-breakpoint
ALTER TABLE "company_assets" ALTER COLUMN "image_data" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "company_assets" ADD COLUMN "metadata" jsonb DEFAULT '{}'::jsonb;