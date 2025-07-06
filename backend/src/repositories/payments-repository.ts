import { and, eq, sql } from 'drizzle-orm';
import { BaseRepository } from './base-repository';
import { payments, paymentStatusEnum } from '../db/schema/payments';
import { invoices } from '../db/schema/invoices';
import { users } from '../db/schema/users';
import { gte, lte, desc } from 'drizzle-orm';

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
    
    // Get paginated results including invoice number and customer name
    const joinedResults = await this.db
      .select({
        payment: this.table, // all payment columns nested under 'payment'
        invoiceNumber: invoices.invoiceNumber,
        customerFirstName: users.firstName,
        customerLastName: users.lastName,
      })
      .from(this.table)
      .leftJoin(invoices, eq(this.table.invoiceId, invoices.id))
      .leftJoin(users, eq(this.table.userId, users.id))
      .where(and(...conditions))
      .orderBy(sql`${this.table[sortBy as keyof typeof this.table]} ${sortDirection}`)
      .limit(pageSize)
      .offset(offset);
    
    // Flatten the structure so that payment fields are top-level along with invoiceNumber and customer names
    const results = joinedResults.map((row: any) => ({
      ...row.payment,
      invoiceNumber: row.invoiceNumber,
      customerFirstName: row.customerFirstName,
      customerLastName: row.customerLastName,
    }));
    
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
    try {
      let query = this.db
        .select({
          id: payments.id,
          invoiceNumber: invoices.invoiceNumber,
          customerName: sql`concat(${users.firstName}, ' ', ${users.lastName})`,
          amount: payments.amount,
          paymentMethod: payments.paymentMethod,
          status: payments.status,
          transactionId: payments.transactionId,
          paymentDate: payments.paymentDate,
          notes: payments.notes,
          meta: payments.meta,
          createdAt: payments.createdAt
        })
        .from(payments)
        .innerJoin(invoices, eq(payments.invoiceId, invoices.id))
        .innerJoin(users, eq(payments.userId, users.id))
        .where(eq(payments.companyId, companyId));
      
      // Apply filters
      if (filters.status) {
        query = query.where(eq(payments.status, filters.status));
      }
      
      if (filters.paymentMethod) {
        query = query.where(eq(payments.paymentMethod, filters.paymentMethod));
      }
      
      if (filters.dateFrom) {
        const fromDate = new Date(filters.dateFrom);
        query = query.where(gte(payments.paymentDate, fromDate));
      }
      
      if (filters.dateTo) {
        const toDate = new Date(filters.dateTo);
        query = query.where(lte(payments.paymentDate, toDate));
      }
      
      const results = await query.orderBy(desc(payments.createdAt));
      
      // Format for CSV export
      return results.map(payment => {
        // Extract currency info from meta if available
        const meta = payment.meta as Record<string, any> | null;
        const currency = meta?.currency || 'USD';
        const exchangeRate = meta?.exchangeRate || null;
        
        return {
          ID: payment.id,
          'Invoice Number': payment.invoiceNumber,
          'Customer Name': payment.customerName,
          'Amount': payment.amount,
          'Currency': currency,
          'Exchange Rate': exchangeRate,
          'Payment Method': payment.paymentMethod,
          'Status': payment.status,
          'Transaction ID': payment.transactionId || 'N/A',
          'Payment Date': payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : 'N/A',
          'Notes': payment.notes || '',
          'Created At': new Date(payment.createdAt).toLocaleString()
        };
      });
    } catch (error) {
      console.error('Error exporting payments:', error);
      throw new Error('Failed to export payments data');
    }
  }

  /**
   * Update a payment with special handling for payment dates
   */
  async update(id: string, data: any, companyId: string) {
    // Handle payment date specifically for payments
    const processedData = { ...data };
    
    // Special handling for paymentDate
    if ('paymentDate' in processedData) {
      // Ensure paymentDate is a proper Date object
      if (processedData.paymentDate === null) {
        // If null, remove it from the update
        delete processedData.paymentDate;
      } else if (!(processedData.paymentDate instanceof Date)) {
        try {
          // Try to convert to Date
          const dateValue = new Date(processedData.paymentDate);
          
          // Check if the date is valid (not Dec 31 1969 or Jan 1 1970)
          if (dateValue.getFullYear() < 1971) {
            console.warn(`Invalid payment date detected: ${dateValue}, using current date instead`);
            processedData.paymentDate = new Date(); // Use current date as fallback
          } else {
            processedData.paymentDate = dateValue;
          }
        } catch (e) {
          console.error('Error converting payment date:', e);
          // Use current date as fallback
          processedData.paymentDate = new Date();
        }
      }
      
      // Log the final payment date being used
      console.log(`Final payment date for update: ${processedData.paymentDate instanceof Date ? 
        processedData.paymentDate.toISOString() : processedData.paymentDate}`);
    }
    
    // Use the parent update method with the processed data
    return super.update(id, processedData, companyId);
  }
} 