ALTER TABLE "company_settings" ADD COLUMN "internal_prefix" text DEFAULT 'SPX' NOT NULL;--> statement-breakpoint
ALTER TABLE "packages" ADD COLUMN "pref_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "internal_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "pref_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_internal_id_unique" UNIQUE("internal_id");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_pref_id_unique" UNIQUE("pref_id");