import { and, eq, desc, asc, like, gte, lte, sql, not, exists, or, SQL } from 'drizzle-orm';
import { packages, packageStatusEnum } from '../db/schema/packages';
import { BaseRepository } from './base-repository';
import { invoiceItems } from '../db/schema/invoice-items';
import { db } from '../db';

export class PackagesRepository extends BaseRepository<typeof packages> {
  constructor() {
    super(packages);
  }

  getDatabaseInstance() {
    return db;
  }

  /**
   * Find a package by tracking number within a company
   */
  async findByTrackingNumber(trackingNumber: string, companyId: string) {
    const result = await this.db
      .select()
      .from(this.table)
      .where(
        and(
          eq(this.table.trackingNumber, trackingNumber),
          eq(this.table.companyId, companyId)
        )
      )
      .limit(1);
    
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Find a package by internal tracking ID within a company
   */
  async findByInternalTrackingId(internalTrackingId: string, companyId: string) {
    const result = await this.db
      .select()
      .from(this.table)
      .where(
        and(
          eq(this.table.internalTrackingId, internalTrackingId),
          eq(this.table.companyId, companyId)
        )
      )
      .limit(1);
    
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Find packages by user ID within a company with filtering options
   */
  async findByUserId(
    userId: string, 
    companyId: string,
    filters: {
      search?: string;
      status?: string;
      dateFrom?: string;
      dateTo?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      limit?: number;
      page?: number;
    } = {}
  ) {
    let conditions: SQL<unknown>[] = [
      eq(this.table.userId, userId),
      eq(this.table.companyId, companyId)
    ];
    
    // Add status filter
    if (filters.status && Object.values(packageStatusEnum.enumValues).includes(filters.status as any)) {
      conditions.push(eq(this.table.status, filters.status as any));
    }
    
    // Add search filter (search in tracking number or internal tracking ID)
    if (filters.search) {
      const searchConditions = [
        like(this.table.trackingNumber, `%${filters.search}%`),
        like(this.table.internalTrackingId, `%${filters.search}%`),
        like(this.table.description, `%${filters.search}%`)
      ].filter((condition): condition is SQL<unknown> => condition !== undefined);
      
      if (searchConditions.length > 0) {
        const searchOrCondition = or(...searchConditions) as SQL<unknown>;
        conditions.push(searchOrCondition);
      }
    }
    
    // Add date range filters
    if (filters.dateFrom) {
      const dateFrom = new Date(filters.dateFrom);
      conditions.push(gte(this.table.createdAt, dateFrom));
    }
    
    if (filters.dateTo) {
      const dateTo = new Date(filters.dateTo);
      conditions.push(lte(this.table.createdAt, dateTo));
    }
    
    // Determine sort column and direction
    const validSortColumns = {
      createdAt: this.table.createdAt,
      receivedDate: this.table.receivedDate,
      updatedAt: this.table.updatedAt,
      trackingNumber: this.table.trackingNumber,
    };
    
    const sortDirection = (filters.sortOrder === 'asc') ? asc : desc;
    const sortColumn = validSortColumns[filters.sortBy as keyof typeof validSortColumns] || this.table.createdAt;
    
    // Calculate pagination if needed
    const limit = filters.limit || 10;
    const offset = filters.page ? (filters.page - 1) * limit : 0;
    
    // Get total count for pagination info
    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(this.table)
      .where(and(...conditions.filter(Boolean)));
    
    const totalCount = Number(countResult[0].count);
    
    // Get paginated results
    const results = await this.db
      .select()
      .from(this.table)
      .where(and(...conditions.filter(Boolean)))
      .orderBy(sortDirection(sortColumn))
      .limit(limit)
      .offset(offset);
    
    return {
      data: results,
      pagination: {
        page: filters.page || 1,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  /**
   * Find packages by status within a company
   */
  async findByStatus(status: string, companyId: string) {
    // Validate status
    if (!Object.values(packageStatusEnum.enumValues).includes(status as any)) {
      throw new Error('Invalid package status');
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
   * Search packages by various criteria within a company
   */
  async search(
    companyId: string,
    {
      trackingNumber,
      internalTrackingId,
      userId,
      status,
      receivedDateFrom,
      receivedDateTo,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1, 
      pageSize = 10
    }: {
      trackingNumber?: string;
      internalTrackingId?: string;
      userId?: string;
      status?: string;
      receivedDateFrom?: Date;
      receivedDateTo?: Date;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      page?: number;
      pageSize?: number;
    }
  ) {
    let conditions: SQL<unknown>[] = [eq(this.table.companyId, companyId)];
    
    // Add filters
    if (trackingNumber) {
      conditions.push(like(this.table.trackingNumber, `%${trackingNumber}%`));
    }
    
    if (internalTrackingId) {
      conditions.push(like(this.table.internalTrackingId, `%${internalTrackingId}%`));
    }
    
    if (userId) {
      conditions.push(eq(this.table.userId, userId));
    }
    
    if (status && Object.values(packageStatusEnum.enumValues).includes(status as any)) {
      conditions.push(eq(this.table.status, status as any));
    }
    
    if (receivedDateFrom) {
      conditions.push(gte(this.table.receivedDate, receivedDateFrom));
    }
    
    if (receivedDateTo) {
      conditions.push(lte(this.table.receivedDate, receivedDateTo));
    }
    
    // Calculate pagination
    const offset = (page - 1) * pageSize;
    
    // Determine sort direction
    const sortDirection = sortOrder === 'asc' ? asc : desc;
    
    // Get valid sort columns
    const validSortColumns = {
      createdAt: this.table.createdAt,
      receivedDate: this.table.receivedDate,
      updatedAt: this.table.updatedAt,
      trackingNumber: this.table.trackingNumber,
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
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    };
  }

  /**
   * Find packages that haven't been billed yet for a specific user
   * These are packages that don't have an associated invoice item
   */
  async findUnbilledByUser(userId: string, companyId: string) {
    return this.db
      .select()
      .from(this.table)
      .where(
        and(
          eq(this.table.userId, userId),
          eq(this.table.companyId, companyId),
          or(
            // Packages in processed or ready_for_pickup states
            eq(this.table.status, 'processed' as any),
            eq(this.table.status, 'ready_for_pickup' as any)
          ),
          // Not already in an invoice
          not(
            exists(
              this.db
                .select()
                .from(invoiceItems)
                .where(
                  and(
                    eq(invoiceItems.packageId, this.table.id),
                    eq(invoiceItems.companyId, companyId)
                  )
                )
            )
          )
        )
      )
      .orderBy(desc(this.table.createdAt));
  }

  /**
   * Find packages by invoice ID
   * @param invoiceId - The invoice ID to filter by
   * @param companyId - The company ID
   */
  async findByInvoiceId(invoiceId: string, companyId: string) {
    return this.db
      .select({
        package: this.table,
      })
      .from(this.table)
      .innerJoin(
        invoiceItems,
        and(
          eq(invoiceItems.packageId, this.table.id),
          eq(invoiceItems.invoiceId, invoiceId)
        )
      )
      .where(eq(this.table.companyId, companyId))
      .orderBy(desc(this.table.createdAt))
      .then(results => results.map(r => r.package));
  }
} 