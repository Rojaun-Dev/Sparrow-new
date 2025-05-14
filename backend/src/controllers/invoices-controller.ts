import { Request, Response, NextFunction } from 'express';
import { InvoicesService, createInvoiceSchema, updateInvoiceSchema } from '../services/invoices-service';
import { ApiResponse } from '../utils/response';

interface AuthRequest extends Request {
  companyId?: string;
}

export class InvoicesController {
  private service: InvoicesService;

  constructor() {
    this.service = new InvoicesService();
  }

  /**
   * Get all invoices for a company
   */
  getAllInvoices = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.companyId as string;
      const invoices = await this.service.getAllInvoices(companyId);
      return ApiResponse.success(res, invoices);
    } catch (error) {
      next(error);
      return undefined;
    }
  };

  /**
   * Get an invoice by ID
   */
  getInvoiceById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const companyId = req.companyId as string;
      const invoice = await this.service.getInvoiceById(id, companyId);
      return ApiResponse.success(res, invoice);
    } catch (error) {
      next(error);
      return undefined;
    }
  };

  /**
   * Get invoices by user ID
   */
  getInvoicesByUserId = async (req: AuthRequest, res: Response, next: NextFunction) => {
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
        
        // Handle search parameter (map to invoiceNumber search)
        if (searchParams.search) {
          searchParams.invoiceNumber = searchParams.search;
        }
        
        // Convert date query parameters
        if (searchParams.dateFrom) {
          searchParams.issueDateFrom = new Date(searchParams.dateFrom as string);
        }
        
        if (searchParams.dateTo) {
          searchParams.issueDateTo = new Date(searchParams.dateTo as string);
        }
        
        const result = await this.service.searchInvoices(companyId, searchParams);
        return ApiResponse.success(res, result);
      }
      
      // If no query parameters, use the original method
      const invoices = await this.service.getInvoicesByUserId(userId, companyId);
      return ApiResponse.success(res, invoices);
    } catch (error) {
      next(error);
      return undefined;
    }
  };

  /**
   * Get invoices by status
   */
  getInvoicesByStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { status } = req.params;
      const companyId = req.companyId as string;
      const invoices = await this.service.getInvoicesByStatus(status, companyId);
      return ApiResponse.success(res, invoices);
    } catch (error) {
      next(error);
      return undefined;
    }
  };

  /**
   * Create a new invoice
   */
  createInvoice = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.companyId as string;
      
      // Validate request body
      try {
        createInvoiceSchema.parse(req.body);
      } catch (error) {
        return ApiResponse.validationError(res, error);
      }

      const invoice = await this.service.createInvoice(req.body, companyId);
      return ApiResponse.success(res, invoice, 'Invoice created successfully', 201);
    } catch (error) {
      next(error);
      return undefined;
    }
  };

  /**
   * Update an invoice
   */
  updateInvoice = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const companyId = req.companyId as string;

      // Validate request body
      try {
        updateInvoiceSchema.parse(req.body);
      } catch (error) {
        return ApiResponse.validationError(res, error);
      }

      const invoice = await this.service.updateInvoice(id, req.body, companyId);
      return ApiResponse.success(res, invoice, 'Invoice updated successfully');
    } catch (error) {
      next(error);
      return undefined;
    }
  };

  /**
   * Finalize an invoice
   */
  finalizeInvoice = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const companyId = req.companyId as string;
      const invoice = await this.service.finalizeInvoice(id, companyId);
      return ApiResponse.success(res, invoice, 'Invoice finalized successfully');
    } catch (error) {
      next(error);
      return undefined;
    }
  };

  /**
   * Cancel an invoice
   */
  cancelInvoice = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const companyId = req.companyId as string;
      const invoice = await this.service.cancelInvoice(id, companyId);
      return ApiResponse.success(res, invoice, 'Invoice cancelled successfully');
    } catch (error) {
      next(error);
      return undefined;
    }
  };

  /**
   * Delete an invoice
   */
  deleteInvoice = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const companyId = req.companyId as string;
      await this.service.deleteInvoice(id, companyId);
      return ApiResponse.success(res, null, 'Invoice deleted successfully');
    } catch (error) {
      next(error);
      return undefined;
    }
  };

  /**
   * Search invoices with filters
   */
  searchInvoices = async (req: AuthRequest, res: Response, next: NextFunction) => {
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
      if (searchParams.issueDateFrom) {
        searchParams.issueDateFrom = new Date(searchParams.issueDateFrom as string);
      }
      
      if (searchParams.issueDateTo) {
        searchParams.issueDateTo = new Date(searchParams.issueDateTo as string);
      }

      if (searchParams.dueDateFrom) {
        searchParams.dueDateFrom = new Date(searchParams.dueDateFrom as string);
      }
      
      if (searchParams.dueDateTo) {
        searchParams.dueDateTo = new Date(searchParams.dueDateTo as string);
      }
      
      const result = await this.service.searchInvoices(companyId, searchParams);
      return ApiResponse.success(res, result);
    } catch (error) {
      next(error);
      return undefined;
    }
  };

  /**
   * Get invoice by package ID
   */
  getInvoiceByPackageId = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { packageId } = req.params;
      const companyId = req.companyId as string;
      
      if (!packageId) {
        return ApiResponse.badRequest(res, 'Package ID is required');
      }
      
      const invoice = await this.service.getInvoiceByPackageId(packageId, companyId);
      return ApiResponse.success(res, invoice);
    } catch (error) {
      next(error);
      return undefined;
    }
  };
} 