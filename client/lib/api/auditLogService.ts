import { ApiClient } from './apiClient';
import { PaginatedResponse } from './userService';

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

export interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  userId: string;
  userEmail: string;
  userName: string;
  companyId: string;
  companyName: string;
}

export class AuditLogService {
  private apiClient: ApiClient;

  constructor() {
    this.apiClient = new ApiClient();
  }

  /**
   * Get all audit logs with pagination and filtering
   */
  async getAllLogs(params: AuditLogListParams = {}): Promise<PaginatedResponse<AuditLogEntry>> {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.sort) queryParams.append('sort', params.sort);
    if (params.order) queryParams.append('order', params.order);
    if (params.userId) queryParams.append('userId', params.userId);
    if (params.companyId) queryParams.append('companyId', params.companyId);
    if (params.action) queryParams.append('action', params.action);
    if (params.entityType) queryParams.append('entityType', params.entityType);
    if (params.entityId) queryParams.append('entityId', params.entityId);
    if (params.fromDate) queryParams.append('fromDate', params.fromDate);
    if (params.toDate) queryParams.append('toDate', params.toDate);
    
    const url = `/superadmin/audit-logs?${queryParams.toString()}`;
    return this.apiClient.get<PaginatedResponse<AuditLogEntry>>(url);
  }

  /**
   * Get user activity logs
   */
  async getUserActivity(userId: string, params: Omit<AuditLogListParams, 'userId'> = {}): Promise<PaginatedResponse<AuditLogEntry>> {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.sort) queryParams.append('sort', params.sort);
    if (params.order) queryParams.append('order', params.order);
    if (params.action) queryParams.append('action', params.action);
    if (params.entityType) queryParams.append('entityType', params.entityType);
    if (params.fromDate) queryParams.append('fromDate', params.fromDate);
    if (params.toDate) queryParams.append('toDate', params.toDate);
    
    const url = `/superadmin/users/${userId}/activity?${queryParams.toString()}`;
    return this.apiClient.get<PaginatedResponse<AuditLogEntry>>(url);
  }
} 