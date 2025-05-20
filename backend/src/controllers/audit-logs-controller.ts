import { Request, Response, NextFunction } from 'express';
import { AuditLogsService, AuditLogListParams } from '../services/audit-logs-service';
import { ApiResponse } from '../utils/response';

interface AuthRequest extends Request {
  companyId?: string;
  userId?: string;
  userRole?: string;
}

export class AuditLogsController {
  private service: AuditLogsService;

  constructor() {
    this.service = new AuditLogsService();
  }

  /**
   * SUPERADMIN: Get all audit logs with filtering and pagination
   */
  getAllLogs = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract query parameters
      const { 
        page, 
        limit, 
        sort, 
        order, 
        userId,
        companyId,
        action,
        entityType,
        entityId,
        fromDate,
        toDate
      } = req.query;
      
      // Convert query parameters to correct types
      const params: AuditLogListParams = {
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        sort: sort as string,
        order: order as 'asc' | 'desc',
        userId: userId as string,
        companyId: companyId as string,
        action: action as string,
        entityType: entityType as string,
        entityId: entityId as string,
        fromDate: fromDate as string,
        toDate: toDate as string
      };
      
      const result = await this.service.getLogs(params);
      return ApiResponse.success(res, result);
    } catch (error) {
      next(error);
      return undefined;
    }
  };

  /**
   * Get user activity logs
   */
  getUserActivity = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      
      // Extract query parameters
      const { 
        page, 
        limit, 
        sort, 
        order,
        action,
        entityType,
        fromDate,
        toDate
      } = req.query;
      
      // Convert query parameters to correct types
      const params: AuditLogListParams = {
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        sort: sort as string,
        order: order as 'asc' | 'desc',
        action: action as string,
        entityType: entityType as string,
        fromDate: fromDate as string,
        toDate: toDate as string
      };
      
      const result = await this.service.getUserActivity(id, params);
      return ApiResponse.success(res, result);
    } catch (error) {
      next(error);
      return undefined;
    }
  };

  /**
   * Create an audit log entry
   */
  createLogEntry = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId as string;
      const companyId = req.companyId as string;
      const { action, entityType, entityId, details } = req.body;
      
      // Get IP address and user agent
      const ipAddress = req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';
      
      const log = await this.service.createLog({
        userId,
        companyId,
        action,
        entityType,
        entityId,
        details,
        ipAddress,
        userAgent
      });
      
      return ApiResponse.success(res, log[0], 'Audit log created', 201);
    } catch (error) {
      next(error);
      return undefined;
    }
  };
} 