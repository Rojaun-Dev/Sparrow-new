import { pgTable, uuid, jsonb, timestamp, text } from 'drizzle-orm/pg-core';
import { companies } from './companies';

export const companySettings = pgTable('company_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id, {
    onDelete: 'cascade',
  }).unique(), // One settings record per company
  internalPrefix: text('internal_prefix').notNull().default('SPX'),
  notificationSettings: jsonb('notification_settings').default({}),
  themeSettings: jsonb('theme_settings').default({}),
  paymentSettings: jsonb('payment_settings').default({}),
  integrationSettings: jsonb('integration_settings').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}); 