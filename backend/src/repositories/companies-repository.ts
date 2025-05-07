import { BaseRepository } from './base-repository';
import { companies } from '../db/schema/companies';
import { db } from '../db';
import { eq } from 'drizzle-orm';

export class CompaniesRepository extends BaseRepository<typeof companies> {
  constructor() {
    super(companies);
  }

  /**
   * Find a company by ID (without company isolation)
   */
  async findById(id: string) {
    const result = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.id, id))
      .limit(1);
    
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Find a company by subdomain
   */
  async findBySubdomain(subdomain: string) {
    const result = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.subdomain, subdomain))
      .limit(1);
    
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Create a new company (without company isolation)
   */
  async create(data: any) {
    const result = await this.db
      .insert(this.table)
      .values(data)
      .returning();
    
    return result[0];
  }

  /**
   * Update a company by ID (without company isolation)
   */
  async update(id: string, data: any) {
    const result = await this.db
      .update(this.table)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(this.table.id, id))
      .returning();
    
    return result.length > 0 ? result[0] : null;
  }

  /**
   * List all companies (for super admin)
   */
  async findAll() {
    return this.db.select().from(this.table);
  }
} 