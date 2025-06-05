import { Request, Response, NextFunction } from 'express';
import { PackagesService, createPackageSchema, updatePackageSchema } from '../services/packages-service';
import { ApiResponse } from '../utils/response';
import { format as csvFormat } from 'fast-csv';
import { PassThrough } from 'stream';
import { UsersService } from '../services/users-service';
import { EmailService } from '../services/email-service';
import { CompaniesService } from '../services/companies-service';

interface AuthRequest extends Request {
  companyId?: string;
}

export class PackagesController {
  private service: PackagesService;
  private usersService: UsersService;
  private emailService: EmailService;
  private companiesService: CompaniesService;

  constructor() {
    this.service = new PackagesService();
    this.usersService = new UsersService();
    this.emailService = new EmailService();
    this.companiesService = new CompaniesService();
  }

  /**
   * Get all packages for a company
   */
  getAllPackages = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.companyId as string;
      // Accept filters from query params
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const filters: Record<string, any> = {};
      if (req.query.status) filters.status = req.query.status;
      if (req.query.search) filters.search = req.query.search;
      if (req.query.dateFrom) filters.dateFrom = req.query.dateFrom;
      if (req.query.dateTo) filters.dateTo = req.query.dateTo;
      if (req.query.sortBy) filters.sortBy = req.query.sortBy;
      if (req.query.sortOrder) filters.sortOrder = req.query.sortOrder;
      const result = await this.service.getAllPackages(companyId, page, limit, filters);
      return ApiResponse.success(res, result);
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
      const { sendNotification = false, ...packageData } = req.body;
      
      // Validate request body
      try {
        createPackageSchema.parse(packageData);
      } catch (error) {
        return ApiResponse.validationError(res, error);
      }

      const pkg = await this.service.createPackage(packageData, companyId);

      // Send notification if requested
      if (sendNotification && pkg && pkg.userId) {
        try {
          // Get the user to get their email and notification preferences
          const user = await this.usersService.getUserById(pkg.userId, companyId);

          // Only send if the user has email notifications enabled
          if (user && 
              user.email && 
              user.notificationPreferences?.email && 
              user.notificationPreferences?.packageUpdates?.email) {
            
            // Get company name
            const company = await this.companiesService.getCompanyById(companyId);
            const companyName = company ? company.name : 'Cautious Robot';
            
            // Format data for the email
            await this.emailService.sendPackageAddedEmail(
              user.email,
              user.firstName,
              {
                trackingNumber: pkg.trackingNumber || '',
                status: pkg.status || '',
                description: pkg.description || '',
                weight: pkg.weight || 'N/A',
                dateAdded: new Date(pkg.createdAt).toLocaleDateString(),
                companyName,
                packageId: pkg.id
              }
            );
          }
        } catch (emailError) {
          console.error('Failed to send package notification:', emailError);
          // Don't fail the request if email sending fails
        }
      }

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
      
      const packages = await this.service.getPackagesForCompany({
        companyId,
        page: filters.page,
        limit: filters.limit,
        status: filters.status,
        search: filters.search,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      });
      return ApiResponse.success(res, packages);
    } catch (error) {
      next(error);
      return undefined;
    }
  };

  exportPackagesCsv = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.companyId as string;
      const filters: Record<string, any> = { ...req.query };
      const packages = await this.service.exportPackagesCsv(companyId, filters);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="packages.csv"');
      const csvStream = csvFormat({ headers: true });
      const passThrough = new PassThrough();
      csvStream.pipe(passThrough);
      packages.forEach(pkg => csvStream.write(pkg));
      csvStream.end();
      passThrough.pipe(res);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update package status only
   */
  updatePackageStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const companyId = req.companyId as string;
      const { status, sendNotification } = req.body;
      if (!status) {
        return ApiResponse.validationError(res, { message: 'Status is required' });
      }
      // Optionally: validate status value here
      const pkg = await this.service.updatePackage(id, { status }, companyId);
      // Optionally: handle sendNotification here
      return ApiResponse.success(res, pkg, 'Package status updated');
    } catch (error) {
      next(error);
      return undefined;
    }
  };

  /**
   * Match a pre-alert to a package
   */
  matchPreAlertToPackage = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.companyId as string;
      const { packageId } = req.params;
      const { preAlertId, sendNotification = false } = req.body;
      
      if (!preAlertId) {
        return ApiResponse.validationError(res, { message: 'preAlertId is required' });
      }
      
      const result = await this.service.matchPreAlertToPackage(preAlertId, packageId, companyId);
      
      // Send notification if requested
      if (sendNotification && result.package && result.preAlert) {
        try {
          // Get the user to get their email and notification preferences
          const user = await this.usersService.getUserById(result.package.userId, companyId);
          
          // Only send if the user has email notifications enabled
          if (user && 
              user.email && 
              user.notificationPreferences?.email && 
              user.notificationPreferences?.packageUpdates?.email) {
            
            // Get company name
            const company = await this.companiesService.getCompanyById(companyId);
            const companyName = company ? company.name : 'Cautious Robot';
            
            // Format data for the email
            await this.emailService.sendPreAlertMatchedEmail(
              user.email,
              user.firstName,
              {
                preAlertTrackingNumber: result.preAlert.trackingNumber,
                packageTrackingNumber: result.package.trackingNumber,
                courier: result.preAlert.courier || '',
                description: result.package.description || result.preAlert.description || '',
                status: result.package.status,
                receivedDate: result.package.receivedDate ? 
                  new Date(result.package.receivedDate).toLocaleDateString() : 
                  new Date().toLocaleDateString(),
                companyName,
                packageId: result.package.id
              }
            );
          }
        } catch (emailError) {
          console.error('Failed to send pre-alert match notification:', emailError);
          // Don't fail the request if email sending fails
        }
      }
      
      return ApiResponse.success(res, result, 'Pre-alert matched to package');
    } catch (error) {
      next(error);
      return undefined;
    }
  };

  /**
   * Get unbilled packages for a user (not already on an invoice)
   */
  getUnbilledPackagesByUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const companyId = req.companyId as string;
      const packages = await this.service.getUnbilledPackagesByUser(userId, companyId);
      return res.json({ success: true, data: packages });
    } catch (error) {
      next(error);
    }
  };
} 