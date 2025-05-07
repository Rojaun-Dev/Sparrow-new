import { z } from 'zod';
import { PreAlertsRepository } from '../repositories/pre-alerts-repository';
import { UsersRepository } from '../repositories/users-repository';
import { AppError } from '../utils/app-error';
import { preAlertStatusEnum } from '../db/schema/pre-alerts';

// Validation schema for pre-alert creation
export const createPreAlertSchema = z.object({
  userId: z.string().uuid(),
  trackingNumber: z.string().min(3).max(100),
  courier: z.string().min(2).max(50),
  description: z.string().optional(),
  estimatedWeight: z.number().positive().optional(),
  estimatedArrival: z.coerce.date().optional(),
  status: z.enum(preAlertStatusEnum.enumValues).default('pending'),
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
  async getAllPreAlerts(companyId: string) {
    return this.preAlertsRepository.findAll(companyId);
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
} 