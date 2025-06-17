import { z } from 'zod';
import { packageStatusEnum } from '../db/schema/packages';

// Define the schema for creating a package
export const createPackageSchema = z.object({
  userId: z.string().uuid().optional(),
  trackingNumber: z.string(),
  status: z.enum(packageStatusEnum.enumValues).optional().default('in_transit'),
  description: z.string().optional(),
  weight: z.number().optional(),
  dimensions: z.object({
    length: z.number().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
  }).optional(),
  senderInfo: z.record(z.string(), z.any()).optional(),
  declaredValue: z.number().optional(),
  receivedDate: z.date().optional(),
  processingDate: z.date().optional(),
  photos: z.array(z.string()).optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  prefId: z.string().optional(),
});

// Schema for updating a package
export const updatePackageSchema = createPackageSchema.partial(); 