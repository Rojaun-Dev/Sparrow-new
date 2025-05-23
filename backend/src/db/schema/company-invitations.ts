import { pgTable, serial, timestamp, varchar, pgEnum } from 'drizzle-orm/pg-core';

export const invitationStatusEnum = pgEnum('invitation_status', [
  'pending',
  'accepted',
  'expired',
  'cancelled'
]);

export const companyInvitations = pgTable('company_invitations', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  companyId: varchar('company_id', { length: 255 }),
  status: invitationStatusEnum('status').default('pending').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: varchar('created_by', { length: 255 }).notNull(),
}); 