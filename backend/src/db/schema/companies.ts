import { pgTable, uuid, text, jsonb, timestamp } from 'drizzle-orm/pg-core';

export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  subdomain: text('subdomain').notNull().unique(),
  images: jsonb('images').default({}),
  address: text('address'),
  phone: text('phone'),
  locations: text('locations').array(),
  email: text('email').notNull().unique(),
  website: text('website'),
  bankInfo: text('bank_info'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}); 