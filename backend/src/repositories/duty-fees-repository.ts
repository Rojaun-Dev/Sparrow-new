import { eq, and, sql } from 'drizzle-orm';
import { BaseRepository } from './base-repository';
import { dutyFees } from '../db/schema';

export class DutyFeesRepository extends BaseRepository<typeof dutyFees> {
  constructor() {
    super(dutyFees);
  }

  /**
   * Find all duty fees for a specific package
   */
  async findByPackageId(packageId: string, companyId: string) {
    return this.db
      .select()
      .from(this.table)
      .where(
        and(
          eq(this.table.packageId, packageId),
          eq(this.table.companyId, companyId)
        )
      );
  }

  /**
   * Find all duty fees for multiple packages
   */
  async findByPackageIds(packageIds: string[], companyId: string) {
    if (packageIds.length === 0) return [];
    
    return this.db
      .select()
      .from(this.table)
      .where(
        and(
          // Use SQL IN operator with package IDs
          sql`${this.table.packageId} = ANY(${packageIds})`,
          eq(this.table.companyId, companyId)
        )
      );
  }

  /**
   * Get total duty fees amount for a package in a specific currency
   */
  async getTotalByPackageAndCurrency(packageId: string, currency: 'USD' | 'JMD', companyId: string): Promise<number> {
    const result = await this.db
      .select({
        total: sql<number>`COALESCE(SUM(${this.table.amount}::numeric), 0)`
      })
      .from(this.table)
      .where(
        and(
          eq(this.table.packageId, packageId),
          eq(this.table.currency, currency),
          eq(this.table.companyId, companyId)
        )
      );

    return result[0]?.total || 0;
  }

  /**
   * Get all duty fees for a package grouped by currency
   */
  async getPackageFeesGroupedByCurrency(packageId: string, companyId: string) {
    const result = await this.db
      .select({
        currency: this.table.currency,
        total: sql<number>`SUM(${this.table.amount}::numeric)`,
        fees: sql<any[]>`json_agg(json_build_object(
          'id', ${this.table.id},
          'feeType', ${this.table.feeType},
          'customFeeType', ${this.table.customFeeType},
          'amount', ${this.table.amount},
          'description', ${this.table.description}
        ))`
      })
      .from(this.table)
      .where(
        and(
          eq(this.table.packageId, packageId),
          eq(this.table.companyId, companyId)
        )
      )
      .groupBy(this.table.currency);

    return result;
  }
}