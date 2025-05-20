import { db } from '../db';
import { auditLogs } from '../db/schema/audit-logs';
import { users } from '../db/schema/users';
import { companies } from '../db/schema/companies';
import { eq, and, desc, asc, sql } from 'drizzle-orm';

export interface AuditLogData {
  userId: string;
  companyId: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditLogListParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  userId?: string;
  companyId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  fromDate?: string;
  toDate?: string;
}

export class AuditLogsService {
  /**
   * Create a new audit log entry
   */
  async createLog(data: AuditLogData) {
    return db.insert(auditLogs).values(data).returning();
  }

  /**
   * Get audit logs with pagination and filtering
   */
  async getLogs(params: AuditLogListParams = {}) {
    const {
      page = 1,
      limit = 10,
      sort = 'createdAt',
      order = 'desc',
      userId,
      companyId,
      action,
      entityType,
      entityId,
      fromDate,
      toDate
    } = params;

    const offset = (page - 1) * limit;
    
    // Build conditions
    const conditions = [];
    
    if (userId) {
      conditions.push(eq(auditLogs.userId, userId));
    }
    
    if (companyId) {
      conditions.push(eq(auditLogs.companyId, companyId));
    }
    
    if (action) {
      conditions.push(eq(auditLogs.action, action));
    }
    
    if (entityType) {
      conditions.push(eq(auditLogs.entityType, entityType));
    }
    
    if (entityId) {
      conditions.push(eq(auditLogs.entityId, entityId));
    }
    
    if (fromDate) {
      conditions.push(sql`${auditLogs.createdAt} >= ${new Date(fromDate)}`);
    }
    
    if (toDate) {
      conditions.push(sql`${auditLogs.createdAt} <= ${new Date(toDate)}`);
    }
    
    // Combine conditions
    const whereCondition = conditions.length > 0 
      ? and(...conditions) 
      : undefined;
    
    // Get total count for pagination
    const totalCountResult = await db
      .select({ count: sql`count(*)`.mapWith(Number) })
      .from(auditLogs)
      .where(whereCondition);
    
    const totalItems = totalCountResult[0].count;
    const totalPages = Math.ceil(totalItems / limit);
    
    // Build order by condition
    let orderBy;
    switch (sort) {
      case 'action':
        orderBy = order === 'asc' ? asc(auditLogs.action) : desc(auditLogs.action);
        break;
      case 'entityType':
        orderBy = order === 'asc' ? asc(auditLogs.entityType) : desc(auditLogs.entityType);
        break;
      case 'createdAt':
      default:
        orderBy = order === 'asc' ? asc(auditLogs.createdAt) : desc(auditLogs.createdAt);
    }
    
    // Get logs with user and company info
    const data = await db.select({
      id: auditLogs.id,
      action: auditLogs.action,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      details: auditLogs.details,
      ipAddress: auditLogs.ipAddress,
      userAgent: auditLogs.userAgent,
      createdAt: auditLogs.createdAt,
      userId: auditLogs.userId,
      userEmail: users.email,
      userName: sql`concat(${users.firstName}, ' ', ${users.lastName})`,
      companyId: auditLogs.companyId,
      companyName: companies.name
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.userId, users.id))
    .leftJoin(companies, eq(auditLogs.companyId, companies.id))
    .where(whereCondition)
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);
    
    return {
      data,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages
      }
    };
  }

  /**
   * Get user activity logs for a specific user
   */
  async getUserActivity(userId: string, params: AuditLogListParams = {}) {
    return this.getLogs({
      ...params,
      userId
    });
  }

  /**
   * Get entity activity logs for a specific entity
   */
  async getEntityActivity(entityType: string, entityId: string, params: AuditLogListParams = {}) {
    return this.getLogs({
      ...params,
      entityType,
      entityId
    });
  }
} 