import { Request, Response, NextFunction } from 'express';
import { AutoImportService } from '../services/auto-import-service';

// Extended request interface with company ID
interface AuthRequest extends Request {
  companyId?: string;
  userId?: string;
  userRole?: string;
}

export class AutoImportController {
  private autoImportService: AutoImportService;

  constructor() {
    this.autoImportService = new AutoImportService();
  }

  /**
   * Start auto import from Magaya
   */
  startMagayaImport = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.companyId as string;
      const userId = req.userId as string;
      
      // Handle specified parameters
      const dateRange = req.query.dateRange as 'today' | 'this_week' | 'this_month' || 'today';
      const networkId = req.query.networkId as string;
      
      // Start the import process
      const result = await this.autoImportService.startAutoImport({
        companyId,
        initiatorUserId: userId,
        dateRange,
        networkId
      });
      
      return res.status(202).json({
        success: true,
        message: 'Import process initiated',
        data: { id: result.id }
      });
    } catch (error) {
      next(error);
      return undefined; // This ensures all paths return a value
    }
  };

  /**
   * Get import status
   */
  getImportStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.companyId as string;
      const { importId } = req.params;
      
      if (!importId) {
        return res.status(400).json({
          success: false,
          message: 'Import ID is required'
        });
      }
      
      const status = this.autoImportService.getImportStatus(importId, companyId);
      
      if (!status) {
        return res.status(404).json({
          success: false,
          message: 'Import job not found'
        });
      }
      
      return res.status(200).json({
        success: true,
        data: status
      });
    } catch (error) {
      next(error);
      return undefined; // This ensures all paths return a value
    }
  };

  /**
   * Get latest import status
   */
  getLatestImportStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.companyId as string;
      
      const statuses = this.autoImportService.getAllImportsForCompany(companyId);
      
      if (!statuses || statuses.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No import jobs found for this company'
        });
      }
      
      // Sort by start time desc to get latest
      const latestImport = statuses.sort((a, b) => 
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      )[0];
      
      return res.status(200).json({
        success: true,
        data: latestImport
      });
    } catch (error) {
      next(error);
      return undefined; // This ensures all paths return a value
    }
  };

  /**
   * Update cron job settings for auto-import
   */
  updateCronSettings = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.companyId as string;
      const userId = req.userId as string;
      const { cronEnabled, cronInterval } = req.body;
      
      await this.autoImportService.updateCronSettings(companyId, {
        cronEnabled,
        cronInterval
      }, userId);
      
      return res.status(200).json({
        success: true,
        message: 'Cron settings updated successfully'
      });
    } catch (error) {
      next(error);
      return undefined; // This ensures all paths return a value
    }
  };
} 