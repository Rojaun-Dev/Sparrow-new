import { pgTable, uuid, text, timestamp, pgEnum, decimal, integer } from 'drizzle-orm/pg-core';
import { companies } from './companies';
import { invoices } from './invoices';
import { packages } from './packages';

// Define the invoice item type enum
export const invoiceItemTypeEnum = pgEnum('invoice_item_type', [
  'shipping',
  'handling',
  'customs',
  'tax',
  'duty',
  'other',
]);

export const invoiceItems = pgTable('invoice_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id, {
    onDelete: 'cascade',
  }),
  invoiceId: uuid('invoice_id').notNull().references(() => invoices.id, {
    onDelete: 'cascade',
  }),
  packageId: uuid('package_id').references(() => packages.id, {
    onDelete: 'set null',
  }),
  description: text('description').notNull(),
  quantity: integer('quantity').notNull().default(1),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  lineTotal: decimal('line_total', { precision: 10, scale: 2 }).notNull(),
  type: invoiceItemTypeEnum('type').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}); 