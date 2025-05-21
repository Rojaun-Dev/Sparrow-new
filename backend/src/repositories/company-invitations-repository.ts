import { and, eq, gte, desc, like } from 'drizzle-orm';
import { db } from '../db';
import { companyInvitations } from '../db/schema';
import { CompanyInvitation, CreateCompanyInvitation } from '../types/company-invitation';
import { sql } from 'drizzle-orm';

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

  async findById(id: number): Promise<CompanyInvitation | undefined> {
    const result = await db
      .select()
      .from(companyInvitations)
      .where(eq(companyInvitations.id, id));

    return result[0];
  }

  async findAll(
    page: number = 1, 
    limit: number = 10, 
    status?: string,
    search?: string
  ): Promise<CompanyInvitation[]> {
    const offset = (page - 1) * limit;
    
    let query = db.select().from(companyInvitations);
    
    if (status) {
      query = query.where(eq(companyInvitations.status, status as any));
    }
    
    if (search) {
      query = query.where(like(companyInvitations.email, `%${search}%`));
    }
    
    return query
      .orderBy(desc(companyInvitations.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async countAll(status?: string, search?: string): Promise<number> {
    let query = db.select().from(companyInvitations);
    
    if (status) {
      query = query.where(eq(companyInvitations.status, status as any));
    }
    
    if (search) {
      query = query.where(like(companyInvitations.email, `%${search}%`));
    }
    
    const results = await query;
    return results.length;
  }

  async update(id: number, data: Partial<CompanyInvitation>): Promise<void> {
    await db
      .update(companyInvitations)
      .set(data)
      .where(eq(companyInvitations.id, id));
  }
} 