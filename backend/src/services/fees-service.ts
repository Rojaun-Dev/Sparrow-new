import { z } from 'zod';
import { BaseService } from './base-service';
import { FeesRepository } from '../repositories/fees-repository';
import { fees, feeTypeEnum, calculationMethodEnum } from '../db/schema/fees';

const baseFeeSchema = z.object({
  name: z.string().min(2).max(255),
  code: z.string().min(2).max(50).regex(/^[A-Z0-9_]+$/, {
    message: 'Code must be uppercase letters, numbers, and underscores only'
  }),
  feeType: z.enum(feeTypeEnum.enumValues),
  calculationMethod: z.enum(calculationMethodEnum.enumValues),
  amount: z.number().positive(),
  currency: z.string().length(3).default('USD'),
  appliesTo: z.array(z.string()).default([]),
  metadata: z.record(z.any()).optional().default({}),
  description: z.string().optional(),
  isActive: z.boolean().default(true)
});

export const createFeeSchema = baseFeeSchema.superRefine((data, ctx) => {
  if (data.calculationMethod === 'percentage') {
    if (!data.metadata || !data.metadata.baseAttribute || typeof data.metadata.baseAttribute !== 'string' || data.metadata.baseAttribute.trim().length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'baseAttribute (in metadata) is required and must be at least 2 characters when calculationMethod is percentage',
        path: ['metadata', 'baseAttribute']
      });
    }
  }
  if (data.calculationMethod === 'threshold') {
    if (!data.metadata || typeof data.metadata.attribute !== 'string' || data.metadata.attribute.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'attribute (in metadata) is required for threshold calculation method',
        path: ['metadata', 'attribute']
      });
    }
    if (data.metadata?.min === undefined || data.metadata?.min === null || isNaN(Number(data.metadata.min))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'min (in metadata) is required for threshold calculation method',
        path: ['metadata', 'min']
      });
    }
    if (!['before', 'during', 'after'].includes(data.metadata?.application)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'application (in metadata) must be one of before, during, after for threshold calculation method',
        path: ['metadata', 'application']
      });
    }
  }
  if (data.calculationMethod === 'timed') {
    if (data.metadata?.days === undefined || data.metadata?.days === null || isNaN(Number(data.metadata.days))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'days (in metadata) is required for timed calculation method',
        path: ['metadata', 'days']
      });
    }
    if (!['before', 'after'].includes(data.metadata?.application)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'application (in metadata) must be one of before, after for timed calculation method',
        path: ['metadata', 'application']
      });
    }
  }
});

export const updateFeeSchema = baseFeeSchema.partial().omit({ code: true }).superRefine((data, ctx) => {
  if (data.calculationMethod === 'percentage') {
    if (!data.metadata || !data.metadata.baseAttribute || typeof data.metadata.baseAttribute !== 'string' || data.metadata.baseAttribute.trim().length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'baseAttribute (in metadata) is required and must be at least 2 characters when calculationMethod is percentage',
        path: ['metadata', 'baseAttribute']
      });
    }
  }
  if (data.calculationMethod === 'threshold') {
    if (!data.metadata || typeof data.metadata.attribute !== 'string' || data.metadata.attribute.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'attribute (in metadata) is required for threshold calculation method',
        path: ['metadata', 'attribute']
      });
    }
    if (data.metadata?.min === undefined || data.metadata?.min === null || isNaN(Number(data.metadata.min))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'min (in metadata) is required for threshold calculation method',
        path: ['metadata', 'min']
      });
    }
    if (!['before', 'during', 'after'].includes(data.metadata?.application)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'application (in metadata) must be one of before, during, after for threshold calculation method',
        path: ['metadata', 'application']
      });
    }
  }
  if (data.calculationMethod === 'timed') {
    if (data.metadata?.days === undefined || data.metadata?.days === null || isNaN(Number(data.metadata.days))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'days (in metadata) is required for timed calculation method',
        path: ['metadata', 'days']
      });
    }
    if (!['before', 'after'].includes(data.metadata?.application)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'application (in metadata) must be one of before, after for timed calculation method',
        path: ['metadata', 'application']
      });
    }
  }
});

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
  calculateFeeAmount(fee: any, baseAmount: number, packageData?: any, context?: { subtotal?: number, shipping?: number, handling?: number, customs?: number, other?: number }) {
    const weight = packageData?.weight || 0;
    const quantity = packageData?.quantity || 1;
    const dimensions = packageData?.dimensions || { length: 0, width: 0, height: 0 };
    const metadata = fee.metadata || {};

    switch (fee.calculationMethod) {
      case 'fixed':
        return fee.amount;
      case 'percentage': {
        // Use metadata.baseAttribute to determine the base
        let base = 0;
        if (typeof metadata.baseAttribute === 'string' && context && Object.prototype.hasOwnProperty.call(context, metadata.baseAttribute)) {
          base = context[metadata.baseAttribute as keyof typeof context] ?? 0;
        } else if (typeof metadata.baseAttribute === 'string' && packageData && typeof packageData[metadata.baseAttribute] === 'number') {
          base = packageData[metadata.baseAttribute];
        } else {
          base = baseAmount;
        }
        return (base * fee.amount) / 100;
      }
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
      case 'dimensional':
        const dimensionalFactor = metadata.dimensionalFactor || 139; // Industry standard default
        const { length, width, height } = dimensions;
        // Calculate dimensional weight
        const dimensionalWeight = (length * width * height) / dimensionalFactor;
        // Use the greater of actual or dimensional weight
        const chargeableWeight = Math.max(dimensionalWeight, weight);
        return fee.amount * chargeableWeight;
      case 'tiered':
        const tiers = metadata.tiers || [];
        const tierAttribute = metadata.tierAttribute || 'weight';
        const value = packageData?.[tierAttribute] || 0;
        // Find the appropriate tier
        const tier = tiers.find((t: any) => 
          value >= t.min && (t.max === null || value < t.max)
        );
        return tier ? tier.rate : 0;
      case 'threshold': {
        // Threshold logic: attribute, min, max, application
        const attribute = metadata.attribute;
        const min = metadata.min;
        const max = metadata.max ?? null;
        const application = metadata.application; // 'before' | 'during' | 'after'
        if (!attribute || min === undefined || !application) return 0;
        const value = packageData?.[attribute];
        if (typeof value !== 'number') return 0;
        // Determine if value is before, during, or after threshold
        const inRange = (max === null || max === undefined)
          ? value >= min
          : value >= min && value <= max;
        if (application === 'before' && value < min) return fee.amount;
        if (application === 'during' && inRange) return fee.amount;
        if (application === 'after' && max !== null && value > max) return fee.amount;
        if (application === 'after' && max === null && value > min) return fee.amount;
        return 0;
      }
      case 'timed': {
        // Timed logic: days, application
        const days = metadata.days;
        const application = metadata.application; // 'before' | 'after'
        if (days === undefined || !application) return 0;
        const value = packageData?.days;
        if (typeof value !== 'number') return 0;
        if (application === 'before' && value < days) return fee.amount;
        if (application === 'after' && value > days) return fee.amount;
        return 0;
      }
      default:
        throw new Error(`Unsupported calculation method: ${fee.calculationMethod}`);
    }
  }
} 