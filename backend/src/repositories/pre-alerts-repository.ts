import { SQL, and, eq, desc, asc, like, isNull, gte, lte, sql } from 'drizzle-orm';
import { preAlerts, preAlertStatusEnum } from '../db/schema/pre-alerts';
import { BaseRepository } from './base-repository';

// Add ilike import if available
let ilike: any;
try {
  // Some drizzle-orm versions export ilike
  ({ ilike } = require('drizzle-orm'));
} catch {}

export class PreAlertsRepository extends BaseRepository<typeof preAlerts> {
  constructor() {
    super(preAlerts);
  }

  /**
   * Find a pre-alert by tracking number within a company
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
   * Find pre-alerts by user ID within a company
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
   * Find pre-alerts by status within a company
   */
  async findByStatus(status: string, companyId: string) {
    // Validate status
    if (!Object.values(preAlertStatusEnum.enumValues).includes(status as any)) {
      throw new Error('Invalid pre-alert status');
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
   * Find unmatched pre-alerts (pending status, no package ID)
   */
  async findUnmatched(companyId: string) {
    return this.db
      .select()
      .from(this.table)
      .where(
        and(
          eq(this.table.status, 'pending'),
          isNull(this.table.packageId),
          eq(this.table.companyId, companyId)
        )
      )
      .orderBy(asc(this.table.estimatedArrival));
  }
  
  /**
   * Update pre-alert with package ID and change status to matched
   */
  async matchToPackage(id: string, packageId: string, companyId: string) {
    const result = await this.db
      .update(this.table)
      .set({
        packageId,
        status: 'matched',
        updatedAt: new Date(),
      })
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
   * Search pre-alerts by various criteria within a company
   */
  async search(
    companyId: string,
    {
      trackingNumber,
      userId,
      status,
      estimatedArrivalFrom,
      estimatedArrivalTo,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1, 
      pageSize = 10
    }: {
      trackingNumber?: string;
      userId?: string;
      status?: string;
      estimatedArrivalFrom?: Date;
      estimatedArrivalTo?: Date;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      page?: number;
      pageSize?: number;
    }
  ) {
    let conditions: SQL<unknown>[] = [eq(this.table.companyId, companyId)];
    
    // Add filters
    if (trackingNumber) {
      if (typeof ilike === 'function') {
        conditions.push(ilike(this.table.trackingNumber, `%${trackingNumber}%`));
      } else {
        // Fallback: use LOWER for case-insensitive search
        conditions.push(sql`LOWER(${this.table.trackingNumber}) LIKE LOWER(${`%${trackingNumber}%`})`);
      }
    }
    
    if (userId) {
      conditions.push(eq(this.table.userId, userId));
    }
    
    if (status && Object.values(preAlertStatusEnum.enumValues).includes(status as any)) {
      conditions.push(eq(this.table.status, status as any));
    }
    
    if (estimatedArrivalFrom) {
      conditions.push(gte(this.table.estimatedArrival, estimatedArrivalFrom));
    }
    
    if (estimatedArrivalTo) {
      conditions.push(lte(this.table.estimatedArrival, estimatedArrivalTo));
    }
    
    // Calculate pagination
    const offset = (page - 1) * pageSize;
    
    // Determine sort direction
    const sortDirection = sortOrder === 'asc' ? asc : desc;
    
    // Get valid sort columns
    const validSortColumns = {
      createdAt: this.table.createdAt,
      estimatedArrival: this.table.estimatedArrival,
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

  public getDatabaseInstance() {
    return this.db;
  }
} 