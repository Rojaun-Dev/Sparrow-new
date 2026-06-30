ALTER TABLE "packages" ADD COLUMN "warehouse_receipt" text;
--> statement-breakpoint
-- Backfill the warehouse receipt for previously imported rows that only stored it in notes.
UPDATE "packages"
SET "warehouse_receipt" = substring("notes" from 'Warehouse Receipt:\s*(HLS-[0-9]+)')
WHERE "warehouse_receipt" IS NULL
  AND "notes" LIKE '%Warehouse Receipt:%';