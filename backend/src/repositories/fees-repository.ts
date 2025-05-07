import { SQL, and, eq } from 'drizzle-orm';
import { BaseRepository } from './base-repository';
import { fees } from '../db/schema/fees';
import { db } from '../db';

export class FeesRepository extends BaseRepository<typeof fees> {
  constructor() {
    super(fees);
  }

  /**
   * Find a fee by code within a company
   */
  async findByCode(code: string, companyId: string) {
    const result = await this.db
      .select()
      .from(this.table)
      .where(
        and(
          eq(this.table.code, code),
          eq(this.table.companyId, companyId)
        )
      )
      .limit(1);
    
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Find fees by type within a company
   */
  async findByType(feeType: string, companyId: string) {
    return this.db
      .select()
      .from(this.table)
      .where(
        and(
          eq(this.table.feeType, feeType),
          eq(this.table.companyId, companyId)
        )
      );
  }

  /**
   * Find all active fees for a company
   */
  async findActive(companyId: string) {
    return this.db
      .select()
      .from(this.table)
      .where(
        and(
          eq(this.table.isActive, true),
          eq(this.table.companyId, companyId)
        )
      );
  }

  /**
   * Deactivate a fee (instead of deleting)
   */
  async deactivate(id: string, companyId: string) {
    const result = await this.db
      .update(this.table)
      .set({ isActive: false })
      .where(
        and(
          eq(this.table.id, id),
          eq(this.table.companyId, companyId)
        )
      )
      .returning();
    
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Activate a fee
   */
  async activate(id: string, companyId: string) {
    const result = await this.db
      .update(this.table)
      .set({ isActive: true })
      .where(
        and(
          eq(this.table.id, id),
          eq(this.table.companyId, companyId)
        )
      )
      .returning();
    
    return result.length > 0 ? result[0] : null;
  }
} 