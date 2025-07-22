import { pgTable, uuid, text, timestamp, decimal, pgEnum } from 'drizzle-orm/pg-core';
import { companies } from './companies';
import { packages } from './packages';

export const dutyFeeTypeEnum = pgEnum('duty_fee_type', [
  'Electronics',
  'Clothing & Footwear', 
  'Food & Grocery',
  'Household Appliances',
  'Furniture',
  'Construction Materials',
  'Tools & Machinery',
  'Cosmetics & Personal',
  'Medical Equipment',
  'Agricultural Products',
  'Pet Supplies',
  'Books & Education',
  'Mobile Accessories',
  'ANIMALS',
  'SOLAR EQUIPMENT',
  'WRIST WATCHES',
  'Other'
]);

export const currencyEnum = pgEnum('currency', ['USD', 'JMD']);

export const dutyFees = pgTable('duty_fees', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id, {
    onDelete: 'cascade',
  }),
  packageId: uuid('package_id').notNull().references(() => packages.id, {
    onDelete: 'cascade',
  }),
  feeType: dutyFeeTypeEnum('fee_type').notNull(),
  customFeeType: text('custom_fee_type'), // For user-defined fees when feeType is 'Other'
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: currencyEnum('currency').notNull().default('USD'),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});