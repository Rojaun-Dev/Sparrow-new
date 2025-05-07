import { SQL, eq, and } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { PgTable } from 'drizzle-orm/pg-core';
import { db } from '../db';

// Define a type for tables that have companyId
export interface TableWithCompanyId {
  id: any;
  companyId: any;
  updatedAt?: any;
}

export class BaseRepository<T extends PgTable<any> & TableWithCompanyId> {
  protected db: NodePgDatabase<any>;
  protected table: T;

  constructor(table: T) {
    this.db = db;
    this.table = table;
  }

  /**
   * Find all records with company isolation
   */
  async findAll(companyId: string, conditions?: SQL<unknown>): Promise<any[]> {
    const where = conditions
      ? and(eq(this.table.companyId, companyId), conditions)
      : eq(this.table.companyId, companyId);
    
    return this.db.select().from(this.table).where(where);
  }

  /**
   * Find a record by ID with company isolation
   */
  async findById(id: string, companyId: string): Promise<Record<string, any> | null> {
    const result = await this.db
      .select()
      .from(this.table)
      .where(
        and(
          eq(this.table.id, id),
          eq(this.table.companyId, companyId)
        )
      )
      .limit(1);
    
    return Array.isArray(result) && result.length > 0 ? result[0] : null;
  }

  /**
   * Create a new record with company ID
   */
  async create(data: any, companyId: string) {
    const dataWithCompany = {
      ...data,
      companyId,
    };
    
    const result = await this.db.insert(this.table).values(dataWithCompany).returning();
    return Array.isArray(result) && result.length > 0 ? result[0] : null;
  }

  /**
   * Update a record by ID with company isolation
   */
  async update(id: string, data: any, companyId: string) {
    const result = await this.db
      .update(this.table)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(this.table.id, id),
          eq(this.table.companyId, companyId)
        )
      )
      .returning();
    
    return Array.isArray(result) && result.length > 0 ? result[0] : null;
  }

  /**
   * Delete a record by ID with company isolation
   */
  async delete(id: string, companyId: string) {
    return this.db
      .delete(this.table)
      .where(
        and(
          eq(this.table.id, id),
          eq(this.table.companyId, companyId)
        )
      );
  }
} 