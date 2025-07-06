import { z } from 'zod';

// Define schema for currency information
export const currencyInfoSchema = z.object({
  currency: z.string().min(3).max(3),
  originalAmount: z.number().positive().optional(),
  convertedAmount: z.number().positive().optional(),
  exchangeRate: z.number().positive().optional(),
  baseCurrency: z.string().min(3).max(3).optional(),
  wiPayRequestPayload: z.record(z.any()).optional(),
  wiPayCallback: z.record(z.any()).optional(),
  transactionTimestamp: z.string().optional(),
  paymentProcessedAt: z.string().optional(),
  paymentStatus: z.string().optional(),
});

// Define validation schema for payment creation
export const createPaymentSchema = z.object({
  invoiceId: z.string().uuid(),
  userId: z.string().uuid(),
  amount: z.number().positive(),
  paymentMethod: z.enum(['credit_card', 'bank_transfer', 'cash', 'check', 'online']),
  transactionId: z.string().optional(),
  paymentDate: z.date().optional(),
  notes: z.string().optional(),
  meta: z.record(z.any()).optional().or(currencyInfoSchema.optional()),
  status: z.enum(['pending', 'completed', 'failed', 'refunded']).optional(),
});

// Define validation schema for batch payment creation
export const batchPaymentSchema = z.object({
  payments: z.array(createPaymentSchema),
  sendNotification: z.boolean().optional(),
});

// Define validation schema for WiPay payment request
export const wiPayRequestSchema = z.object({
  invoiceId: z.string().uuid(),
  responseUrl: z.string().url(),
  origin: z.string(),
  currency: z.enum(['USD', 'JMD']).optional().default('USD'),
}); 