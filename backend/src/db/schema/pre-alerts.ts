import { pgTable, uuid, text, timestamp, pgEnum, decimal } from 'drizzle-orm/pg-core';
import { companies } from './companies';
import { users } from './users';
import { packages } from './packages';

// Define the pre-alert status enum
export const preAlertStatusEnum = pgEnum('pre_alert_status', [
  'pending',
  'matched',
  'cancelled',
]);

export const preAlerts = pgTable('pre_alerts', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id, {
    onDelete: 'cascade',
  }),
  userId: uuid('user_id').notNull().references(() => users.id, {
    onDelete: 'cascade',
  }),
  trackingNumber: text('tracking_number').notNull(),
  courier: text('courier').notNull(),
  description: text('description'),
  estimatedWeight: decimal('estimated_weight', { precision: 10, scale: 2 }),
  estimatedArrival: timestamp('estimated_arrival', { withTimezone: true }),
  packageId: uuid('package_id').references(() => packages.id, {
    onDelete: 'set null',
  }),
  status: preAlertStatusEnum('status').notNull().default('pending'),
  documents: text('documents').array(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}); 