import { Request, Response, NextFunction } from 'express';
import { AutoImportService } from '../services/auto-import-service';
import { AppError } from '../utils/app-error';

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
      const { userId, dateRange = 'this_week' } = req.body;
      const companyId = req.companyId as string;
      const initiatorUserId = req.userId as string;

      if (!companyId) {
        throw new AppError('Company ID is required', 400);
      }

      if (!initiatorUserId) {
        throw new AppError('User ID is required', 400);
      }

      const result = await this.autoImportService.startAutoImport({
        userId,
        dateRange,
        companyId,
        initiatorUserId
      });

      return res.status(200).json({
        success: true,
        message: 'Auto import started',
        data: result
      });
    } catch (error: any) {
      next(error);
    }
  };

  /**
   * Get import status
   */
  getImportStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const companyId = req.companyId as string;

      if (!id) {
        return res.status(200).json({
          status: 'unknown',
          message: 'No import ID provided'
        });
      }

      const status = this.autoImportService.getImportStatus(id, companyId);

      if (!status) {
        return res.status(200).json({
          status: 'unknown',
          message: 'Import not found or not authorized'
        });
      }

      return res.status(200).json({
        status: status.status,
        progress: status.progress,
        startTime: status.startTime,
        endTime: status.endTime,
        error: status.error,
        result: status.result
      });
    } catch (error: any) {
      next(error);
    }
  };

  /**
   * Get latest import status
   */
  getLatestImportStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.companyId as string;

      const allImports = this.autoImportService.getAllImportsForCompany(companyId);
      
      // Get the most recent import
      const sortedImports = allImports.sort((a, b) => {
        return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
      });

      const latestImport = sortedImports[0];

      if (!latestImport) {
        return res.status(200).json({
          status: 'none',
          message: 'No imports found for this company'
        });
      }

      return res.status(200).json({
        id: latestImport.id,
        status: latestImport.status,
        progress: latestImport.progress,
        startTime: latestImport.startTime,
        endTime: latestImport.endTime,
        error: latestImport.error,
        result: latestImport.result
      });
    } catch (error: any) {
      next(error);
    }
  };
} 