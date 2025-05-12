ALTER TYPE "calculation_method" ADD VALUE 'dimensional';--> statement-breakpoint
ALTER TYPE "calculation_method" ADD VALUE 'tiered';--> statement-breakpoint
ALTER TABLE "fees" ADD COLUMN "metadata" jsonb DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "packages" ADD COLUMN "tags" text[];