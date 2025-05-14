ALTER TABLE "users" DROP CONSTRAINT "users_auth0_id_unique";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "auth0_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "trn" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "pickup_location_id" text;