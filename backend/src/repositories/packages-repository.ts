import { and, eq, desc, asc, like, gte, lte, sql, not, exists, or, SQL } from 'drizzle-orm';
import { packages, packageStatusEnum } from '../db/schema/packages';
import { BaseRepository } from './base-repository';
import { invoiceItems } from '../db/schema/invoice-items';
import { db } from '../db';
import { AppError } from '../utils/app-error';

export class PackagesRepository extends BaseRepository<typeof packages> {
  constructor() {
    super(packages);
  }

  getDatabaseInstance() {
    return db;
  }
  
  /**
   * Override delete method to add logging and error handling
   */
  async delete(id: string, companyId?: string): Promise<any> {
    console.log(`PackagesRepository.delete called with id=${id}, companyId=${companyId}`);
    try {
      const result = await super.delete(id, companyId);
      console.log('Delete operation result:', result);
      return result;
    } catch (error) {
      console.error('Error in PackagesRepository.delete:', error);
      throw new AppError(`Failed to delete package: ${(error as Error).message}`, 500);
    }
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
    
    // Add search filter (search in tracking number or description)
    if (filters.search) {
      const searchConditions = [
        like(this.table.trackingNumber, `%${filters.search}%`),
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
  async searchPackages(
    companyId: string,
    {
      trackingNumber,
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
    
    if (userId) {
      conditions.push(eq(this.table.userId, userId));
    }
    
    if (status) {
      conditions.push(eq(this.table.status, status as any));
    }
    
    if (receivedDateFrom) {
      conditions.push(gte(this.table.receivedDate, receivedDateFrom));
    }
    
    if (receivedDateTo) {
      conditions.push(lte(this.table.receivedDate, receivedDateTo));
    }
    
    // Set up sorting
    const sortField = sortBy === 'receivedDate' ? this.table.receivedDate : this.table.createdAt;
    const sortFunc = sortOrder === 'asc' ? asc : desc;
    const sortOptions = sortFunc(sortField);
    
    // Set up pagination
    const offset = (page - 1) * pageSize;
    
    // Get the count for pagination
    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(this.table)
      .where(and(...conditions));
    
    const totalCount = Number(countResult[0].count);
    
    // Get the data with pagination
    const results = await this.db
      .select()
      .from(this.table)
      .where(and(...conditions))
      .orderBy(sortOptions)
      .limit(pageSize)
      .offset(offset);
    
    return {
      data: results,
      pagination: {
        page,
        pageSize,
        total: totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    };
  }

  /**
   * Find packages that have not been billed for a user
   */
  async findUnbilledByUserId(userId: string, companyId: string) {
    // Select packages that don't exist in invoice_items
    const unbilledPackages = await this.db
      .select()
      .from(this.table)
      .where(
        and(
          eq(this.table.userId, userId),
          eq(this.table.companyId, companyId),
          not(
            exists(
              this.db
                .select()
                .from(invoiceItems)
                .where(eq(invoiceItems.packageId, this.table.id))
            )
          )
        )
      )
      .orderBy(desc(this.table.createdAt));
    
    return unbilledPackages;
  }
  
  /**
   * Find packages by invoice ID
   */
  async findByInvoiceId(invoiceId: string, companyId: string) {
    const results = await this.db
      .select()
      .from(this.table)
      .innerJoin(
        invoiceItems,
        and(
          eq(invoiceItems.packageId, this.table.id),
          eq(invoiceItems.invoiceId, invoiceId)
        )
      )
      .where(eq(this.table.companyId, companyId))
      .orderBy(desc(this.table.receivedDate));
    
    // Extract only the package data from the joined results
    return results.map(result => result.packages);
  }
  
  /**
   * Find all packages for a company with filtering options for export
   */
  async findByCompanyId(companyId: string, filters: any = {}) {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      fromDate,
      toDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = filters;
    
    // Build conditions
    const conditions: SQL<unknown>[] = [eq(this.table.companyId, companyId)];
    
    if (status) {
      conditions.push(eq(this.table.status, status as any));
    }
    
    if (search) {
      const searchTerm = `%${search}%`;
      conditions.push(
        or(
          like(this.table.trackingNumber, searchTerm),
          like(this.table.description, searchTerm)
        ) as SQL<unknown>
      );
    }
    
    if (fromDate) {
      const from = new Date(fromDate);
      conditions.push(gte(this.table.createdAt, from));
    }
    
    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999); // End of the day
      conditions.push(lte(this.table.createdAt, to));
    }
    
    // Calculate pagination
    const offset = (page - 1) * limit;
    
    // Set up sorting
    let orderBy;
    if (sortBy === 'trackingNumber') {
      orderBy = sortOrder === 'asc' ? asc(this.table.trackingNumber) : desc(this.table.trackingNumber);
    } else if (sortBy === 'status') {
      orderBy = sortOrder === 'asc' ? asc(this.table.status) : desc(this.table.status);
    } else if (sortBy === 'receivedDate') {
      orderBy = sortOrder === 'asc' ? asc(this.table.receivedDate) : desc(this.table.receivedDate);
    } else {
      orderBy = sortOrder === 'asc' ? asc(this.table.createdAt) : desc(this.table.createdAt);
    }
    
    // Get total count
    const [{ count }] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(this.table)
      .where(and(...conditions));
      
    const totalCount = Number(count);
    
    // Get data
    const results = await this.db
      .select()
      .from(this.table)
      .where(and(...conditions))
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);
    
    return {
      data: results,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }
} 