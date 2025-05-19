import { pgTable, uuid, text, timestamp, boolean, pgEnum, jsonb } from 'drizzle-orm/pg-core';
import { companies } from './companies';

// Define the user role enum
export const userRoleEnum = pgEnum('user_role', [
  'customer',
  'admin_l1',
  'admin_l2',
  'super_admin'
]);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id, {
    onDelete: 'cascade', // When a company is deleted, delete all of its users
  }),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'), // For JWT authentication
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  phone: text('phone'),
  address: text('address'),
  trn: text('trn'), // Tax Registration Number
  role: userRoleEnum('role').notNull().default('customer'),
  auth0Id: text('auth0_id'), // Optional now with JWT implementation
  isActive: boolean('is_active').notNull().default(true),
  isVerified: boolean('is_verified').notNull().default(false),
  verificationToken: text('verification_token'),
  verificationTokenExpires: timestamp('verification_token_expires', { withTimezone: true }),
  notificationPreferences: jsonb('notification_preferences').default({
    email: true,
    sms: false,
    push: false,
    packageUpdates: { email: true, sms: false, push: false },
    billingUpdates: { email: true, sms: false, push: false },
    marketingUpdates: { email: false, sms: false, push: false },
    pickupLocationId: null
  }),
  resetToken: text('reset_token'),
  resetTokenExpires: timestamp('reset_token_expires', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}); 