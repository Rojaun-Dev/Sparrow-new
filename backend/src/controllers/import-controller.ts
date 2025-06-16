import { Request, Response, NextFunction } from 'express';
import { ImportService } from '../services/import-service';
import { AuditLogsService } from '../services/audit-logs-service';
import { UploadedFile } from 'express-fileupload';
import { randomUUID } from 'crypto';

// Extended request interface with company ID
interface AuthRequest extends Request {
  companyId?: string;
  userId?: string;
  userRole?: string;
  file?: Express.Multer.File; // retained for backward compatibility
  files?: {
    [fieldname: string]: UploadedFile | UploadedFile[];
  };
}

export class ImportController {
  private importService: ImportService;
  private auditLogsService: AuditLogsService;

  constructor() {
    this.importService = new ImportService();
    this.auditLogsService = new AuditLogsService();
  }

  /**
   * Import packages from CSV
   */
  importPackages = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const { csvContent } = req.body;
      const companyId = (req.companyId as string) || req.params.companyId;
      const initiatorUserId = req.userId as string;

      if (!csvContent) {
        return res.status(400).json({
          success: false,
          message: 'CSV content is required',
        });
      }

      // userId is now optional

      // Create audit log for import initiation
      await this.auditLogsService.createLog({
        userId: initiatorUserId,
        companyId,
        action: 'import_initiated',
        entityType: 'package',
        entityId: randomUUID(),
        details: {
          targetUserId: userId,
          method: 'csv_content',
          importType: 'packages'
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      const result = await this.importService.importPackagesFromCsv(
        csvContent,
        userId,
        companyId
      );

      // Create audit log for import completion
      await this.auditLogsService.createLog({
        userId: initiatorUserId,
        companyId,
        action: 'import_completed',
        entityType: 'package',
        entityId: randomUUID(),
        details: {
          targetUserId: userId,
          method: 'csv_content',
          totalRecords: result.totalRecords,
          successCount: result.successCount,
          failedCount: result.failedCount,
          skippedCount: result.skippedCount,
          packageIds: result.createdPackages.map((pkg: any) => pkg.id)
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      return res.status(200).json({
        success: true,
        message: 'Import completed',
        data: result,
      });
    } catch (error: any) {
      next(error);
    }
  };

  /**
   * Import packages from file upload
   */
  importPackagesFromFile = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      // userId is optional
      const { userId } = req.params;
      
      // DEBUG: detailed logging of all possible sources of companyId
      console.log('[ImportController] companyId sources:', {
        fromReq: req.companyId,
        fromParams: req.params.companyId,
        fromUrl: req.originalUrl,
        fromQuery: req.query.companyId,
        fromPath: req.path
      });
      
      // Extract companyId directly from URL path
      let companyId = req.params.companyId;
      
      // If not in params, try from middleware
      if (!companyId) {
        companyId = req.companyId as string;
      }
      
      // Last resort - parse from URL
      if (!companyId && req.originalUrl) {
        const match = req.originalUrl.match(/\/companies\/([^\/]+)/);
        if (match && match[1]) {
          companyId = match[1];
          console.log(`[ImportController] Extracted companyId from URL: ${companyId}`);
        }
      }
      
      // Log final companyId
      console.log(`[ImportController] Using companyId: ${companyId}`);
      
      const initiatorUserId = req.userId as string;
      
      const uploaded = req.files?.csvFile as UploadedFile | UploadedFile[] | undefined;

      if (!uploaded) {
        return res.status(400).json({
          success: false,
          message: 'CSV file is required',
        });
      }

      // If multiple files were uploaded under the same field, take the first one
      const csvFile = Array.isArray(uploaded) ? uploaded[0] : uploaded;

      // Create audit log for import initiation
      await this.auditLogsService.createLog({
        userId: initiatorUserId,
        companyId,
        action: 'import_initiated',
        entityType: 'package',
        entityId: randomUUID(),
        details: {
          targetUserId: userId,
          method: 'file_upload',
          fileName: csvFile.name,
          fileSize: csvFile.size,
          importType: 'packages'
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      // Get file buffer and convert to string
      const csvContent = csvFile.data.toString('utf8');

      const result = await this.importService.importPackagesFromCsv(
        csvContent,
        userId,
        companyId
      );

      // Create audit log for import completion
      await this.auditLogsService.createLog({
        userId: initiatorUserId,
        companyId,
        action: 'import_completed',
        entityType: 'package',
        entityId: randomUUID(),
        details: {
          targetUserId: userId,
          method: 'file_upload',
          fileName: csvFile.name,
          totalRecords: result.totalRecords,
          successCount: result.successCount,
          failedCount: result.failedCount,
          skippedCount: result.skippedCount,
          packageIds: result.createdPackages.map((pkg: any) => pkg.id)
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      return res.status(200).json({
        success: true,
        message: 'Import completed',
        data: result,
      });
    } catch (error: any) {
      next(error);
    }
  };
} 