import { companyAssets, assetTypeEnum } from '../db/schema/company-assets';
import { db } from '../db';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

export const createAssetSchema = z.object({
  type: z.enum(assetTypeEnum.enumValues),
  metadata: z.record(z.any()).optional(),
  imageData: z.string().optional(), // base64 string
});

export class CompanyAssetsService {
  async listAssets(companyId: string) {
    return db.select().from(companyAssets).where(eq(companyAssets.companyId, companyId));
  }

  async createAsset(companyId: string, data: any) {
    const validated = createAssetSchema.parse(data);
    return db.insert(companyAssets).values({
      companyId,
      type: validated.type,
      metadata: validated.metadata || {},
      imageData: validated.imageData || null,
    }).returning();
  }

  async updateAsset(companyId: string, assetId: string, data: any) {
    const validated = createAssetSchema.partial().parse(data);
    // Only allow update if asset belongs to company
    const asset = await db.select().from(companyAssets)
      .where(and(eq(companyAssets.id, assetId), eq(companyAssets.companyId, companyId)));
    if (!asset.length) throw new Error('Asset not found');
    return db.update(companyAssets)
      .set({
        ...validated,
      })
      .where(and(eq(companyAssets.id, assetId), eq(companyAssets.companyId, companyId)))
      .returning();
  }

  async deleteAsset(companyId: string, assetId: string) {
    // Only allow delete if asset belongs to company
    const asset = await db.select().from(companyAssets)
      .where(and(eq(companyAssets.id, assetId), eq(companyAssets.companyId, companyId)));
    if (!asset.length) throw new Error('Asset not found');
    return db.delete(companyAssets)
      .where(and(eq(companyAssets.id, assetId), eq(companyAssets.companyId, companyId)));
  }
} 