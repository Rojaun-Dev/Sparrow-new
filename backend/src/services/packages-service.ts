import { z } from 'zod';
import { PackagesRepository } from '../repositories/packages-repository';
import { PreAlertsRepository } from '../repositories/pre-alerts-repository';
import { UsersRepository } from '../repositories/users-repository';
import { AppError } from '../utils/app-error';
import { packageStatusEnum } from '../db/schema/packages';
import { generateTrackingId } from '../utils/tracking-generator';

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
  async getPackagesByUserId(userId: string, companyId: string) {
    // Verify user exists in this company
    const user = await this.usersRepository.findById(userId, companyId);
    if (!user) {
      throw AppError.notFound('User not found');
    }
    
    return this.packagesRepository.findByUserId(userId, companyId);
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
      validatedData.internalTrackingId = await generateTrackingId(companyId);
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
    
    // Match pre-alert to the package if needed
    if (preAlert && (preAlert.status === 'pending' || !preAlert.packageId)) {
      await this.preAlertsRepository.matchToPackage(
        preAlert.id,
        newPackage.id,
        companyId
      );
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
} 