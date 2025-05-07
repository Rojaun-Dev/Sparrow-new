import { eq } from 'drizzle-orm';
import { companies } from '../db/schema/companies';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { db } from '../db';

// Create a custom repository for companies without extending BaseRepository
export class CompaniesRepository {
  protected db: NodePgDatabase<any>;
  protected table: typeof companies;

  constructor() {
    this.db = db;
    this.table = companies;
  }

  /**
   * Find all companies
   */
  async findAll() {
    return this.db.select().from(this.table);
  }

  /**
   * Find a company by ID
   */
  async findById(id: string) {
    const result = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.id, id))
      .limit(1);
    
    return Array.isArray(result) && result.length > 0 ? result[0] : null;
  }

  /**
   * Create a new company
   */
  async create(data: any) {
    const result = await this.db.insert(this.table).values(data).returning();
    return Array.isArray(result) && result.length > 0 ? result[0] : null;
  }

  /**
   * Update a company by ID
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
    
    return Array.isArray(result) && result.length > 0 ? result[0] : null;
  }

  /**
   * Delete a company by ID
   */
  async delete(id: string) {
    return this.db
      .delete(this.table)
      .where(eq(this.table.id, id));
  }

  /**
   * Find a company by its subdomain
   */
  async findBySubdomain(subdomain: string) {
    const result = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.subdomain, subdomain))
      .limit(1);
    
    return Array.isArray(result) && result.length > 0 ? result[0] : null;
  }
} 