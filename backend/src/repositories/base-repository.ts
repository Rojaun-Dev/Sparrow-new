import { SQL, eq, and } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { PgTable } from 'drizzle-orm/pg-core';
import { db } from '../db';

export class BaseRepository<T extends PgTable> {
  protected db: NodePgDatabase;
  protected table: T;

  constructor(table: T) {
    this.db = db;
    this.table = table;
  }

  /**
   * Find all records with company isolation
   */
  async findAll(companyId: string, conditions?: SQL<unknown>) {
    const where = conditions
      ? and(eq(this.table.companyId as any, companyId), conditions)
      : eq(this.table.companyId as any, companyId);
    
    return this.db.select().from(this.table).where(where);
  }

  /**
   * Find a record by ID with company isolation
   */
  async findById(id: string, companyId: string) {
    const result = await this.db
      .select()
      .from(this.table)
      .where(
        and(
          eq(this.table.id as any, id),
          eq(this.table.companyId as any, companyId)
        )
      )
      .limit(1);
    
    return result.length > 0 ? result[0] : null;
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
    return result[0];
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
          eq(this.table.id as any, id),
          eq(this.table.companyId as any, companyId)
        )
      )
      .returning();
    
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Delete a record by ID with company isolation
   */
  async delete(id: string, companyId: string) {
    return this.db
      .delete(this.table)
      .where(
        and(
          eq(this.table.id as any, id),
          eq(this.table.companyId as any, companyId)
        )
      );
  }
} 