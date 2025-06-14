import { pgTable, uuid, text, timestamp, pgEnum, decimal } from 'drizzle-orm/pg-core';
import { companies } from './companies';
import { invoices } from './invoices';
import { users } from './users';

// Define the payment method enum
export const paymentMethodEnum = pgEnum('payment_method', [
  'credit_card',
  'bank_transfer',
  'cash',
  'check',
  'online',
]);

// Define the payment status enum
export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'completed',
  'failed',
  'refunded',
]);

export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id, {
    onDelete: 'cascade',
  }),
  invoiceId: uuid('invoice_id').notNull().references(() => invoices.id, {
    onDelete: 'cascade',
  }),
  userId: uuid('user_id').notNull().references(() => users.id, {
    onDelete: 'cascade',
  }),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  paymentMethod: paymentMethodEnum('payment_method').notNull(),
  status: paymentStatusEnum('status').notNull().default('pending'),
  transactionId: text('transaction_id'),
  paymentDate: timestamp('payment_date', { withTimezone: true }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}); 