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
    // Process date fields to ensure they're proper Date objects
    const processedData = { ...data };
    
    // Handle date fields to avoid Unix epoch issues
    Object.keys(processedData).forEach(key => {
      if (key.toLowerCase().includes('date') && processedData[key] !== null) {
        // If it's a date field but not a proper Date object, convert it
        if (!(processedData[key] instanceof Date) && processedData[key] !== undefined) {
          try {
            processedData[key] = new Date(processedData[key]);
            // Check if the date is valid (not Dec 31 1969 or Jan 1 1970)
            if (processedData[key].getFullYear() < 1971) {
              console.warn(`Invalid date detected for field ${key}: ${processedData[key]}, using current date instead`);
              processedData[key] = new Date();
            }
          } catch (e) {
            console.error(`Error converting date for field ${key}:`, e);
            // Use current date as fallback if needed
            processedData[key] = new Date();
          }
        }
      }
    });
    
    const dataWithCompany = {
      ...processedData,
      companyId,
    };
    
    const result = await this.db.insert(this.table).values(dataWithCompany).returning();
    return Array.isArray(result) && result.length > 0 ? result[0] : null;
  }

  /**
   * Update a record by ID with company isolation
   */
  async update(id: string, data: any, companyId: string) {
    // Process date fields to ensure they're proper Date objects
    const processedData = { ...data };
    
    // Handle date fields to avoid Unix epoch issues
    Object.keys(processedData).forEach(key => {
      if (key.toLowerCase().includes('date') && processedData[key] !== null) {
        // If it's a date field but not a proper Date object, convert it
        if (!(processedData[key] instanceof Date) && processedData[key] !== undefined) {
          try {
            processedData[key] = new Date(processedData[key]);
            // Check if the date is valid (not Dec 31 1969 or Jan 1 1970)
            if (processedData[key].getFullYear() < 1971) {
              console.warn(`Invalid date detected for field ${key}: ${processedData[key]}, using current date instead`);
              processedData[key] = new Date();
            }
          } catch (e) {
            console.error(`Error converting date for field ${key}:`, e);
            // Use current date as fallback
            processedData[key] = new Date();
          }
        }
      }
    });
    
    const result = await this.db
      .update(this.table)
      .set({
        ...processedData,
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
  async delete(id: string, companyId?: string) {
    // If companyId is not provided, assume it was already checked at the service level
    if (!companyId) {
      return this.db
        .delete(this.table)
        .where(eq(this.table.id, id));
    }
    
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