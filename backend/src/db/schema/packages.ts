import { pgTable, uuid, text, timestamp, jsonb, pgEnum, decimal } from 'drizzle-orm/pg-core';
import { companies } from './companies';
import { users } from './users';

// Define the package status enum
export const packageStatusEnum = pgEnum('package_status', [
  'in_transit',
  'pre_alert',
  'received',
  'processed',
  'ready_for_pickup',
  'delivered',
  'returned',
]);

export const packages = pgTable('packages', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id, {
    onDelete: 'cascade',
  }),
  userId: uuid('user_id').references(() => users.id, {
    onDelete: 'cascade',
  }),
  prefId: text('pref_id'),
  trackingNumber: text('tracking_number').notNull(),
  status: packageStatusEnum('status').notNull().default('received'),
  description: text('description'),
  weight: decimal('weight', { precision: 10, scale: 2 }),
  dimensions: jsonb('dimensions').default({}), // { length, width, height }
  declaredValue: decimal('declared_value', { precision: 10, scale: 2 }),
  senderInfo: jsonb('sender_info').default({}),
  tags: text('tags').array(),
  receivedDate: timestamp('received_date', { withTimezone: true }),
  processingDate: timestamp('processing_date', { withTimezone: true }),
  photos: text('photos').array(),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}); 