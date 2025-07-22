import { z } from 'zod';
import { DUTY_FEE_TYPES } from '../types/duty-fee';

export const createDutyFeeSchema = z.object({
  packageId: z.string().uuid('Package ID must be a valid UUID'),
  feeType: z.enum(DUTY_FEE_TYPES, {
    errorMap: () => ({ message: 'Invalid duty fee type' })
  }),
  customFeeType: z.string().optional().refine((val) => {
    // If feeType is 'Other', customFeeType is required
    return val !== undefined || true; // This will be validated in the controller
  }),
  amount: z.coerce.number().positive('Amount must be positive'),
  currency: z.enum(['USD', 'JMD'], {
    errorMap: () => ({ message: 'Currency must be USD or JMD' })
  }).default('USD'),
  description: z.string().optional()
});

export const updateDutyFeeSchema = z.object({
  feeType: z.enum(DUTY_FEE_TYPES).optional(),
  customFeeType: z.string().optional(),
  amount: z.coerce.number().positive('Amount must be positive').optional(),
  currency: z.enum(['USD', 'JMD']).optional(),
  description: z.string().optional()
});

export const dutyFeeParamsSchema = z.object({
  id: z.string().uuid('Duty fee ID must be a valid UUID')
});

export const packageParamsSchema = z.object({
  packageId: z.string().uuid('Package ID must be a valid UUID')
});

export type CreateDutyFeeInput = z.infer<typeof createDutyFeeSchema>;
export type UpdateDutyFeeInput = z.infer<typeof updateDutyFeeSchema>;
export type DutyFeeParams = z.infer<typeof dutyFeeParamsSchema>;
export type PackageParams = z.infer<typeof packageParamsSchema>;