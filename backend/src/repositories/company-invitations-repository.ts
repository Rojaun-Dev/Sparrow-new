import { and, eq, gte } from 'drizzle-orm';
import { db } from '../db';
import { companyInvitations } from '../db/schema';
import { CompanyInvitation, CreateCompanyInvitation } from '../types/company-invitation';

export class CompanyInvitationsRepository {
  async create(data: CreateCompanyInvitation): Promise<CompanyInvitation> {
    const result = await db
      .insert(companyInvitations)
      .values(data)
      .returning();
    
    return result[0];
  }

  async findByToken(token: string): Promise<CompanyInvitation | undefined> {
    const result = await db
      .select()
      .from(companyInvitations)
      .where(eq(companyInvitations.token, token));

    return result[0];
  }

  async findValidByToken(token: string): Promise<CompanyInvitation | undefined> {
    const result = await db
      .select()
      .from(companyInvitations)
      .where(
        and(
          eq(companyInvitations.token, token),
          eq(companyInvitations.status, 'pending'),
          gte(companyInvitations.expiresAt, new Date())
        )
      );

    return result[0];
  }

  async updateStatus(id: number, status: 'pending' | 'accepted' | 'expired' | 'cancelled'): Promise<void> {
    await db
      .update(companyInvitations)
      .set({ 
        status,
        updatedAt: new Date()
      })
      .where(eq(companyInvitations.id, id));
  }

  async findPendingByEmail(email: string): Promise<CompanyInvitation[]> {
    return db
      .select()
      .from(companyInvitations)
      .where(
        and(
          eq(companyInvitations.email, email),
          eq(companyInvitations.status, 'pending'),
          gte(companyInvitations.expiresAt, new Date())
        )
      );
  }
} 