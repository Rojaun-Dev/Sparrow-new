import { Request, Response, NextFunction } from 'express';
import { PreAlertsService, createPreAlertSchema, updatePreAlertSchema } from '../services/pre-alerts-service';
import { ApiResponse } from '../utils/response';
import { UploadedFile } from 'express-fileupload';

interface AuthRequest extends Request {
  companyId?: string;
  files?: {
    documents?: UploadedFile | UploadedFile[];
  };
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
      return undefined;
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
      return undefined;
    }
  };

  /**
   * Get pre-alerts by user ID
   */
  getPreAlertsByUserId = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const companyId = req.companyId as string;
      
      // Check if there are any query parameters for filtering
      if (Object.keys(req.query).length > 0) {
        // Create a new object for manipulation
        const searchParams: Record<string, any> = {
          userId: userId, // Add the userId as a filter
        };
        
        // Copy properties from req.query
        Object.assign(searchParams, req.query);
        
        // Convert numeric query parameters
        if (searchParams.page) {
          searchParams.page = Number(searchParams.page);
        }
        
        if (searchParams.limit) {
          searchParams.pageSize = Number(searchParams.limit);
        }
        
        // Convert date query parameters
        if (searchParams.dateFrom) {
          searchParams.estimatedArrivalFrom = new Date(searchParams.dateFrom as string);
        }
        
        if (searchParams.dateTo) {
          searchParams.estimatedArrivalTo = new Date(searchParams.dateTo as string);
        }
        
        // Handle search parameter (map to trackingNumber search)
        if (searchParams.search) {
          searchParams.trackingNumber = searchParams.search;
        }
        
        const result = await this.service.searchPreAlerts(companyId, searchParams);
        return ApiResponse.success(res, result);
      }
      
      // If no query parameters, use the original method
      const preAlerts = await this.service.getPreAlertsByUserId(userId, companyId);
      return ApiResponse.success(res, preAlerts);
    } catch (error) {
      next(error);
      return undefined;
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
      return undefined;
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
      return undefined;
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
      return undefined;
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
      return undefined;
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
      return undefined;
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
      return undefined;
    }
  };

  /**
   * Search pre-alerts with filters
   */
  searchPreAlerts = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.companyId as string;
      // Create a new object for manipulation
      const searchParams: Record<string, any> = {};
      
      // Copy properties from req.query
      Object.assign(searchParams, req.query);
      
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
      
      const result = await this.service.searchPreAlerts(companyId, searchParams);
      return ApiResponse.success(res, result);
    } catch (error) {
      next(error);
      return undefined;
    }
  };

  /**
   * Upload documents to a pre-alert
   */
  uploadDocuments = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const companyId = req.companyId as string;
      
      // Check if files were uploaded
      if (!req.files || !req.files.documents) {
        return ApiResponse.badRequest(res, 'No documents uploaded');
      }
      
      // Convert to array if single file
      const documentFiles = Array.isArray(req.files.documents) 
        ? req.files.documents 
        : [req.files.documents];
      
      // Validate file types
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      for (const file of documentFiles) {
        if (!allowedTypes.includes(file.mimetype)) {
          return ApiResponse.badRequest(
            res, 
            `File type not allowed: ${file.name}. Allowed types: JPEG, PNG, PDF.`
          );
        }
      }
      
      // Convert files to base64 strings
      const documentStrings = documentFiles.map(file => {
        const base64String = `data:${file.mimetype};base64,${file.data.toString('base64')}`;
        return base64String;
      });
      
      // Add documents to pre-alert
      const preAlert = await this.service.addDocuments(id, documentStrings, companyId);
      
      return ApiResponse.success(res, preAlert, 'Documents uploaded successfully');
    } catch (error) {
      next(error);
      return undefined;
    }
  };

  /**
   * Remove a document from a pre-alert
   */
  removeDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id, index } = req.params;
      const companyId = req.companyId as string;
      
      const documentIndex = parseInt(index, 10);
      
      if (isNaN(documentIndex)) {
        return ApiResponse.badRequest(res, 'Invalid document index');
      }
      
      const preAlert = await this.service.removeDocument(id, documentIndex, companyId);
      
      return ApiResponse.success(res, preAlert, 'Document removed successfully');
    } catch (error) {
      next(error);
      return undefined;
    }
  };
} 