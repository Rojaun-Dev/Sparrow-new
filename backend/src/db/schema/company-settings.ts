import { pgTable, uuid, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { companies } from './companies';

export const companySettings = pgTable('company_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id, {
    onDelete: 'cascade',
  }).unique(), // One settings record per company
  shippingRates: jsonb('shipping_rates').default({}),
  handlingFees: jsonb('handling_fees').default({}),
  customsFees: jsonb('customs_fees').default({}),
  taxRates: jsonb('tax_rates').default({}),
  notificationSettings: jsonb('notification_settings').default({}),
  themeSettings: jsonb('theme_settings').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}); 