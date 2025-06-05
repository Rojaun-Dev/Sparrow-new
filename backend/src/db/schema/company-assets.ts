import { pgTable, uuid, text, timestamp, pgEnum, jsonb } from 'drizzle-orm/pg-core';
import { companies } from './companies';

// Define the asset type enum
export const assetTypeEnum = pgEnum('asset_type', [
  'logo',
  'banner',
  'favicon',
  'small_logo',
]);

export const companyAssets = pgTable('company_assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id, {
    onDelete: 'cascade', // When a company is deleted, delete all of its assets
  }),
  type: assetTypeEnum('type').notNull(),
  // metadata: stores URLs, alt text, color, etc.
  metadata: jsonb('metadata').default({}),
  // imageData: stores base64-encoded image data (for now)
  imageData: text('image_data'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}); 