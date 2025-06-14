import { Request, Response, NextFunction } from 'express';
import { CompanyAssetsService } from '../services/company-assets-service';

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
      return undefined;
    }
  };

  // Public endpoint to list assets for a company - no auth required
  // Used for public branding on login/register pages
  listPublicAssets = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('List public assets request:', {
        companyId: req.params.companyId,
        headers: req.headers
      });
      
      const companyId = req.params.companyId as string;
      if (!companyId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Company ID is required' 
        });
      }
      
      // Only fetch public assets (logo, banner)
      const assets = await this.service.listAssets(companyId);
      const publicAssets = assets.filter(asset => 
        ['logo', 'banner', 'favicon'].includes(asset.type)
      );
      
      return res.json({ success: true, data: publicAssets });
    } catch (error) {
      console.error('Error listing public assets:', error);
      next(error);
      return undefined;
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
      return undefined;
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
      return undefined;
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
      return undefined;
    }
  };
} 