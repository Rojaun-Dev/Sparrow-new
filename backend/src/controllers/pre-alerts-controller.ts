import { Request, Response, NextFunction } from 'express';
import { PreAlertsService, createPreAlertSchema, updatePreAlertSchema } from '../services/pre-alerts-service';
import { ApiResponse } from '../utils/response';

interface AuthRequest extends Request {
  companyId?: string;
}

export class PreAlertsController {
  private service: PreAlertsService;

  constructor() {
    this.service = new PreAlertsService();
  }

  /**
   * Get all pre-alerts for a company
   */
  getAllPreAlerts = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.companyId as string;
      const preAlerts = await this.service.getAllPreAlerts(companyId);
      return ApiResponse.success(res, preAlerts);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get a pre-alert by ID
   */
  getPreAlertById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const companyId = req.companyId as string;
      const preAlert = await this.service.getPreAlertById(id, companyId);
      return ApiResponse.success(res, preAlert);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get pre-alerts by user ID
   */
  getPreAlertsByUserId = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const companyId = req.companyId as string;
      const preAlerts = await this.service.getPreAlertsByUserId(userId, companyId);
      return ApiResponse.success(res, preAlerts);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get pre-alerts by status
   */
  getPreAlertsByStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { status } = req.params;
      const companyId = req.companyId as string;
      const preAlerts = await this.service.getPreAlertsByStatus(status, companyId);
      return ApiResponse.success(res, preAlerts);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get unmatched pre-alerts
   */
  getUnmatchedPreAlerts = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.companyId as string;
      const preAlerts = await this.service.getUnmatchedPreAlerts(companyId);
      return ApiResponse.success(res, preAlerts);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Create a new pre-alert
   */
  createPreAlert = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.companyId as string;
      
      // Validate request body
      try {
        createPreAlertSchema.parse(req.body);
      } catch (error) {
        return ApiResponse.validationError(res, error);
      }

      const preAlert = await this.service.createPreAlert(req.body, companyId);
      return ApiResponse.success(res, preAlert, 'Pre-alert created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update a pre-alert
   */
  updatePreAlert = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const companyId = req.companyId as string;

      // Validate request body
      try {
        updatePreAlertSchema.parse(req.body);
      } catch (error) {
        return ApiResponse.validationError(res, error);
      }

      const preAlert = await this.service.updatePreAlert(id, req.body, companyId);
      return ApiResponse.success(res, preAlert, 'Pre-alert updated successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Cancel a pre-alert
   */
  cancelPreAlert = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const companyId = req.companyId as string;
      const preAlert = await this.service.cancelPreAlert(id, companyId);
      return ApiResponse.success(res, preAlert, 'Pre-alert cancelled successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete a pre-alert
   */
  deletePreAlert = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const companyId = req.companyId as string;
      await this.service.deletePreAlert(id, companyId);
      return ApiResponse.success(res, null, 'Pre-alert deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Search pre-alerts with filters
   */
  searchPreAlerts = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.companyId as string;
      const searchParams = req.query;
      
      // Convert numeric query parameters
      if (searchParams.page) {
        searchParams.page = Number(searchParams.page);
      }
      
      if (searchParams.pageSize) {
        searchParams.pageSize = Number(searchParams.pageSize);
      }
      
      // Convert date query parameters
      if (searchParams.estimatedArrivalFrom) {
        searchParams.estimatedArrivalFrom = new Date(searchParams.estimatedArrivalFrom as string);
      }
      
      if (searchParams.estimatedArrivalTo) {
        searchParams.estimatedArrivalTo = new Date(searchParams.estimatedArrivalTo as string);
      }
      
      const result = await this.service.searchPreAlerts(companyId, searchParams as any);
      return ApiResponse.success(res, result);
    } catch (error) {
      next(error);
    }
  };
} 