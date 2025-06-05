import { Request, Response, NextFunction } from 'express';
import { CompanyAssetsService, createAssetSchema } from '../services/company-assets-service';

interface AuthRequest extends Request {
  companyId?: string;
  userRole?: string;
}

export class CompanyAssetsController {
  private service: CompanyAssetsService;

  constructor() {
    this.service = new CompanyAssetsService();
  }

  // List all assets for a company
  listAssets = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      console.log('List assets request:', {
        companyId: req.companyId,
        userRole: req.userRole,
        headers: req.headers
      });
      
      const companyId = req.companyId as string;
      const assets = await this.service.listAssets(companyId);
      return res.json({ success: true, data: assets });
    } catch (error) {
      console.error('Error listing assets:', error);
      next(error);
    }
  };

  // Create a new asset (image or URL)
  createAsset = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      console.log('Create asset request:', {
        companyId: req.companyId,
        userRole: req.userRole,
        body: req.body
      });
      
      const companyId = req.companyId as string;
      const asset = await this.service.createAsset(companyId, req.body);
      return res.status(201).json({ success: true, data: asset });
    } catch (error) {
      console.error('Error creating asset:', error);
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ success: false, message: 'Validation error', details: (error as any).errors });
      }
      next(error);
    }
  };

  // Update an asset
  updateAsset = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      console.log('Update asset request:', {
        companyId: req.companyId,
        userRole: req.userRole,
        assetId: req.params.id,
        body: req.body
      });
      
      const companyId = req.companyId as string;
      const assetId = req.params.id;
      const asset = await this.service.updateAsset(companyId, assetId, req.body);
      return res.json({ success: true, data: asset });
    } catch (error) {
      console.error('Error updating asset:', error);
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ success: false, message: 'Validation error', details: (error as any).errors });
      }
      next(error);
    }
  };

  // Delete an asset
  deleteAsset = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      console.log('Delete asset request:', {
        companyId: req.companyId,
        userRole: req.userRole,
        assetId: req.params.id
      });
      
      const companyId = req.companyId as string;
      const assetId = req.params.id;
      await this.service.deleteAsset(companyId, assetId);
      return res.json({ success: true, message: 'Asset deleted' });
    } catch (error) {
      console.error('Error deleting asset:', error);
      next(error);
    }
  };
} 