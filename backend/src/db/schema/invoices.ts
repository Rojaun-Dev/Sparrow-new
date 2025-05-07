import { pgTable, uuid, text, timestamp, pgEnum, decimal } from 'drizzle-orm/pg-core';
import { companies } from './companies';
import { users } from './users';

// Define the invoice status enum
export const invoiceStatusEnum = pgEnum('invoice_status', [
  'draft',
  'issued',
  'paid',
  'cancelled',
  'overdue',
]);

export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id, {
    onDelete: 'cascade',
  }),
  userId: uuid('user_id').notNull().references(() => users.id, {
    onDelete: 'cascade',
  }),
  invoiceNumber: text('invoice_number').notNull().unique(),
  status: invoiceStatusEnum('status').notNull().default('draft'),
  issueDate: timestamp('issue_date', { withTimezone: true }),
  dueDate: timestamp('due_date', { withTimezone: true }),
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull().default('0'),
  taxAmount: decimal('tax_amount', { precision: 10, scale: 2 }).notNull().default('0'),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull().default('0'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}); 