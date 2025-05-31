import { and, eq, sql } from 'drizzle-orm';
import { BaseRepository } from './base-repository';
import { payments, paymentStatusEnum } from '../db/schema/payments';
import { invoices } from '../db/schema/invoices';

export class PaymentsRepository extends BaseRepository<typeof payments> {
  constructor() {
    super(payments);
  }

  /**
   * Find all payments for a specific invoice
   */
  async findByInvoiceId(invoiceId: string, companyId: string) {
    return this.db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.invoiceId, invoiceId),
          eq(payments.companyId, companyId)
        )
      );
  }

  /**
   * Find all payments for a specific user
   */
  async findByUserId(userId: string, companyId: string) {
    return this.db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.userId, userId),
          eq(payments.companyId, companyId)
        )
      );
  }

  /**
   * Find payments by status
   */
  async findByStatus(status: typeof paymentStatusEnum.enumValues[number], companyId: string) {
    return this.db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.status, status),
          eq(payments.companyId, companyId)
        )
      );
  }

  /**
   * Process a refund for a payment
   */
  async processRefund(paymentId: string, companyId: string) {
    return this.db.transaction(async (tx) => {
      // Update payment status to refunded
      const updatedPayment = await tx
        .update(payments)
        .set({
          status: 'refunded',
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(payments.id, paymentId),
            eq(payments.companyId, companyId)
          )
        )
        .returning();

      if (updatedPayment.length === 0) {
        throw new Error('Payment not found');
      }

      // Get the corresponding invoice
      const invoice = await tx
        .select()
        .from(invoices)
        .where(
          and(
            eq(invoices.id, updatedPayment[0].invoiceId),
            eq(invoices.companyId, companyId)
          )
        )
        .limit(1);

      if (invoice.length === 0) {
        throw new Error('Associated invoice not found');
      }

      // Update invoice status if needed (logic will depend on business rules)
      // For example, if this was the only payment, we might revert to 'issued' status
      // This is just an example and may need adjustment based on your business logic
      await tx
        .update(invoices)
        .set({
          status: 'issued',
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(invoices.id, updatedPayment[0].invoiceId),
            eq(invoices.companyId, companyId)
          )
        );

      return updatedPayment[0];
    });
  }

  /**
   * Get total payments received within a date range
   */
  async getTotalPaymentsInPeriod(
    companyId: string,
    startDate: Date,
    endDate: Date
  ) {
    const result = await this.db
      .select({
        total: sql<string>`sum(${payments.amount})`,
      })
      .from(payments)
      .where(
        and(
          eq(payments.companyId, companyId),
          eq(payments.status, 'completed'),
          sql`${payments.paymentDate} >= ${startDate}`,
          sql`${payments.paymentDate} <= ${endDate}`
        )
      );

    return result[0]?.total ? parseFloat(result[0].total) : 0;
  }

  /**
   * Search payments with various filters
   */
  async search(
    companyId: string,
    {
      userId,
      invoiceId,
      status,
      method,
      search,
      dateFrom,
      dateTo,
      sortBy = 'paymentDate',
      sortOrder = 'desc',
      page = 1, 
      pageSize = 10
    }: {
      userId?: string;
      invoiceId?: string;
      status?: string;
      method?: string;
      search?: string;
      dateFrom?: Date;
      dateTo?: Date;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      page?: number;
      pageSize?: number;
    }
  ) {
    let conditions = [eq(this.table.companyId, companyId)];
    
    // Add filters
    if (userId) {
      conditions.push(eq(this.table.userId, userId));
    }
    
    if (invoiceId) {
      conditions.push(eq(this.table.invoiceId, invoiceId));
    }
    
    if (status && Object.values(paymentStatusEnum.enumValues).includes(status as any)) {
      conditions.push(eq(this.table.status, status as any));
    }
    
    if (method) {
      conditions.push(eq(this.table.paymentMethod, method as any));
    }
    
    // Search in transaction ID if provided
    if (search && search.trim() !== '') {
      conditions.push(sql`${this.table.transactionId} LIKE ${`%${search}%`}`);
    }
    
    if (dateFrom) {
      conditions.push(sql`${this.table.paymentDate} >= ${dateFrom}`);
    }
    
    if (dateTo) {
      conditions.push(sql`${this.table.paymentDate} <= ${dateTo}`);
    }
    
    // Calculate pagination
    const offset = (page - 1) * pageSize;
    
    // Determine sort direction
    const sortDirection = sortOrder === 'asc' ? sql`asc` : sql`desc`;
    
    // Get total count for pagination info
    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(this.table)
      .where(and(...conditions));
    
    const totalCount = Number(countResult[0].count);
    
    // Get paginated results
    const results = await this.db
      .select()
      .from(this.table)
      .where(and(...conditions))
      .orderBy(sql`${this.table[sortBy as keyof typeof this.table]} ${sortDirection}`)
      .limit(pageSize)
      .offset(offset);
    
    return {
      data: results,
      pagination: {
        page,
        limit: pageSize,
        total: totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    };
  }

  async findAllForExport(companyId: string, filters: any = {}) {
    let conditions = [eq(this.table.companyId, companyId)];
    if (filters.status) {
      conditions.push(eq(this.table.status, filters.status));
    }
    if (filters.search) {
      conditions.push(sql`${this.table.transactionId} LIKE ${`%${filters.search}%`}`);
    }
    if (filters.dateFrom) {
      conditions.push(sql`${this.table.paymentDate} >= ${filters.dateFrom}`);
    }
    if (filters.dateTo) {
      conditions.push(sql`${this.table.paymentDate} <= ${filters.dateTo}`);
    }
    // Add more filters as needed
    return this.db
      .select()
      .from(this.table)
      .where(and(...conditions));
  }
} 