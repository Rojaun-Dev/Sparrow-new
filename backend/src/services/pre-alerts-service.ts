import { z } from 'zod';
import { PreAlertsRepository } from '../repositories/pre-alerts-repository';
import { UsersRepository } from '../repositories/users-repository';
import { AppError } from '../utils/app-error';
import { preAlerts, preAlertStatusEnum } from '../db/schema/pre-alerts';
import { SQL, eq, sql, and, desc } from 'drizzle-orm';

// Validation schema for pre-alert creation
export const createPreAlertSchema = z.object({
  userId: z.string().uuid(),
  trackingNumber: z.string().min(3).max(100),
  courier: z.string().min(2).max(50),
  description: z.string().optional(),
  estimatedWeight: z.number().positive().optional(),
  estimatedArrival: z.coerce.date().optional(),
  status: z.enum(preAlertStatusEnum.enumValues).default('pending'),
  documents: z.array(z.string()).optional(),
});

// Validation schema for pre-alert update
export const updatePreAlertSchema = createPreAlertSchema.partial();

export class PreAlertsService {
  private preAlertsRepository: PreAlertsRepository;
  private usersRepository: UsersRepository;

  constructor() {
    this.preAlertsRepository = new PreAlertsRepository();
    this.usersRepository = new UsersRepository();
  }

  /**
   * Get all pre-alerts for a company
   */
  async getAllPreAlerts(companyId: string, page = 1, limit = 10, filters: any = {}) {
    // If searching by tracking number, use the repository's search method for LIKE queries
    if (filters.trackingNumber) {
      return this.preAlertsRepository.search(companyId, {
        trackingNumber: filters.trackingNumber,
        status: filters.status,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        page,
        pageSize: limit,
      });
    }
    const db = this.preAlertsRepository.getDatabaseInstance();
    const offset = (page - 1) * limit;

    // Build filter conditions (add more as needed)
    const conditions: SQL<unknown>[] = [eq(preAlerts.companyId, companyId)];
    if (filters.status) {
      conditions.push(eq(preAlerts.status, filters.status));
    }
    // Add more filters here as needed
    const finalConditions = and(...conditions);

    // Get total count for pagination
    const [{ count: totalItems }] = await db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(preAlerts)
      .where(finalConditions);
    const totalPages = Math.ceil(totalItems / limit);

    // Get the data with pagination
    const data = await db
      .select({
        id: preAlerts.id,
        userId: preAlerts.userId,
        trackingNumber: preAlerts.trackingNumber,
        courier: preAlerts.courier,
        status: preAlerts.status,
        estimatedArrival: preAlerts.estimatedArrival,
        // ...other fields
      })
      .from(preAlerts)
      .where(finalConditions)
      .orderBy(desc(preAlerts.createdAt))
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
   * Get a pre-alert by ID with company isolation
   */
  async getPreAlertById(id: string, companyId: string) {
    const preAlert = await this.preAlertsRepository.findById(id, companyId);
    
    if (!preAlert) {
      throw AppError.notFound('Pre-alert not found');
    }
    
    return preAlert;
  }

  /**
   * Get pre-alerts by user ID with company isolation
   */
  async getPreAlertsByUserId(userId: string, companyId: string) {
    // Verify user exists in this company
    const user = await this.usersRepository.findById(userId, companyId);
    if (!user) {
      throw AppError.notFound('User not found');
    }
    
    return this.preAlertsRepository.findByUserId(userId, companyId);
  }

  /**
   * Get pre-alerts by status with company isolation
   */
  async getPreAlertsByStatus(status: string, companyId: string) {
    // Validate status
    if (!Object.values(preAlertStatusEnum.enumValues).includes(status as any)) {
      throw AppError.badRequest('Invalid pre-alert status');
    }
    
    return this.preAlertsRepository.findByStatus(status, companyId);
  }

  /**
   * Get unmatched pre-alerts (pending status, no package ID)
   */
  async getUnmatchedPreAlerts(companyId: string) {
    return this.preAlertsRepository.findUnmatched(companyId);
  }

  /**
   * Create a new pre-alert with company isolation
   */
  async createPreAlert(data: z.infer<typeof createPreAlertSchema>, companyId: string) {
    // Validate data
    const validatedData = createPreAlertSchema.parse(data);
    
    // Check if user exists in this company
    const user = await this.usersRepository.findById(validatedData.userId, companyId);
    if (!user) {
      throw AppError.notFound('User not found');
    }
    
    // Set estimated arrival to 7 days from now if not provided
    if (!validatedData.estimatedArrival) {
      const estimatedArrival = new Date();
      estimatedArrival.setDate(estimatedArrival.getDate() + 7);
      validatedData.estimatedArrival = estimatedArrival;
    }
    
    return this.preAlertsRepository.create(validatedData, companyId);
  }

  /**
   * Update a pre-alert with company isolation
   */
  async updatePreAlert(id: string, data: z.infer<typeof updatePreAlertSchema>, companyId: string) {
    // Validate data
    const validatedData = updatePreAlertSchema.parse(data);
    
    // Check if pre-alert exists
    const preAlert = await this.preAlertsRepository.findById(id, companyId);
    if (!preAlert) {
      throw AppError.notFound('Pre-alert not found');
    }
    
    // If changing user, verify the new user exists
    if (validatedData.userId && validatedData.userId !== preAlert.userId) {
      const user = await this.usersRepository.findById(validatedData.userId, companyId);
      if (!user) {
        throw AppError.notFound('User not found');
      }
    }
    
    // Don't allow status updates for pre-alerts that are already matched to packages
    if (validatedData.status && preAlert.status === 'matched' && validatedData.status !== 'matched') {
      throw AppError.badRequest('Cannot change status of pre-alerts that are already matched to packages');
    }
    
    return this.preAlertsRepository.update(id, validatedData, companyId);
  }

  /**
   * Cancel a pre-alert with company isolation (update status to 'cancelled')
   */
  async cancelPreAlert(id: string, companyId: string) {
    // Check if pre-alert exists
    const preAlert = await this.preAlertsRepository.findById(id, companyId);
    if (!preAlert) {
      throw AppError.notFound('Pre-alert not found');
    }
    
    // Don't allow cancellation if already matched to a package
    if (preAlert.status === 'matched' && preAlert.packageId) {
      throw AppError.badRequest('Cannot cancel pre-alerts that are already matched to packages');
    }
    
    return this.preAlertsRepository.update(id, { status: 'cancelled' }, companyId);
  }

  /**
   * Delete a pre-alert with company isolation (hard delete)
   */
  async deletePreAlert(id: string, companyId: string) {
    // Check if pre-alert exists
    const preAlert = await this.preAlertsRepository.findById(id, companyId);
    if (!preAlert) {
      throw AppError.notFound('Pre-alert not found');
    }
    
    // Don't allow deletion if already matched to a package
    if (preAlert.status === 'matched' && preAlert.packageId) {
      throw AppError.badRequest('Cannot delete pre-alerts that are already matched to packages');
    }
    
    return this.preAlertsRepository.delete(id, companyId);
  }

  /**
   * Search pre-alerts with various filters
   */
  async searchPreAlerts(
    companyId: string,
    searchParams: {
      trackingNumber?: string;
      userId?: string;
      status?: string;
      estimatedArrivalFrom?: Date;
      estimatedArrivalTo?: Date;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      page?: number;
      pageSize?: number;
    }
  ) {
    return this.preAlertsRepository.search(companyId, searchParams);
  }

  /**
   * Add documents to a pre-alert
   */
  async addDocuments(id: string, documents: string[], companyId: string) {
    // Check if pre-alert exists
    const preAlert = await this.preAlertsRepository.findById(id, companyId);
    if (!preAlert) {
      throw AppError.notFound('Pre-alert not found');
    }
    
    // Combine existing documents with new ones
    const updatedDocuments = [
      ...(preAlert.documents || []),
      ...documents
    ];
    
    return this.preAlertsRepository.update(id, { documents: updatedDocuments }, companyId);
  }
  
  /**
   * Remove a document from a pre-alert
   */
  async removeDocument(id: string, documentIndex: number, companyId: string) {
    // Check if pre-alert exists
    const preAlert = await this.preAlertsRepository.findById(id, companyId);
    if (!preAlert) {
      throw AppError.notFound('Pre-alert not found');
    }
    
    // Check if documents array exists and index is valid
    if (!preAlert.documents || documentIndex < 0 || documentIndex >= preAlert.documents.length) {
      throw AppError.badRequest('Invalid document index');
    }
    
    // Remove the document at the specified index
    const updatedDocuments = [...preAlert.documents];
    updatedDocuments.splice(documentIndex, 1);
    
    return this.preAlertsRepository.update(id, { documents: updatedDocuments }, companyId);
  }

  /**
   * Get pre-alerts by package ID with company isolation
   */
  async getPreAlertsByPackageId(packageId: string, companyId: string) {
    return this.preAlertsRepository.findByPackageId(packageId, companyId);
  }
} 