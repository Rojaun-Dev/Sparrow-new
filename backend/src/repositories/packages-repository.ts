import { SQL, and, eq, desc, asc, like, gte, lte, sql } from 'drizzle-orm';
import { packages, packageStatusEnum } from '../db/schema/packages';
import { BaseRepository } from './base-repository';

export class PackagesRepository extends BaseRepository<typeof packages> {
  constructor() {
    super(packages);
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
   * Find packages by user ID within a company
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
} 