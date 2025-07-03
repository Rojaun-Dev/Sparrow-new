import { z } from 'zod';
import { PackagesRepository } from '../repositories/packages-repository';
import { PreAlertsRepository } from '../repositories/pre-alerts-repository';
import { UsersRepository } from '../repositories/users-repository';
import { AppError } from '../utils/app-error';
import { packageStatusEnum, packages } from '../db/schema/packages';
import { SQL, eq, and, gte, lte, or, ilike, desc, asc, sql } from 'drizzle-orm';
import { createPackageSchema, updatePackageSchema } from '../validation/package-schemas';

// Define the shape of package metadata for type safety
export interface PackageMetadata {
  length?: number;
  width?: number;
  height?: number;
}

export const allPackageStatuses = [
  'in_transit',
  'pre_alert',
  'received',
  'processed',
  'ready_for_pickup',
  'delivered',
  'returned',
] as const;

export type PackageStatus = typeof allPackageStatuses[number];

// Update schema that doesn't allow prefId updates
export const updatePackageSchemaWithoutPrefId = updatePackageSchema.extend({
  // Define prefId as optional but always undefined to prevent updates
  prefId: z.undefined().optional(),
});

export class PackagesService {
  private packagesRepository: PackagesRepository;
  private preAlertsRepository: PreAlertsRepository;
  private usersRepository: UsersRepository;

  constructor() {
    this.packagesRepository = new PackagesRepository();
    this.preAlertsRepository = new PreAlertsRepository();
    this.usersRepository = new UsersRepository();
  }

  /**
   * Get all packages for a company (paginated, with filtering)
   */
  async getAllPackages(companyId: string, page = 1, limit = 10, filters: any = {}) {
    // Accept filters: status, search, dateFrom, dateTo, sortBy, sortOrder
    const db = this.packagesRepository.getDatabaseInstance();
    const offset = (page - 1) * limit;

    // Set up sorting
    const orderBy: SQL[] = [];
    if (filters.sortBy) {
      const direction = filters.sortOrder === 'desc' ? desc : asc;
      switch(filters.sortBy) {
        case 'trackingNumber':
          orderBy.push(direction(packages.trackingNumber));
          break;
        case 'status':
          orderBy.push(direction(packages.status));
          break;
        case 'receivedDate':
          orderBy.push(direction(packages.receivedDate));
          break;
        case 'createdAt':
          orderBy.push(direction(packages.createdAt));
          break;
        default:
          orderBy.push(desc(packages.createdAt));
      }
    } else {
      orderBy.push(desc(packages.createdAt));
    }

    // Build filter conditions
    const conditions: SQL<unknown>[] = [eq(packages.companyId, companyId)];
    if (filters.status) {
      conditions.push(eq(packages.status, filters.status as any));
    }
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      conditions.push(gte(packages.createdAt, fromDate));
    }
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      conditions.push(lte(packages.createdAt, toDate));
    }
    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      const searchConditions: SQL<unknown>[] = [
        ilike(packages.trackingNumber, searchTerm),
        ilike(packages.description, searchTerm)
      ];
      if (searchConditions.length > 0) {
        conditions.push(or(...searchConditions) as SQL<unknown>);
      }
    }
    const finalConditions = and(...conditions);

    // Get total count for pagination
    const [{ count: totalItems }] = await db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(packages)
      .where(finalConditions);
    const totalPages = Math.ceil(totalItems / limit);

    // Get the data with pagination
    const data = await db
      .select({
        id: packages.id,
        userId: packages.userId,
        trackingNumber: packages.trackingNumber,
        status: packages.status,
        description: packages.description,
        weight: packages.weight,
        dimensions: packages.dimensions,
        receivedDate: packages.receivedDate,
        processingDate: packages.processingDate,
        createdAt: packages.createdAt,
        updatedAt: packages.updatedAt,
      })
      .from(packages)
      .where(finalConditions)
      .orderBy(...orderBy)
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
   * Get a package by ID with company isolation
   */
  async getPackageById(id: string, companyId: string) {
    const pkg = await this.packagesRepository.findById(id, companyId);
    if (!pkg) {
      throw AppError.notFound('Package not found');
    }
    return pkg;
  }

  /**
   * Get packages by user ID with company isolation
   */
  async getPackagesByUserId(
    userId: string, 
    companyId: string,
    filters: {
      search?: string;
      status?: string;
      dateFrom?: string;
      dateTo?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      limit?: number;
      page?: number;
    } = {}
  ) {
    // Verify user exists in this company
    const user = await this.usersRepository.findById(userId, companyId);
    if (!user) {
      throw AppError.notFound('User not found');
    }
    
    return this.packagesRepository.findByUserId(userId, companyId, filters);
  }

  /**
   * Get packages by status with company isolation
   */
  async getPackagesByStatus(status: string, companyId: string) {
    // Validate status
    if (!Object.values(packageStatusEnum.enumValues).includes(status as any)) {
      throw AppError.badRequest('Invalid package status');
    }
    
    return this.packagesRepository.findByStatus(status, companyId);
  }

  /**
   * Get prefId from user
   */
  private async getUserPrefId(userId: string | undefined, companyId: string): Promise<string | null> {
    // If no userId is provided, return null
    if (!userId) {
      return null;
    }
    
    // Get user information to access the prefId
    const user = await this.usersRepository.findById(userId, companyId);
    
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    return user.prefId || null;
  }

  /**
   * Create a new package with company isolation
   */
  async createPackage(data: z.infer<typeof createPackageSchema>, companyId: string) {
    try {
      // Debug logging for companyId
      console.log('PackagesService.createPackage debug:', {
        receivedCompanyId: companyId,
        type: typeof companyId,
        hasCompanyId: !!companyId
      });
      
      // Validate data
      const validatedData = createPackageSchema.parse(data);
      
      // Prepare package data with company ID
      const packageData: any = {
        ...validatedData,
        companyId, // Ensure companyId is explicitly set here
        // Set default status to "received" if not specified
        status: validatedData.status || 'received',
      };
      
      // Debug logging for final package data
      console.log('Package data being sent to repository:', {
        hasCompanyId: !!packageData.companyId,
        companyIdValue: packageData.companyId
      });
      
      // If userId is provided, check it and get prefId
      if (validatedData.userId) {
        // Check if user exists in this company
        const user = await this.usersRepository.findById(validatedData.userId, companyId);
        if (!user) {
          throw AppError.notFound('User not found');
        }
        
        // Get prefId if available
        const prefId = await this.getUserPrefId(validatedData.userId, companyId);
        if (prefId) {
          packageData.prefId = prefId;
        }
      }
      
      // Create the package
      return this.packagesRepository.create(packageData, companyId);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw AppError.badRequest('Invalid package data: ' + error.errors.map(e => e.message).join(', '));
      }
      throw error;
    }
  }

  /**
   * Update a package with company isolation
   */
  async updatePackage(id: string, data: z.infer<typeof updatePackageSchema>, companyId: string) {
    // Get the current package
    const existingPackage = await this.packagesRepository.findById(id, companyId);
    if (!existingPackage) {
      throw AppError.notFound('Package not found');
    }
    
    // Parse and validate the data without allowing prefId updates
    const validatedData = updatePackageSchemaWithoutPrefId.parse(data);
    
    // Handle userId validation if present
    if (validatedData.userId) {
      const user = await this.usersRepository.findById(validatedData.userId, companyId);
      if (!user) {
        throw AppError.badRequest('Invalid user ID');
      }
    }
    
    // Update the package
    return this.packagesRepository.update(id, validatedData, companyId);
  }

  /**
   * Delete a package with company isolation
   */
  async deletePackage(id: string, companyId: string) {
    // Check if package exists and belongs to this company
    const existingPackage = await this.packagesRepository.findById(id, companyId);
    if (!existingPackage) {
      throw AppError.notFound('Package not found');
    }
    
    console.log(`Deleting package ${id} from company ${companyId}`);
    return this.packagesRepository.delete(id, companyId);
  }

  /**
   * Advanced search for packages
   */
  async searchPackages(
    companyId: string,
    searchParams: {
      trackingNumber?: string;
      userId?: string;
      status?: string;
      receivedDateFrom?: Date;
      receivedDateTo?: Date;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      page?: number;
      pageSize?: number;
    }
  ) {
    return this.packagesRepository.searchPackages(companyId, searchParams);
  }

  /**
   * Create a package from pre-alert
   */
  async createPackageFromPreAlert(preAlertId: string, companyId: string, data: any) {
    // Verify pre-alert exists and belongs to this company
    const preAlert = await this.preAlertsRepository.findById(preAlertId, companyId);
    if (!preAlert) {
      throw AppError.notFound('Pre-alert not found');
    }
    
    // Get user information
    const user = await this.usersRepository.findById(preAlert.userId, companyId);
    if (!user) {
      throw AppError.notFound('User not found');
    }
    
    // Get prefId
    const prefId = await this.getUserPrefId(preAlert.userId, companyId);
    
    // Prepare package data
    const packageData = {
      ...data,
      companyId,
      userId: preAlert.userId,
      prefId,
      // Set default values from pre-alert if not provided
      trackingNumber: data.trackingNumber || preAlert.trackingNumber,
      description: data.description || preAlert.description,
      weight: data.weight || preAlert.weight,
      dimensions: data.dimensions || preAlert.dimensions,
    };
    
    // Create the package
    const createdPackage = await this.packagesRepository.create(packageData, companyId);
    
    // Mark the pre-alert as processed
    await this.preAlertsRepository.update(preAlertId, { status: 'matched' }, companyId);
    
    return createdPackage;
  }

  /**
   * Match existing package to pre-alert
   */
  async matchPreAlertToPackage(preAlertId: string, packageId: string, companyId: string) {
    // Verify both entities exist and belong to this company
    const preAlert = await this.preAlertsRepository.findById(preAlertId, companyId);
    if (!preAlert) {
      throw AppError.notFound('Pre-alert not found');
    }
    
    const existingPackage = await this.packagesRepository.findById(packageId, companyId);
    if (!existingPackage) {
      throw AppError.notFound('Package not found');
    }
    
    // Update ONLY the pre-alert to link it to the package
    const updatedPreAlert = await this.preAlertsRepository.matchToPackage(preAlertId, packageId, companyId);
    
    // Update package status to pre_alert if it's in received or in_transit state
    if (existingPackage.status === 'received' || existingPackage.status === 'in_transit') {
      await this.packagesRepository.update(packageId, { 
        status: 'pre_alert'
      }, companyId);
      
      // Refresh the package data
      const updatedPackage = await this.packagesRepository.findById(packageId, companyId);
      return {
        package: updatedPackage,
        preAlert: updatedPreAlert
      };
    }
    
    return {
      package: existingPackage,
      preAlert: updatedPreAlert
    };
  }

  /**
   * Get packages by invoice ID
   */
  async getPackagesByInvoiceId(invoiceId: string, companyId: string) {
    return this.packagesRepository.findByInvoiceId(invoiceId, companyId);
  }

  /**
   * Get packages for a company with various filters
   */
  async getPackagesForCompany(params: {
    companyId: string;
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const { 
      companyId,
      page = 1, 
      limit = 10,
      status,
      search,
      dateFrom,
      dateTo,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = params;
    
    // Build search parameters
    const searchParams: any = {
      page,
      limit,
      sortBy,
      sortOrder
    };
    
    if (status) {
      searchParams.status = status;
    }
    
    if (search) {
      searchParams.search = search;
    }
    
    if (dateFrom) {
      searchParams.fromDate = dateFrom;
    }
    
    if (dateTo) {
      searchParams.toDate = dateTo;
    }
    
    // Fetch packages with pagination
    const result = await this.packagesRepository.findByCompanyId(
      companyId,
      searchParams
    );
    
    // Enhance the data with user information
    const enhancedData = await Promise.all(
      result.data.map(async (pkg) => {
        try {
          // Add null check for userId
          if (pkg.userId) {
            const user = await this.usersRepository.findById(pkg.userId, companyId);
            return {
              ...pkg,
              user: user ? {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                prefId: user.prefId
              } : null
            };
          } else {
            return {
              ...pkg,
              user: null
            };
          }
        } catch (error) {
          console.error(`Error fetching user for package ${pkg.id}:`, error);
          return {
            ...pkg,
            user: null
          };
        }
      })
    );
    
    return {
      data: enhancedData,
      pagination: result.pagination
    };
  }

  /**
   * Export packages to CSV format
   */
  async exportPackagesCsv(companyId: string, filters: any = {}) {
    // Get all packages for export (no pagination)
    filters.limit = 1000; // Set a reasonable limit
    const result = await this.getPackagesForCompany({
      companyId,
      ...filters
    });
    
    // Transform data for CSV export
    return result.data.map(pkg => ({
      ID: pkg.id,
      'Tracking Number': pkg.trackingNumber,
      Status: pkg.status,
      Description: pkg.description || '',
      Weight: pkg.weight || '',
      'Customer Name': pkg.user ? `${pkg.user.firstName} ${pkg.user.lastName}` : '',
      'Customer Email': pkg.user?.email || '',
      'Received Date': pkg.receivedDate ? new Date(pkg.receivedDate).toLocaleDateString() : '',
      'Created At': new Date(pkg.createdAt).toLocaleDateString()
    }));
  }

  /**
   * Get unbilled packages for a user
   */
  async getUnbilledPackagesByUser(userId: string, companyId: string) {
    return this.packagesRepository.findUnbilledByUserId(userId, companyId);
  }

  /**
   * Assign a user to a package
   */
  async assignUserToPackage(packageId: string, userId: string, companyId: string) {
    // Verify package exists and belongs to this company
    const pkg = await this.packagesRepository.findById(packageId, companyId);
    if (!pkg) {
      throw AppError.notFound('Package not found');
    }
    
    // Verify user exists and belongs to this company
    const user = await this.usersRepository.findById(userId, companyId);
    if (!user) {
      throw AppError.notFound('User not found');
    }
    
    // Get user's prefId if available
    const prefId = await this.getUserPrefId(userId, companyId);
    
    // Update the package with the new userId and prefId
    return this.packagesRepository.update(packageId, { 
      userId, 
      prefId: prefId || pkg.prefId 
    }, companyId);
  }

  /**
   * Get unassigned packages
   */
  async getUnassignedPackages(companyId: string, page = 1, limit = 10, filters: any = {}) {
    const offset = (page - 1) * limit;
    const db = this.packagesRepository.getDatabaseInstance();
    
    // Build where clause with initial condition that won't be undefined
    const conditions: SQL<unknown>[] = [
      eq(packages.companyId, companyId),
      sql`${packages.userId} IS NULL`
    ];
    
    // Apply filters if provided
    if (filters.status) {
      conditions.push(eq(packages.status, filters.status));
    }
    
    if (filters.search) {
      conditions.push(ilike(packages.trackingNumber, `%${filters.search}%`));
    }
    
    if (filters.dateFrom) {
      const dateFrom = new Date(filters.dateFrom);
      conditions.push(gte(packages.receivedDate, dateFrom));
    }
    
    if (filters.dateTo) {
      const dateTo = new Date(filters.dateTo);
      conditions.push(lte(packages.receivedDate, dateTo));
    }

    // Combine all conditions with AND
    const whereClause = and(...conditions);
    
    // Determine sort order
    let orderBy: SQL<unknown> = desc(packages.createdAt); // default sort
    if (filters.sortBy) {
      const direction = filters.sortOrder === 'asc' ? asc : desc;
      switch (filters.sortBy) {
        case 'trackingNumber':
          orderBy = direction(packages.trackingNumber);
          break;
        case 'status':
          orderBy = direction(packages.status);
          break;
        case 'receivedDate':
          orderBy = direction(packages.receivedDate);
          break;
        case 'createdAt':
          orderBy = direction(packages.createdAt);
          break;
        default:
          orderBy = desc(packages.createdAt);
      }
    }
    
    // Get total count for pagination
    const [{ count: totalCount }] = await db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(packages)
      .where(whereClause);
    
    // Get paginated results
    const results = await db
      .select()
      .from(packages)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);
    
    // Return paginated response
    return {
      data: results,
      pagination: {
        page,
        pageSize: limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  }

  /**
   * Update package status to ready_for_pickup after payment
   * This method is called from the payments service when a payment is completed
   */
  async updatePackageStatusAfterPayment(invoiceId: string, companyId: string) {
    // Get all packages associated with this invoice
    const packages = await this.getPackagesByInvoiceId(invoiceId, companyId);
    
    if (!packages || packages.length === 0) {
      console.log(`No packages found for invoice ${invoiceId}`);
      return;
    }
    
    // Update each package status to ready_for_pickup
    const updatePromises = packages.map(pkg => {
      // Access the package id directly from the joined result
      const packageId = pkg.packages?.id;
      if (packageId) {
        return this.packagesRepository.update(packageId, { 
          status: 'ready_for_pickup'
        }, companyId);
      }
      return Promise.resolve(null);
    }).filter(promise => promise !== null);
    
    // Wait for all updates to complete
    const results = await Promise.all(updatePromises);
    console.log(`Updated ${results.length} packages to ready_for_pickup status for invoice ${invoiceId}`);
    
    return results;
  }
} 