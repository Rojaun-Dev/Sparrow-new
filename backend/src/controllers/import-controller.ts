import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { ImportService } from '../services/import-service';
import { AuditLogsService } from '../services/audit-logs-service';
import { UploadedFile } from 'express-fileupload';

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
      const companyId = req.companyId as string;
      const { userId, csvContent } = req.body;
      
      if (!csvContent) {
        return res.status(400).json({ 
          success: false,
          message: 'CSV content is required'
        });
      }
      
      // Generate unique batch ID for this import operation
      const batchId = randomUUID();
      
      // Log import start
      await this.auditLogsService.createLog({
        companyId,
        userId: req.userId as string,
        action: 'import_started',
        entityType: 'package',
        entityId: batchId,
        details: { 
          targetUserId: userId,
          method: 'csv_content',
          size: csvContent.length
        }
      });
      
      // Process the import
      const result = await this.importService.importPackagesFromCsv(
        csvContent,
        userId,
        companyId
      );
      
      // Log import result
      await this.auditLogsService.createLog({
        companyId,
        userId: req.userId as string,
        action: 'import_completed',
        entityType: 'package',
        entityId: batchId,
        details: {
          totalRecords: result.totalRecords,
          successCount: result.successCount,
          failedCount: result.failedCount,
          skippedCount: result.skippedCount,
          targetUserId: userId
        }
      });
      
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
      return undefined; // This ensures all paths return a value
    }
  };

  /**
   * Import packages from file upload
   */
  importPackagesFromFile = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.companyId as string;
      const { userId } = req.body;
      
      // Check for file
      if (!req.files || !req.files.csvFile) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }
      
      const file = Array.isArray(req.files.csvFile) 
        ? req.files.csvFile[0] 
        : req.files.csvFile;
      
      if (!file.name.toLowerCase().endsWith('.csv')) {
        return res.status(400).json({
          success: false,
          message: 'File must be a CSV'
        });
      }
      
      // Read file content
      const csvContent = file.data.toString('utf-8');
      
      // Generate unique batch ID for this import operation
      const batchId = randomUUID();
      
      // Log import start
      await this.auditLogsService.createLog({
        companyId,
        userId: req.userId as string,
        action: 'import_started',
        entityType: 'package',
        entityId: batchId,
        details: { 
          targetUserId: userId,
          method: 'file_upload',
          filename: file.name,
          size: file.size
        }
      });
      
      // Process the import
      const result = await this.importService.importPackagesFromCsv(
        csvContent,
        userId,
        companyId
      );
      
      // Log import result
      await this.auditLogsService.createLog({
        companyId,
        userId: req.userId as string,
        action: 'import_completed',
        entityType: 'package',
        entityId: batchId,
        details: {
          totalRecords: result.totalRecords,
          successCount: result.successCount,
          failedCount: result.failedCount,
          skippedCount: result.skippedCount,
          targetUserId: userId,
          filename: file.name
        }
      });
      
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
      return undefined; // This ensures all paths return a value
    }
  };
} 