import { Request, Response, NextFunction } from 'express';
import { PackagesService, createPackageSchema, updatePackageSchema } from '../services/packages-service';
import { ApiResponse } from '../utils/response';

interface AuthRequest extends Request {
  companyId?: string;
}

export class PackagesController {
  private service: PackagesService;

  constructor() {
    this.service = new PackagesService();
  }

  /**
   * Get all packages for a company
   */
  getAllPackages = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.companyId as string;
      const packages = await this.service.getAllPackages(companyId);
      return ApiResponse.success(res, packages);
    } catch (error) {
      next(error);
      return undefined;
    }
  };

  /**
   * Get a package by ID
   */
  getPackageById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const companyId = req.companyId as string;
      const pkg = await this.service.getPackageById(id, companyId);
      return ApiResponse.success(res, pkg);
    } catch (error) {
      next(error);
      return undefined;
    }
  };

  /**
   * Get packages by user ID
   */
  getPackagesByUserId = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const companyId = req.companyId as string;
      
      // Create a new object for filters
      const filters: Record<string, any> = {};
      
      // Copy query parameters
      Object.assign(filters, req.query);
      
      // Convert numeric query parameters
      if (filters.page) {
        filters.page = Number(filters.page);
      }
      
      if (filters.limit) {
        filters.limit = Number(filters.limit);
      }
      
      // Convert date parameters if present
      if (filters.dateFrom) {
        filters.dateFrom = filters.dateFrom as string;
      }
      
      if (filters.dateTo) {
        filters.dateTo = filters.dateTo as string;
      }
      
      const packages = await this.service.getPackagesByUserId(userId, companyId, filters);
      return ApiResponse.success(res, packages);
    } catch (error) {
      next(error);
      return undefined;
    }
  };

  /**
   * Get packages by status
   */
  getPackagesByStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { status } = req.params;
      const companyId = req.companyId as string;
      const packages = await this.service.getPackagesByStatus(status, companyId);
      return ApiResponse.success(res, packages);
    } catch (error) {
      next(error);
      return undefined;
    }
  };

  /**
   * Create a new package
   */
  createPackage = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.companyId as string;
      
      // Validate request body
      try {
        createPackageSchema.parse(req.body);
      } catch (error) {
        return ApiResponse.validationError(res, error);
      }

      const pkg = await this.service.createPackage(req.body, companyId);
      return ApiResponse.success(res, pkg, 'Package created successfully', 201);
    } catch (error) {
      next(error);
      return undefined;
    }
  };

  /**
   * Update a package
   */
  updatePackage = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const companyId = req.companyId as string;

      // Validate request body
      try {
        updatePackageSchema.parse(req.body);
      } catch (error) {
        return ApiResponse.validationError(res, error);
      }

      const pkg = await this.service.updatePackage(id, req.body, companyId);
      return ApiResponse.success(res, pkg, 'Package updated successfully');
    } catch (error) {
      next(error);
      return undefined;
    }
  };

  /**
   * Delete a package
   */
  deletePackage = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const companyId = req.companyId as string;
      await this.service.deletePackage(id, companyId);
      return ApiResponse.success(res, null, 'Package deleted successfully');
    } catch (error) {
      next(error);
      return undefined;
    }
  };

  /**
   * Search packages with filters
   */
  searchPackages = async (req: AuthRequest, res: Response, next: NextFunction) => {
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
      if (searchParams.receivedDateFrom) {
        searchParams.receivedDateFrom = new Date(searchParams.receivedDateFrom as string);
      }
      
      if (searchParams.receivedDateTo) {
        searchParams.receivedDateTo = new Date(searchParams.receivedDateTo as string);
      }
      
      const result = await this.service.searchPackages(companyId, searchParams);
      return ApiResponse.success(res, result);
    } catch (error) {
      next(error);
      return undefined;
    }
  };

  /**
   * Get packages for a specific invoice
   */
  getPackagesByInvoiceId = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { invoiceId } = req.params;
      const companyId = req.companyId as string;
      const packages = await this.service.getPackagesByInvoiceId(invoiceId, companyId);
      return ApiResponse.success(res, packages);
    } catch (error) {
      next(error);
      return undefined;
    }
  };

  /**
   * SUPERADMIN: Get all packages for a specific company with filtering
   */
  getCompanyPackages = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id: companyId } = req.params;
      
      // Create a new object for filters
      const filters: Record<string, any> = {};
      
      // Copy query parameters
      Object.assign(filters, req.query);
      
      // Convert numeric query parameters
      if (filters.page) {
        filters.page = Number(filters.page);
      }
      
      if (filters.limit) {
        filters.limit = Number(filters.limit);
      }
      
      // Convert date parameters if present
      if (filters.dateFrom) {
        filters.dateFrom = filters.dateFrom as string;
      }
      
      if (filters.dateTo) {
        filters.dateTo = filters.dateTo as string;
      }
      
      // Add companyId to filters
      filters.companyId = companyId;
      
      const packages = await this.service.getPackagesForCompany(filters);
      return ApiResponse.success(res, packages);
    } catch (error) {
      next(error);
      return undefined;
    }
  };
} 