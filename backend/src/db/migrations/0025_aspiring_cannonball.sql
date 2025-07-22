DO $$ BEGIN
 CREATE TYPE "currency" AS ENUM('USD', 'JMD');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "duty_fee_type" AS ENUM('Electronics', 'Clothing & Footwear', 'Food & Grocery', 'Household Appliances', 'Furniture', 'Construction Materials', 'Tools & Machinery', 'Cosmetics & Personal', 'Medical Equipment', 'Agricultural Products', 'Pet Supplies', 'Books & Education', 'Mobile Accessories', 'ANIMALS', 'SOLAR EQUIPMENT', 'WRIST WATCHES', 'Other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "duty_fees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"package_id" uuid NOT NULL,
	"fee_type" "duty_fee_type" NOT NULL,
	"custom_fee_type" text,
	"amount" numeric(10, 2) NOT NULL,
	"currency" "currency" DEFAULT 'USD' NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "duty_fees" ADD CONSTRAINT "duty_fees_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "duty_fees" ADD CONSTRAINT "duty_fees_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "packages"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
