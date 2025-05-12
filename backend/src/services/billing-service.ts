import { z } from 'zod';
import { InvoicesRepository } from '../repositories/invoices-repository';
import { InvoiceItemsRepository } from '../repositories/invoice-items-repository';
import { PackagesRepository } from '../repositories/packages-repository';
import { FeesRepository } from '../repositories/fees-repository';
import { UsersRepository } from '../repositories/users-repository';
import { CompanySettingsRepository } from '../repositories/company-settings-repository';
import { invoiceStatusEnum } from '../db/schema/invoices';
import { AppError } from '../utils/app-error';
import { FeesService } from './fees-service';
import logger from '../utils/logger';

// Validation schema for generating an invoice
export const generateInvoiceSchema = z.object({
  userId: z.string().uuid(),
  packageIds: z.array(z.string().uuid()).min(1),
  notes: z.string().optional(),
  dueDate: z.coerce.date().optional(),
});

export class BillingService {
  private invoicesRepository: InvoicesRepository;
  private invoiceItemsRepository: InvoiceItemsRepository;
  private packagesRepository: PackagesRepository;
  private feesRepository: FeesRepository;
  private usersRepository: UsersRepository;
  private companySettingsRepository: CompanySettingsRepository;
  private feesService: FeesService;

  constructor() {
    this.invoicesRepository = new InvoicesRepository();
    this.invoiceItemsRepository = new InvoiceItemsRepository();
    this.packagesRepository = new PackagesRepository();
    this.feesRepository = new FeesRepository();
    this.usersRepository = new UsersRepository();
    this.companySettingsRepository = new CompanySettingsRepository();
    this.feesService = new FeesService();
  }

  /**
   * Generate invoice number based on company and sequence
   */
  private async generateInvoiceNumber(companyId: string): Promise<string> {
    // Get company settings to check for prefix 
    const settings = await this.companySettingsRepository.findByCompanyId(companyId);
    
    // Generate a random 4-digit number as a fallback
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    
    // Default prefix
    let prefix = 'INV';
    
    // Get company-specific prefix if available
    if (settings && settings.themeSettings && typeof settings.themeSettings === 'object') {
      const themeSettings = settings.themeSettings as Record<string, any>;
      if (themeSettings.invoiceNumberPrefix) {
        prefix = themeSettings.invoiceNumberPrefix;
      }
    }
    
    // You could implement a true sequential number system here
    // For now, we'll use timestamp + random digits
    const timestamp = new Date().getTime().toString().slice(-6);
    
    return `${prefix}-${timestamp}${randomDigits}`;
  }

  /**
   * Determine if a fee applies to a package based on conditions
   */
  private feeApplies(fee: any, packageData: any): boolean {
    // Get the metadata and applies to fields
    const metadata = fee.metadata || {};
    
    // Check tag conditions if they exist
    if (metadata.tagConditions) {
      const requiredTags = metadata.tagConditions.requiredTags || [];
      const excludedTags = metadata.tagConditions.excludedTags || [];
      const packageTags = packageData.tags || [];
      
      // If package doesn't have all required tags, fee doesn't apply
      if (requiredTags.length > 0 && !requiredTags.every((tag: string) => packageTags.includes(tag))) {
        return false;
      }
      
      // If package has any excluded tags, fee doesn't apply
      if (excludedTags.length > 0 && excludedTags.some((tag: string) => packageTags.includes(tag))) {
        return false;
      }
    }
    
    // Check threshold conditions if they exist
    if (metadata.thresholdConditions) {
      const minWeight = metadata.thresholdConditions.minWeight;
      const maxWeight = metadata.thresholdConditions.maxWeight;
      const minValue = metadata.thresholdConditions.minValue;
      const maxValue = metadata.thresholdConditions.maxValue;
      const validFrom = metadata.thresholdConditions.validFrom;
      const validUntil = metadata.thresholdConditions.validUntil;
      
      // Check weight thresholds
      const packageWeight = parseFloat(packageData.weight || '0');
      if ((minWeight !== undefined && packageWeight < minWeight) || 
          (maxWeight !== undefined && packageWeight > maxWeight)) {
        return false;
      }
      
      // Check value thresholds
      const declaredValue = parseFloat(packageData.declaredValue || '0');
      if ((minValue !== undefined && declaredValue < minValue) || 
          (maxValue !== undefined && declaredValue > maxValue)) {
        return false;
      }
      
      // Check date thresholds
      const now = new Date();
      if ((validFrom && new Date(validFrom) > now) || 
          (validUntil && new Date(validUntil) < now)) {
        return false;
      }
    }
    
    // All conditions passed, fee applies
    return true;
  }

  /**
   * Apply limits to calculated fee amount
   */
  private applyLimits(amount: number, metadata: any): number {
    if (!metadata) return amount;
    
    // Apply minimum threshold
    if (metadata.minimumThreshold !== undefined) {
      amount = Math.max(amount, metadata.minimumThreshold);
    }
    
    // Apply maximum cap
    if (metadata.maximumCap !== undefined) {
      amount = Math.min(amount, metadata.maximumCap);
    }
    
    return amount;
  }

  /**
   * Get applicable fees for a package based on type and conditions
   */
  private async getApplicableFees(packageData: any, companyId: string, feeType?: string): Promise<any[]> {
    // Get all active fees for the company
    const allFees = await this.feesRepository.findActive(companyId);
    
    // Filter fees by type if specified
    let fees = allFees;
    if (feeType) {
      fees = allFees.filter(fee => fee.feeType === feeType);
    }
    
    // Further filter by which fees apply to this specific package
    return fees.filter(fee => this.feeApplies(fee, packageData));
  }

  /**
   * Calculate total fees for a package
   */
  async calculatePackageFees(packageId: string, companyId: string) {
    // Get package details
    const packageData = await this.packagesRepository.findById(packageId, companyId);
    
    if (!packageData) {
      throw new AppError('Package not found', 404);
    }
    
    // Get company settings for tax and other calculations
    const settings = await this.companySettingsRepository.findByCompanyId(companyId);
    
    if (!settings) {
      throw new AppError('Company settings not found', 400);
    }
    
    // Initialize fee totals
    const result = {
      shipping: 0,
      handling: 0,
      customs: 0,
      taxes: 0,
      other: 0,
      subtotal: 0,
      total: 0,
      lineItems: [] as any[]
    };
    
    // Get applicable shipping fees
    const shippingFees = await this.getApplicableFees(packageData, companyId, 'shipping');
    for (const fee of shippingFees) {
      const amount = this.feesService.calculateFeeAmount(fee, 0, packageData);
      const finalAmount = this.applyLimits(amount, fee.metadata);
      result.shipping += finalAmount;
      
      // Add to line items
      result.lineItems.push({
        packageId: packageData.id,
        description: fee.name,
        quantity: 1,
        unitPrice: finalAmount,
        lineTotal: finalAmount,
        type: 'shipping' as any
      });
    }
    
    // Get applicable handling fees
    const handlingFees = await this.getApplicableFees(packageData, companyId, 'handling');
    for (const fee of handlingFees) {
      const amount = this.feesService.calculateFeeAmount(fee, 0, packageData);
      const finalAmount = this.applyLimits(amount, fee.metadata);
      result.handling += finalAmount;
      
      // Add to line items
      result.lineItems.push({
        packageId: packageData.id,
        description: fee.name,
        quantity: 1,
        unitPrice: finalAmount,
        lineTotal: finalAmount,
        type: 'handling' as any
      });
    }
    
    // Get applicable customs fees
    const customsFees = await this.getApplicableFees(packageData, companyId, 'customs');
    for (const fee of customsFees) {
      // Customs fees often use declared value as the base amount
      const declaredValue = parseFloat(packageData.declaredValue || '0');
      const amount = this.feesService.calculateFeeAmount(fee, declaredValue, packageData);
      const finalAmount = this.applyLimits(amount, fee.metadata);
      result.customs += finalAmount;
      
      // Add to line items
      result.lineItems.push({
        packageId: packageData.id,
        description: fee.name,
        quantity: 1,
        unitPrice: finalAmount,
        lineTotal: finalAmount,
        type: 'customs' as any
      });
    }
    
    // Get applicable "other" fees
    const otherFees = await this.getApplicableFees(packageData, companyId, 'other');
    for (const fee of otherFees) {
      const amount = this.feesService.calculateFeeAmount(fee, 0, packageData);
      const finalAmount = this.applyLimits(amount, fee.metadata);
      result.other += finalAmount;
      
      // Add to line items
      result.lineItems.push({
        packageId: packageData.id,
        description: fee.name,
        quantity: 1,
        unitPrice: finalAmount,
        lineTotal: finalAmount,
        type: 'other' as any
      });
    }
    
    // Calculate subtotal (before tax)
    result.subtotal = result.shipping + result.handling + result.customs + result.other;
    
    // Apply tax if applicable
    const taxFees = await this.getApplicableFees(packageData, companyId, 'tax');
    for (const fee of taxFees) {
      // Tax is typically calculated on the subtotal
      const amount = this.feesService.calculateFeeAmount(fee, result.subtotal, packageData);
      const finalAmount = this.applyLimits(amount, fee.metadata);
      result.taxes += finalAmount;
      
      // Add to line items
      result.lineItems.push({
        packageId: packageData.id,
        description: fee.name,
        quantity: 1,
        unitPrice: finalAmount,
        lineTotal: finalAmount,
        type: 'tax' as any
      });
    }
    
    // Calculate total
    result.total = result.subtotal + result.taxes;
    
    return result;
  }

  /**
   * Generate an invoice for a user with the specified packages
   */
  async generateInvoice(data: z.infer<typeof generateInvoiceSchema>, companyId: string) {
    try {
      // Validate data
      const validatedData = generateInvoiceSchema.parse(data);
      
      // Check if user exists in this company
      const user = await this.usersRepository.findById(validatedData.userId, companyId);
      if (!user) {
        throw new AppError('User not found', 404);
      }
      
      // Check if all packages exist and belong to the user
      const packagePromises = validatedData.packageIds.map(id => 
        this.packagesRepository.findById(id, companyId)
      );
      const packages = await Promise.all(packagePromises);
      
      // Verify all packages exist
      if (packages.some(pkg => !pkg)) {
        throw new AppError('One or more packages not found', 404);
      }
      
      // Verify all packages belong to the user
      if (packages.some(pkg => pkg && pkg.userId !== validatedData.userId)) {
        throw new AppError('One or more packages do not belong to this user', 403);
      }
      
      // Generate invoice number
      const invoiceNumber = await this.generateInvoiceNumber(companyId);
      
      // Set default due date (30 days from now) if not provided
      let dueDate = validatedData.dueDate;
      if (!dueDate) {
        dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);
      }
      
      // Initialize totals
      let subtotal = 0;
      let taxAmount = 0;
      
      // Create invoice record
      const invoiceData = {
        userId: validatedData.userId,
        companyId,
        invoiceNumber,
        status: 'draft' as typeof invoiceStatusEnum.enumValues[number],
        issueDate: new Date(),
        dueDate,
        subtotal: '0',
        taxAmount: '0',
        totalAmount: '0',
        notes: validatedData.notes || '',
      };
      
      // Insert invoice
      const invoice = await this.invoicesRepository.create(invoiceData, companyId);
      
      if (!invoice) {
        throw new AppError('Failed to create invoice', 500);
      }
      
      // Calculate fees for each package and add line items
      for (const packageId of validatedData.packageIds) {
        const packageFees = await this.calculatePackageFees(packageId, companyId);
        
        // Add all line items to invoice
        for (const item of packageFees.lineItems) {
          const lineItemData = {
            invoiceId: invoice.id,
            companyId,
            ...item,
          };
          
          await this.invoiceItemsRepository.create(lineItemData, companyId);
          
          // Add to totals (except tax)
          if (item.type !== 'tax') {
            subtotal += parseFloat(item.lineTotal.toString());
          } else {
            taxAmount += parseFloat(item.lineTotal.toString());
          }
        }
      }
      
      // Calculate total
      const totalAmount = subtotal + taxAmount;
      
      // Update invoice with final totals
      await this.invoicesRepository.update(invoice.id, {
        subtotal: subtotal.toString(),
        taxAmount: taxAmount.toString(),
        totalAmount: totalAmount.toString(),
      }, companyId);
      
      // Get the updated invoice
      const updatedInvoice = await this.invoicesRepository.findById(invoice.id, companyId);
      
      return updatedInvoice;
    } catch (error) {
      logger.error({ err: error }, 'Error generating invoice');
      if (error instanceof z.ZodError) {
        throw new AppError('Validation error', 422, error.errors);
      }
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Error generating invoice', 500);
    }
  }

  /**
   * Generate invoices for all unprocessed packages for a user
   */
  async generateInvoiceForUser(userId: string, companyId: string) {
    // Get user
    const user = await this.usersRepository.findById(userId, companyId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    // Get all packages that don't have an invoice yet
    // This would typically be packages in 'processed' or 'ready_for_pickup' states
    // that haven't been associated with an invoice
    const packages = await this.packagesRepository.findUnbilledByUser(userId, companyId);
    
    if (!packages || packages.length === 0) {
      throw new AppError('No unprocessed packages found for this user', 400);
    }
    
    // Generate invoice
    return this.generateInvoice({
      userId,
      packageIds: packages.map(pkg => pkg.id),
    }, companyId);
  }

  /**
   * Preview invoice calculation for packages without creating one
   */
  async previewInvoice(data: z.infer<typeof generateInvoiceSchema>, companyId: string) {
    try {
      // Validate data
      const validatedData = generateInvoiceSchema.parse(data);
      
      // Check if user exists in this company
      const user = await this.usersRepository.findById(validatedData.userId, companyId);
      if (!user) {
        throw new AppError('User not found', 404);
      }
      
      // Check if all packages exist and belong to the user
      const packagePromises = validatedData.packageIds.map(id => 
        this.packagesRepository.findById(id, companyId)
      );
      const packages = await Promise.all(packagePromises);
      
      // Verify all packages exist
      if (packages.some(pkg => !pkg)) {
        throw new AppError('One or more packages not found', 404);
      }
      
      // Verify all packages belong to the user
      if (packages.some(pkg => pkg && pkg.userId !== validatedData.userId)) {
        throw new AppError('One or more packages do not belong to this user', 403);
      }
      
      // Initialize totals
      let subtotal = 0;
      let taxAmount = 0;
      const lineItems: any[] = [];
      
      // Calculate fees for each package
      for (const packageId of validatedData.packageIds) {
        const packageFees = await this.calculatePackageFees(packageId, companyId);
        
        // Track line items
        lineItems.push(...packageFees.lineItems);
        
        // Add to totals
        subtotal += packageFees.subtotal;
        taxAmount += packageFees.taxes;
      }
      
      // Calculate total
      const totalAmount = subtotal + taxAmount;
      
      // Return the preview data
      return {
        userId: validatedData.userId,
        packageIds: validatedData.packageIds,
        subtotal,
        taxAmount,
        totalAmount,
        lineItems,
      };
    } catch (error) {
      logger.error({ err: error }, 'Error previewing invoice');
      if (error instanceof z.ZodError) {
        throw new AppError('Validation error', 422, error.errors);
      }
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Error previewing invoice', 500);
    }
  }
} 