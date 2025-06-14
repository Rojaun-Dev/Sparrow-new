ALTER TABLE "users" ALTER COLUMN "notification_preferences" SET DEFAULT '{"email":true,"sms":false,"push":false,"packageUpdates":{"email":true,"sms":false,"push":false},"billingUpdates":{"email":true,"sms":false,"push":false},"marketingUpdates":{"email":false,"sms":false,"push":false},"pickupLocationId":null}'::jsonb;--> statement-breakpoint
ALTER TABLE "company_settings" ADD COLUMN "payment_settings" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "company_settings" DROP COLUMN IF EXISTS "shipping_rates";--> statement-breakpoint
ALTER TABLE "company_settings" DROP COLUMN IF EXISTS "handling_fees";--> statement-breakpoint
ALTER TABLE "company_settings" DROP COLUMN IF EXISTS "customs_fees";--> statement-breakpoint
ALTER TABLE "company_settings" DROP COLUMN IF EXISTS "tax_rates";