import { pgTable, uuid, varchar, text, timestamp, boolean, decimal, pgEnum, jsonb } from 'drizzle-orm/pg-core';
import { companies } from './companies';

// Define the fee type enum
export const feeTypeEnum = pgEnum('fee_type', [
  'tax', 
  'service', 
  'shipping', 
  'handling',
  'customs', 
  'other',
]);

// Define the calculation method enum
export const calculationMethodEnum = pgEnum('calculation_method', [
  'fixed',
  'percentage',
  'per_weight',
  'per_item',
  'dimensional',
  'tiered',
  'threshold',
  'timed',
]);

export const fees = pgTable('fees', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id, {
    onDelete: 'cascade',
  }),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 50 }).notNull(),
  feeType: feeTypeEnum('fee_type').notNull(),
  calculationMethod: calculationMethodEnum('calculation_method').notNull(), 
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(), // For tiered calculation: acts as minimum fee guarantee
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),
  appliesTo: jsonb('applies_to').default('[]'),
  metadata: jsonb('metadata').default('{}'),
  description: text('description'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Create a compound unique constraint for code+companyId
// This allows different companies to use the same code
export const feesRelations = {
  company: companies
}; 