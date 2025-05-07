import { z } from 'zod';
import { BaseService } from './base-service';
import { FeesRepository } from '../repositories/fees-repository';
import { fees, feeTypeEnum, calculationMethodEnum } from '../db/schema/fees';

// Validation schema for creating a fee
export const createFeeSchema = z.object({
  name: z.string().min(2).max(255),
  code: z.string().min(2).max(50).regex(/^[A-Z0-9_]+$/, {
    message: 'Code must be uppercase letters, numbers, and underscores only'
  }),
  feeType: z.enum(feeTypeEnum.enumValues),
  calculationMethod: z.enum(calculationMethodEnum.enumValues),
  amount: z.number().positive(),
  currency: z.string().length(3).default('USD'),
  appliesTo: z.array(z.string()).default([]),
  description: z.string().optional(),
  isActive: z.boolean().default(true)
});

// Validation schema for updating a fee
export const updateFeeSchema = createFeeSchema.partial().omit({ code: true });

export class FeesService extends BaseService<typeof fees> {
  private feesRepository: FeesRepository;

  constructor() {
    const repository = new FeesRepository();
    super(repository);
    this.feesRepository = repository;
  }

  /**
   * Create a new fee with validation
   */
  async create(data: z.infer<typeof createFeeSchema>, companyId: string) {
    // Validate data
    const validatedData = createFeeSchema.parse(data);
    
    // Check if fee code already exists for this company
    const existingFee = await this.feesRepository.findByCode(validatedData.code, companyId);
    if (existingFee) {
      throw new Error(`Fee with code ${validatedData.code} already exists`);
    }
    
    // Create the fee
    return this.feesRepository.create(validatedData, companyId);
  }

  /**
   * Update a fee with validation
   */
  async update(id: string, data: z.infer<typeof updateFeeSchema>, companyId: string) {
    // Validate data
    const validatedData = updateFeeSchema.parse(data);
    
    // Check if fee exists
    const existingFee = await this.feesRepository.findById(id, companyId);
    if (!existingFee) {
      throw new Error('Fee not found');
    }
    
    // Update the fee
    return this.feesRepository.update(id, validatedData, companyId);
  }

  /**
   * Get fees by type
   */
  async getByType(feeType: string, companyId: string) {
    if (!Object.values(feeTypeEnum.enumValues).includes(feeType as any)) {
      throw new Error(`Invalid fee type: ${feeType}`);
    }
    
    return this.feesRepository.findByType(feeType, companyId);
  }

  /**
   * Get all active fees
   */
  async getActiveFees(companyId: string) {
    return this.feesRepository.findActive(companyId);
  }

  /**
   * Deactivate a fee
   */
  async deactivate(id: string, companyId: string) {
    const fee = await this.feesRepository.findById(id, companyId);
    if (!fee) {
      throw new Error('Fee not found');
    }
    
    return this.feesRepository.deactivate(id, companyId);
  }

  /**
   * Activate a fee
   */
  async activate(id: string, companyId: string) {
    const fee = await this.feesRepository.findById(id, companyId);
    if (!fee) {
      throw new Error('Fee not found');
    }
    
    return this.feesRepository.activate(id, companyId);
  }

  /**
   * Calculate fee amount based on its method and value
   */
  calculateFeeAmount(fee: any, baseAmount: number, weight?: number, quantity?: number) {
    switch (fee.calculationMethod) {
      case 'fixed':
        return fee.amount;
      case 'percentage':
        return (baseAmount * fee.amount) / 100;
      case 'per_weight':
        if (!weight) {
          throw new Error('Weight is required for per_weight calculation method');
        }
        return fee.amount * weight;
      case 'per_item':
        if (!quantity) {
          throw new Error('Quantity is required for per_item calculation method');
        }
        return fee.amount * quantity;
      default:
        throw new Error(`Unsupported calculation method: ${fee.calculationMethod}`);
    }
  }
} 