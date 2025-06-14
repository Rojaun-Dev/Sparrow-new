import { z } from 'zod';

// Define validation schema for payment creation
export const createPaymentSchema = z.object({
  invoiceId: z.string().uuid(),
  userId: z.string().uuid(),
  amount: z.number().positive(),
  paymentMethod: z.enum(['credit_card', 'bank_transfer', 'cash', 'check', 'online']),
  transactionId: z.string().optional(),
  paymentDate: z.date().optional(),
  notes: z.string().optional(),
});

// Define validation schema for batch payment creation
export const batchPaymentSchema = z.object({
  payments: z.array(createPaymentSchema),
  sendNotification: z.boolean().optional(),
}); 