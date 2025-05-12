import { BaseRepository } from './base-repository';
import { invoiceItems } from '../db/schema/invoice-items';
import { and, eq } from 'drizzle-orm';

export class InvoiceItemsRepository extends BaseRepository<typeof invoiceItems> {
  constructor() {
    super(invoiceItems);
  }

  /**
   * Get all invoice items for a specific invoice
   */
  async findByInvoiceId(invoiceId: string, companyId: string) {
    return this.db
      .select()
      .from(this.table)
      .where(
        and(
          eq(this.table.invoiceId, invoiceId),
          eq(this.table.companyId, companyId)
        )
      );
  }

  /**
   * Get all invoice items for a specific package
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
   * Delete all invoice items for a specific invoice
   */
  async deleteByInvoiceId(invoiceId: string, companyId: string) {
    return this.db
      .delete(this.table)
      .where(
        and(
          eq(this.table.invoiceId, invoiceId),
          eq(this.table.companyId, companyId)
        )
      );
  }
} 