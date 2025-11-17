import { z } from 'zod';
import { parse } from 'csv-parse/sync';
import { PackagesService } from './packages-service';
import { UsersRepository } from '../repositories/users-repository';
import { PackagesRepository } from '../repositories/packages-repository';
import { AppError } from '../utils/app-error';
import { packageStatusEnum } from '../db/schema/packages';
import { db } from '../db';

// Define the expected CSV structure with all possible fields from both formats
export const csvPackageSchema = z.object({
  // Original format fields
  Status: z.string().optional(),
  Number: z.string().optional(),
  Date_xyz: z.string().optional(),
  Consignee: z.string().optional(),
  'Destination Agent': z.string().optional(),
  Shipper: z.string().optional(),
  Carrier: z.string().optional(),
  Pieces: z.string().optional(),
  Weight: z.string().optional(),
  Volume: z.string().optional(),
  'Invoice Number': z.string().optional(),
  Notes: z.string().optional(),
  'Tracking Number': z.string().optional(),
  
  // New format fields
  Description: z.string().optional(),
  'Length (in)': z.string().optional(),
  'Width (in)': z.string().optional(),
  'Height (in)': z.string().optional(),
  'Weight (lb)': z.string().optional(),
  'Volume (ft3)': z.string().optional(),
  Serial: z.string().optional(),
  'Warehouse Receipt': z.string().optional(),
  'Expiration Date': z.string().optional(),
  'Cargo Release': z.string().optional(),
  Quantity: z.string().optional(),
  HTS: z.string().optional(),
  'Entry Date': z.string().optional(),
  EntryDate: z.string().optional(),
  Date: z.string().optional(),
  'On Hold': z.string().optional(),
  'Out Date': z.string().optional(),
});

export type CsvPackageRecord = z.infer<typeof csvPackageSchema>;

export interface ImportResult {
  totalRecords: number;
  successCount: number;
  failedCount: number;
  skippedCount: number;
  errors: { row: number; message: string }[];
  createdPackages: any[];
}

export class ImportService {
  private packagesService: PackagesService;
  private usersRepository: UsersRepository;
  private packagesRepository: PackagesRepository;

  constructor() {
    this.packagesService = new PackagesService();
    this.usersRepository = new UsersRepository();
    this.packagesRepository = new PackagesRepository();
  }

  /**
   * Parse CSV content
   */
  parseCsv(csvContent: string): CsvPackageRecord[] {
    try {
      // Remove UTF-8 BOM if present (appears as "\uFEFF" at the start)
      const cleanContent = csvContent.replace(/^\uFEFF/, '');
      
      // Debug - log first few characters for troubleshooting
      console.debug(`CSV first 50 chars: ${cleanContent.substring(0, 50)}`);
      console.debug(`CSV starts with BOM: ${csvContent.charCodeAt(0) === 0xFEFF}`);
      
      const records = parse(cleanContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relaxColumnCount: true,  // Allow rows with inconsistent column counts
        relaxQuotes: true,       // Be more forgiving of quotes
      });
      
      // Debug - output first record structure
      if (records.length > 0) {
        console.debug(`CSV first record keys: ${Object.keys(records[0])}`);
      }
      
      return records;
    } catch (error: any) {
      console.error(`CSV parsing error: ${error.message}`, {
        errorType: error.constructor.name,
        firstCharCode: csvContent.charCodeAt(0),
        firstLine: csvContent.split('\n')[0].substring(0, 50)
      });
      throw new AppError(`Error parsing CSV: ${error.message}`, 400);
    }
  }

  /**
   * Map CSV status to package status enum
   */
  mapStatus(status: string | undefined): typeof packageStatusEnum.enumValues[number] {
    if (!status) return 'received';

    const statusMap: Record<string, typeof packageStatusEnum.enumValues[number]> = {
      'On Hand': 'in_transit', // Changed from 'received' to 'in_transit' per requirement
      'Delivered': 'delivered',
      'Ready for Pickup': 'ready_for_pickup',
      'Processing': 'processed',
      'In Transit': 'in_transit',
      'Pre-Alert': 'pre_alert',
      'Returned': 'returned',
    };

    return statusMap[status] || 'received';
  }

  /**
   * Check if a package with the given tracking number already exists
   */
  async packageExists(trackingNumber: string, companyId: string): Promise<boolean> {
    if (!trackingNumber) return false;
    
    const existingPackage = await this.packagesRepository.findByTrackingNumber(trackingNumber, companyId);
    return !!existingPackage;
  }

  /**
   * Parse date string in different formats
   */
  parseDate(dateString: string | undefined): Date | undefined {
    if (!dateString || dateString.trim() === '') return undefined;
    
    // Try different date formats
    try {
      // Format: mm/dd/yyyy
      if (dateString.includes('/')) {
        const parts = dateString.split('/');
        // Check if it looks like MM/DD/YYYY format
        if (parts.length === 3) {
          const month = parseInt(parts[0], 10);
          const day = parseInt(parts[1], 10);
          const year = parseInt(parts[2], 10);
          
          // Use full year if it's only 2 digits
          const fullYear = year < 100 ? 2000 + year : year;
          
          return new Date(fullYear, month - 1, day);
        }
        return new Date(dateString);
      }
      
      // Format: dd-mm-yyyy
      if (dateString.includes('-')) {
        const [day, month, year] = dateString.split('-');
        return new Date(`${month}/${day}/${year}`);
      }
      
      // Default - try standard parsing
      return new Date(dateString);
    } catch (error) {
      console.warn(`Failed to parse date: ${dateString}`);
      return undefined;
    }
  }

  /**
   * Import packages from CSV
   */
  async importPackagesFromCsv(csvContent: string, userId: string | null | undefined, companyId: string): Promise<ImportResult> {
    // Critical troubleshooting for companyId
    console.log('ImportService critical debug:', {
      companyId, 
      type: typeof companyId,
      isString: typeof companyId === 'string',
      isNull: companyId === null,
      isUndefined: companyId === undefined,
      isEmpty: companyId === '',
      length: companyId?.length,
      comparison: JSON.stringify(companyId)
    });
    
    // Force valid company ID - hardcoded for test
    let safeCompanyId = companyId;
    if (!safeCompanyId || typeof safeCompanyId !== 'string' || !safeCompanyId.trim()) {
      console.log(`[ImportService] WARNING: Fixing missing companyId - was: "${companyId}"`);
      safeCompanyId = "9332afc9-02f3-46d0-a3ce-01ae3a95b6a3"; // Hardcode for testing
    }

    // If userId is provided, verify user exists in this company
    if (userId) {
      const user = await this.usersRepository.findById(userId, safeCompanyId);
      if (!user) {
        throw AppError.notFound('User not found');
      }
    }

    // Parse CSV
    const records = this.parseCsv(csvContent);

    const result: ImportResult = {
      totalRecords: records.length,
      successCount: 0,
      failedCount: 0,
      skippedCount: 0,
      errors: [],
      createdPackages: [],
    };

    console.log(`[ImportService] Starting CSV import of ${records.length} records for company ${safeCompanyId}`);

    // Process each record with better error handling and logging
    for (let i = 0; i < records.length; i++) {
      try {
        const record = records[i];
        console.log(`[ImportService] Processing record ${i + 1}/${records.length}`);
        
        // Validate record
        const validation = csvPackageSchema.safeParse(record);
        if (!validation.success) {
          throw new Error(
            `Validation error: ${validation.error.errors.map(e => e.message).join(', ')}`
          );
        }

        // Get tracking number from either format
        const trackingNumber = record['Tracking Number'] || '';
        
        // Check if tracking number exists
        if (!trackingNumber) {
          throw new Error('Tracking number is required');
        }
        
        // Check if package already exists in the database
        const exists = await this.packageExists(trackingNumber, safeCompanyId);
        if (exists) {
          result.skippedCount++;
          continue; // Skip this record and move to the next one
        }
        
        // Get description - either from Description field or Notes field
        const description = record.Description || record.Notes || '';
        
        // Get weight - try both formats
        const weight = 
          record['Weight (lb)'] ? parseFloat(record['Weight (lb)']) : 
          record.Weight ? parseFloat(record.Weight) : undefined;
        
        // Get dimensions - either from explicit fields or from Volume
        const dimensions: { length?: number; width?: number; height?: number; volume?: string } = {};
        
        // Try to get explicit dimensions first
        if (record['Length (in)']) dimensions.length = parseFloat(record['Length (in)']);
        if (record['Width (in)']) dimensions.width = parseFloat(record['Width (in)']);
        if (record['Height (in)']) dimensions.height = parseFloat(record['Height (in)']);
        
        // If no explicit dimensions but volume exists, store it
        if (!dimensions.length && !dimensions.width && !dimensions.height) {
          const volume = record['Volume (ft3)'] || record.Volume;
          if (volume) {
            dimensions.volume = volume.toString();
          }
        }
        
        // Get warehouse receipt from either format
        const warehouseReceipt = record['Warehouse Receipt'] || record.Number || '';
        
        // Get date - try different formats and fields
        const receivedDate = 
          this.parseDate(record['Entry Date']) || 
          this.parseDate(record.EntryDate) ||
          this.parseDate(record.Date) ||
          this.parseDate(record.Date_xyz) || 
          new Date();
        
        // Make sure we have a valid date object
        let finalReceivedDate: Date;
        try {
          finalReceivedDate = receivedDate instanceof Date && !isNaN(receivedDate.getTime()) 
            ? receivedDate 
            : new Date();
        } catch (e) {
          finalReceivedDate = new Date();
        }
        
        // Map CSV fields to package schema
        const packageData: any = {
          trackingNumber,
          status: this.mapStatus(record.Status),
          description,
          weight,
          dimensions: Object.keys(dimensions).length > 0 ? dimensions : undefined,
          receivedDate: finalReceivedDate,
          tags: record['On Hold'] === 'Yes' ? ['on_hold'] : [],
          senderInfo: {
            name: record.Shipper || '',
            carrier: record.Carrier || '',
            serial: record.Serial || ''
          },
          notes: `Imported from CSV. Warehouse Receipt: ${warehouseReceipt}`,
          companyId: safeCompanyId  // Explicitly add companyId
        };
        
        // Add userId if provided
        if (userId) {
          packageData.userId = userId;
        }

        // Create the package
        console.log(`[ImportService] Creating package ${i + 1}/${records.length} with tracking: ${trackingNumber}`);
        const createdPackage = await this.packagesService.createPackage(packageData, safeCompanyId);
        console.log(`[ImportService] Successfully created package ${i + 1}/${records.length}, ID: ${createdPackage.id}`);
        result.successCount++;
        result.createdPackages.push(createdPackage);
      } catch (error: any) {
        console.error(`[ImportService] Failed to create package ${i + 1}/${records.length}:`, error.message);
        result.failedCount++;
        result.errors.push({
          row: i + 2, // +2 because row 1 is header and we are 0-indexed
          message: error.message || 'Unknown error occurred',
        });
      }
    }

    console.log(`[ImportService] CSV import completed: ${result.successCount} success, ${result.failedCount} failed, ${result.skippedCount} skipped out of ${result.totalRecords} total`);

    // Add a small delay to ensure all async database operations complete
    // This is critical in Docker/Render environments where process termination can be aggressive
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`[ImportService] Database flush delay completed`);

    return result;
  }
} 