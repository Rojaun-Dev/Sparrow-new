ALTER TABLE "users" ADD COLUMN "notification_preferences" jsonb DEFAULT '{"email":true,"sms":false,"push":false,"packageUpdates":{"email":true,"sms":false,"push":false},"billingUpdates":{"email":true,"sms":false,"push":false},"marketingUpdates":{"email":false,"sms":false,"push":false},"pickupLocationId":null}'::jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "reset_token" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "reset_token_expires" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "pickup_location_id";