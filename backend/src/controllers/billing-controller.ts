import { Request, Response, NextFunction } from 'express';
import { BillingService, generateInvoiceSchema } from '../services/billing-service';
import { ApiResponse } from '../utils/response';

interface AuthRequest extends Request {
  companyId?: string;
}

export class BillingController {
  private service: BillingService;

  constructor() {
    this.service = new BillingService();
  }

  /**
   * Calculate fees for a package
   */
  calculatePackageFees = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { packageId } = req.params;
      const companyId = req.companyId as string;
      
      const fees = await this.service.calculatePackageFees(packageId, companyId);
      return ApiResponse.success(res, fees);
    } catch (error) {
      next(error);
      return undefined;
    }
  };

  /**
   * Generate an invoice for packages
   */
  generateInvoice = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.companyId as string;
      
      // Validate request body
      try {
        generateInvoiceSchema.parse(req.body);
      } catch (error) {
        return ApiResponse.validationError(res, error);
      }

      const invoice = await this.service.generateInvoice(req.body, companyId);
      return ApiResponse.success(res, invoice, 'Invoice generated successfully', 201);
    } catch (error) {
      next(error);
      return undefined;
    }
  };

  /**
   * Generate invoice for all unbilled packages of a user
   */
  generateInvoiceForUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const companyId = req.companyId as string;

      const invoice = await this.service.generateInvoiceForUser(userId, companyId);
      return ApiResponse.success(res, invoice, 'Invoice generated successfully for user', 201);
    } catch (error) {
      next(error);
      return undefined;
    }
  };

  /**
   * Preview invoice calculations without creating an invoice
   */
  previewInvoice = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.companyId as string;
      
      // Validate request body
      try {
        generateInvoiceSchema.parse(req.body);
      } catch (error) {
        return ApiResponse.validationError(res, error);
      }

      const preview = await this.service.previewInvoice(req.body, companyId);
      return ApiResponse.success(res, preview);
    } catch (error) {
      next(error);
      return undefined;
    }
  };
} 