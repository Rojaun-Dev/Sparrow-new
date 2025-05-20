import { useState, useCallback } from 'react';
import { 
  AuditLogService, 
  AuditLogListParams, 
  AuditLogEntry 
} from '@/lib/api/auditLogService';
import { PaginatedResponse } from '@/lib/api/userService';

export function useAuditLogs() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [pagination, setPagination] = useState<PaginatedResponse<AuditLogEntry>['pagination']>({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const auditLogService = new AuditLogService();

  const fetchLogs = useCallback(async (params?: AuditLogListParams) => {
    try {
      setLoading(true);
      setError(null);
      const response = await auditLogService.getAllLogs(params);
      setLogs(response.data);
      setPagination(response.pagination);
      return response;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch audit logs');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUserActivity = useCallback(async (userId: string, params?: Omit<AuditLogListParams, 'userId'>) => {
    try {
      setLoading(true);
      setError(null);
      const response = await auditLogService.getUserActivity(userId, params);
      setLogs(response.data);
      setPagination(response.pagination);
      return response;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch user activity');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    logs,
    pagination,
    loading,
    error,
    fetchLogs,
    fetchUserActivity
  };
} 