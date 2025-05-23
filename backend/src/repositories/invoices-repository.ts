import { SQL, and, eq, desc, asc, gte, lte, sql } from 'drizzle-orm';
import { BaseRepository } from './base-repository';
import { invoices, invoiceStatusEnum } from '../db/schema/invoices';
import { invoiceItems } from '../db/schema/invoice-items';

export class InvoicesRepository extends BaseRepository<typeof invoices> {
  constructor() {
    super(invoices);
  }

  /**
   * Find invoices by user ID within a company
   */
  async findByUserId(userId: string, companyId: string) {
    return this.db
      .select()
      .from(this.table)
      .where(
        and(
          eq(this.table.userId, userId),
          eq(this.table.companyId, companyId)
        )
      )
      .orderBy(desc(this.table.createdAt));
  }

  /**
   * Find an invoice by invoice number within a company
   */
  async findByInvoiceNumber(invoiceNumber: string, companyId: string) {
    const result = await this.db
      .select()
      .from(this.table)
      .where(
        and(
          eq(this.table.invoiceNumber, invoiceNumber),
          eq(this.table.companyId, companyId)
        )
      )
      .limit(1);
    
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Find invoices by status within a company
   */
  async findByStatus(status: string, companyId: string) {
    // Validate status
    if (!Object.values(invoiceStatusEnum.enumValues).includes(status as any)) {
      throw new Error('Invalid invoice status');
    }
    
    return this.db
      .select()
      .from(this.table)
      .where(
        and(
          eq(this.table.status, status as any),
          eq(this.table.companyId, companyId)
        )
      )
      .orderBy(desc(this.table.createdAt));
  }

  /**
   * Find overdue invoices (due date is in the past and status is issued)
   */
  async findOverdue(companyId: string) {
    const today = new Date();
    
    return this.db
      .select()
      .from(this.table)
      .where(
        and(
          eq(this.table.status, 'issued'),
          lte(this.table.dueDate, today),
          eq(this.table.companyId, companyId)
        )
      )
      .orderBy(asc(this.table.dueDate));
  }
  
  /**
   * Search invoices by various criteria within a company
   */
  async search(
    companyId: string,
    {
      invoiceNumber,
      userId,
      status,
      issueDateFrom,
      issueDateTo,
      dueDateFrom,
      dueDateTo,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1, 
      pageSize = 10
    }: {
      invoiceNumber?: string;
      userId?: string;
      status?: string;
      issueDateFrom?: Date;
      issueDateTo?: Date;
      dueDateFrom?: Date;
      dueDateTo?: Date;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      page?: number;
      pageSize?: number;
    }
  ) {
    let conditions: SQL<unknown>[] = [eq(this.table.companyId, companyId)];
    
    // Add filters
    if (invoiceNumber && invoiceNumber.trim() !== '') {
      conditions.push(sql`${this.table.invoiceNumber} LIKE ${`%${invoiceNumber}%`}`);
    }
    
    if (userId) {
      conditions.push(eq(this.table.userId, userId));
    }
    
    if (status && Object.values(invoiceStatusEnum.enumValues).includes(status as any)) {
      conditions.push(eq(this.table.status, status as any));
    }
    
    if (issueDateFrom) {
      conditions.push(gte(this.table.issueDate, issueDateFrom));
    }
    
    if (issueDateTo) {
      conditions.push(lte(this.table.issueDate, issueDateTo));
    }

    if (dueDateFrom) {
      conditions.push(gte(this.table.dueDate, dueDateFrom));
    }
    
    if (dueDateTo) {
      conditions.push(lte(this.table.dueDate, dueDateTo));
    }
    
    // Calculate pagination
    const offset = (page - 1) * pageSize;
    
    // Determine sort direction
    const sortDirection = sortOrder === 'asc' ? asc : desc;
    
    // Get valid sort columns
    const validSortColumns = {
      createdAt: this.table.createdAt,
      issueDate: this.table.issueDate,
      dueDate: this.table.dueDate,
      invoiceNumber: this.table.invoiceNumber,
      totalAmount: this.table.totalAmount,
    };
    
    // Default to createdAt if invalid sortBy is provided
    const sortColumn = validSortColumns[sortBy as keyof typeof validSortColumns] || this.table.createdAt;
    
    // Get total count (for pagination info)
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
      .orderBy(sortDirection(sortColumn))
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

  /**
   * Find invoice by package ID
   * @param packageId - The package ID
   * @param companyId - The company ID
   */
  async findByPackageId(packageId: string, companyId: string) {
    const result = await this.db
      .select({
        invoice: this.table,
      })
      .from(this.table)
      .innerJoin(
        invoiceItems,
        and(
          eq(invoiceItems.invoiceId, this.table.id),
          eq(invoiceItems.packageId, packageId)
        )
      )
      .where(eq(this.table.companyId, companyId))
      .limit(1);
    
    return result.length > 0 ? result[0].invoice : null;
  }
} 