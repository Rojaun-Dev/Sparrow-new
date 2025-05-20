import { z } from 'zod';
import { PackagesRepository } from '../repositories/packages-repository';
import { PreAlertsRepository } from '../repositories/pre-alerts-repository';
import { UsersRepository } from '../repositories/users-repository';
import { AppError } from '../utils/app-error';
import { packageStatusEnum, packages } from '../db/schema/packages';
import { randomUUID } from 'crypto';
import { SQL, eq, and, gte, lte, or, ilike, desc, asc, sql } from 'drizzle-orm';

// Validation schema for package creation
export const createPackageSchema = z.object({
  userId: z.string().uuid(),
  trackingNumber: z.string().min(3).max(100),
  internalTrackingId: z.string().optional(), // Auto-generated if not provided
  status: z.enum(packageStatusEnum.enumValues).default('received'),
  description: z.string().optional(),
  weight: z.number().positive().optional(),
  dimensions: z
    .object({
      length: z.number().positive().optional(),
      width: z.number().positive().optional(),
      height: z.number().positive().optional(),
    })
    .optional(),
  declaredValue: z.number().nonnegative().optional(),
  senderInfo: z.record(z.string()).optional(),
  receivedDate: z.coerce.date().optional(),
  processingDate: z.coerce.date().optional(),
  photos: z.array(z.string()).optional(),
  notes: z.string().optional(),
  // Pre-alert ID for linking a package to an existing pre-alert
  preAlertId: z.string().uuid().optional(),
});

// Validation schema for package update
export const updatePackageSchema = createPackageSchema
  .partial()
  .omit({ internalTrackingId: true }); // Don't allow updating internal tracking ID

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
   * Get all packages for a company
   */
  async getAllPackages(companyId: string) {
    return this.packagesRepository.findAll(companyId);
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
   * Create a new package with company isolation
   */
  async createPackage(data: z.infer<typeof createPackageSchema>, companyId: string) {
    // Validate data
    const validatedData = createPackageSchema.parse(data);
    
    // Check if user exists in this company
    const user = await this.usersRepository.findById(validatedData.userId, companyId);
    if (!user) {
      throw AppError.notFound('User not found');
    }
    
    // Generate internal tracking ID if not provided
    if (!validatedData.internalTrackingId) {
      validatedData.internalTrackingId = await this.generateTrackingId();
    } else {
      // Check if internal tracking ID is unique
      const existingPackage = await this.packagesRepository.findByInternalTrackingId(
        validatedData.internalTrackingId,
        companyId
      );
      
      if (existingPackage) {
        throw AppError.conflict('Internal tracking ID is already in use');
      }
    }
    
    // Set received date to now if not provided and status is 'received'
    if (validatedData.status === 'received' && !validatedData.receivedDate) {
      validatedData.receivedDate = new Date();
    }
    
    // Link to pre-alert if ID provided
    let preAlert = null;
    if (validatedData.preAlertId) {
      preAlert = await this.preAlertsRepository.findById(validatedData.preAlertId, companyId);
      
      if (!preAlert) {
        throw AppError.notFound('Pre-alert not found');
      }
      
      // We'll match the pre-alert to this package after creation
    } else {
      // Look for matching pre-alert by tracking number
      preAlert = await this.preAlertsRepository.findByTrackingNumber(
        validatedData.trackingNumber,
        companyId
      );
      
      // If a matching pre-alert is found and it's not already matched, match it
      if (preAlert && preAlert.status === 'pending' && !preAlert.packageId) {
        // We'll match it after creating the package
      }
    }
    
    // Create the package
    const newPackage = await this.packagesRepository.create(
      // Remove preAlertId as it's not part of the package schema
      Object.fromEntries(
        Object.entries(validatedData).filter(([key]) => key !== 'preAlertId')
      ),
      companyId
    );
    
    // Update pre-alert status if package was created successfully
    if (newPackage) {
      // Link the pre-alert to this package
      if (preAlert) {
        await this.preAlertsRepository.matchToPackage(
          preAlert.id,
          newPackage.id,
          companyId
        );
      }
      
      // If new data is provided for dimensions or sender, update the package
      if (data.dimensions || data.senderInfo) {
        await this.updatePackage(
          newPackage.id,
          {
            dimensions: data.dimensions,
            senderInfo: data.senderInfo,
          },
          companyId
        );
      }
    }
    
    return newPackage;
  }

  /**
   * Update a package with company isolation
   */
  async updatePackage(id: string, data: z.infer<typeof updatePackageSchema>, companyId: string) {
    // Validate data
    const validatedData = updatePackageSchema.parse(data);
    
    // Check if package exists
    const pkg = await this.packagesRepository.findById(id, companyId);
    if (!pkg) {
      throw AppError.notFound('Package not found');
    }
    
    // If changing user, verify the new user exists
    if (validatedData.userId && validatedData.userId !== pkg.userId) {
      const user = await this.usersRepository.findById(validatedData.userId, companyId);
      if (!user) {
        throw AppError.notFound('User not found');
      }
    }
    
    // If changing status to 'processed', set processingDate to now if not provided
    if (validatedData.status === 'processed' && !validatedData.processingDate && pkg.status !== 'processed') {
      validatedData.processingDate = new Date();
    }
    
    // If changing status to 'received', set receivedDate to now if not provided
    if (validatedData.status === 'received' && !validatedData.receivedDate && pkg.status !== 'received') {
      validatedData.receivedDate = new Date();
    }
    
    return this.packagesRepository.update(id, validatedData, companyId);
  }

  /**
   * Delete a package with company isolation (hard delete)
   */
  async deletePackage(id: string, companyId: string) {
    // Check if package exists
    const pkg = await this.packagesRepository.findById(id, companyId);
    if (!pkg) {
      throw AppError.notFound('Package not found');
    }
    
    return this.packagesRepository.delete(id, companyId);
  }

  /**
   * Search packages with various filters
   */
  async searchPackages(
    companyId: string,
    searchParams: {
      trackingNumber?: string;
      internalTrackingId?: string;
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
    return this.packagesRepository.search(companyId, searchParams);
  }

  /**
   * Generate a unique tracking ID
   */
  private generateTrackingId(): string {
    // Create a unique identifier for the package
    const prefix = 'SPX';
    const randomDigits = Math.floor(10000 + Math.random() * 90000); // 5-digit random number
    const suffix = randomUUID().substring(0, 4).toUpperCase();
    
    return `${prefix}${randomDigits}${suffix}`;
  }

  /**
   * Create a package with pre-alert data
   */
  async createPackageFromPreAlert(preAlertId: string, companyId: string, data: any) {
    // Get the pre-alert
    const preAlert = await this.preAlertsRepository.findById(preAlertId, companyId);
    
    if (!preAlert) {
      throw new Error("Pre-alert not found");
    }
    
    // Now TypeScript knows preAlert is not null, but we'll make a local copy to be sure
    const preAlertData = preAlert;
    
    // Create a new package using pre-alert data and additional data
    const newPackage = await this.packagesRepository.create({
      userId: preAlertData.userId,
      companyId: companyId,
      trackingNumber: preAlertData.trackingNumber,
      internalTrackingId: this.generateTrackingId(),
      status: 'received',
      description: data.description || preAlertData.description,
      weight: data.weight || preAlertData.estimatedWeight,
      dimensions: data.dimensions || null,
      declaredValue: data.declaredValue || '0',
      receivedDate: new Date().toISOString(),
      photos: data.photos || [],
      notes: data.notes || `Created from pre-alert ${preAlertData.trackingNumber}`,
    }, companyId);
    
    // Update pre-alert status if package was created successfully
    if (newPackage) {
      // Double-check that preAlert is not null for TypeScript
      if (preAlertData) {
        // Link the pre-alert to this package
        await this.preAlertsRepository.matchToPackage(
          preAlertData.id,
          newPackage.id,
          companyId
        );
      }
      
      // If new data is provided for dimensions or sender, update the package
      if (data.dimensions || data.senderInfo) {
        await this.updatePackage(
          newPackage.id,
          {
            dimensions: data.dimensions,
            senderInfo: data.senderInfo,
          },
          companyId
        );
      }
    }
    
    return newPackage;
  }

  /**
   * Match a pre-alert to a package
   */
  async matchPreAlertToPackage(preAlertId: string, packageId: string, companyId: string) {
    // Get both the pre-alert and package to make sure they exist
    const preAlert = await this.preAlertsRepository.findById(preAlertId, companyId);
    
    if (!preAlert) {
      throw new Error("Pre-alert not found");
    }
    
    // Check if the pre-alert is already matched to a package
    if (preAlert.packageId) {
      throw new Error("Pre-alert is already matched to a package");
    }
    
    const pkg = await this.packagesRepository.findById(packageId, companyId);
    
    if (!pkg) {
      throw new Error("Package not found");
    }
    
    // TypeScript is not tracking the null check above, so we need to check again
    if (preAlert) {
      // Update the pre-alert with the package ID
      await this.preAlertsRepository.matchToPackage(
        preAlert.id,
        pkg.id,
        companyId
      );
    }
    
    return {
      message: "Pre-alert matched to package successfully",
      preAlert,
      package: pkg
    };
  }

  /**
   * Get packages by invoice ID with company isolation
   */
  async getPackagesByInvoiceId(invoiceId: string, companyId: string) {
    return this.packagesRepository.findByInvoiceId(invoiceId, companyId);
  }
  
  /**
   * Get packages for a specific company with filtering and pagination (for superadmin)
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
    const db = this.packagesRepository.getDatabaseInstance();
    
    // Set up pagination parameters
    const page = params.page || 1;
    const limit = params.limit || 10;
    const offset = (page - 1) * limit;
    
    // Set up sorting
    const orderBy: SQL[] = [];
    if (params.sortBy) {
      const direction = params.sortOrder === 'desc' ? desc : asc;
      
      // Match the sort parameter to a valid column
      switch(params.sortBy) {
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
          orderBy.push(desc(packages.createdAt)); // Default sort
      }
    } else {
      orderBy.push(desc(packages.createdAt)); // Default sort if none specified
    }
    
    // Build the filter conditions
    let conditions = eq(packages.companyId, params.companyId);
    
    // Add status filter if provided
    if (params.status) {
      conditions = and(conditions, eq(packages.status, params.status));
    }
    
    // Add date range filters if provided
    if (params.dateFrom) {
      const fromDate = new Date(params.dateFrom);
      conditions = and(conditions, gte(packages.createdAt, fromDate));
    }
    
    if (params.dateTo) {
      const toDate = new Date(params.dateTo);
      // Set to end of day
      toDate.setHours(23, 59, 59, 999);
      conditions = and(conditions, lte(packages.createdAt, toDate));
    }
    
    // Add search filter if provided
    if (params.search) {
      const searchTerm = `%${params.search}%`;
      conditions = and(
        conditions,
        or(
          ilike(packages.trackingNumber, searchTerm),
          ilike(packages.internalTrackingId, searchTerm),
          ilike(packages.description, searchTerm)
        )
      );
    }
    
    // Get total count for pagination
    const [{ count: totalItems }] = await db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(packages)
      .where(conditions);
      
    // Calculate total pages
    const totalPages = Math.ceil(totalItems / limit);
    
    // Get the data with pagination
    const data = await db
      .select({
        id: packages.id,
        userId: packages.userId,
        trackingNumber: packages.trackingNumber,
        internalTrackingId: packages.internalTrackingId,
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
      .where(conditions)
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
} 