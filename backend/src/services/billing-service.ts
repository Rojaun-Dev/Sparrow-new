import { z } from 'zod';
import { InvoicesRepository } from '../repositories/invoices-repository';
import { InvoiceItemsRepository } from '../repositories/invoice-items-repository';
import { PackagesRepository } from '../repositories/packages-repository';
import { FeesRepository } from '../repositories/fees-repository';
import { DutyFeesRepository } from '../repositories/duty-fees-repository';
import { UsersRepository } from '../repositories/users-repository';
import { CompanySettingsRepository } from '../repositories/company-settings-repository';
import { invoiceStatusEnum } from '../db/schema/invoices';
import { AppError } from '../utils/app-error';
import { FeesService } from './fees-service';
import { convertCurrency, getDisplayCurrency } from '../utils/currency-utils';
import logger from '../utils/logger';

// Custom line item schema
export const customLineItemSchema = z.object({
  description: z.string().min(1).max(255),
  quantity: z.number().min(0),
  unitPrice: z.number().min(0),
  packageId: z.string().uuid().optional(), // Optional package association
});

// Validation schema for generating an invoice
export const generateInvoiceSchema = z.object({
  userId: z.string().uuid(),
  packageIds: z.array(z.string().uuid()).optional().default([]), // Made optional for custom invoices
  customLineItems: z.array(customLineItemSchema).optional().default([]), // New custom line items
  notes: z.string().optional(),
  dueDate: z.coerce.date().optional(),
  additionalCharge: z.number().optional(),
  additionalChargeCurrency: z.enum(['USD', 'JMD']).optional(),
  sendNotification: z.boolean().optional(),
  generateFees: z.boolean().optional().default(true), // Whether to generate predefined fees
  isDraft: z.boolean().optional().default(false), // Whether to create as draft
}).refine((data) => {
  // At least one of packageIds, customLineItems, or additionalCharge must be provided
  return data.packageIds.length > 0 || data.customLineItems.length > 0 || (data.additionalCharge && data.additionalCharge > 0);
}, {
  message: "At least one package, custom line item, or additional charge must be provided"
});

export class BillingService {
  private invoicesRepository: InvoicesRepository;
  private invoiceItemsRepository: InvoiceItemsRepository;
  private packagesRepository: PackagesRepository;
  private feesRepository: FeesRepository;
  private dutyFeesRepository: DutyFeesRepository;
  private usersRepository: UsersRepository;
  private companySettingsRepository: CompanySettingsRepository;
  private feesService: FeesService;

  constructor() {
    this.invoicesRepository = new InvoicesRepository();
    this.invoiceItemsRepository = new InvoiceItemsRepository();
    this.packagesRepository = new PackagesRepository();
    this.feesRepository = new FeesRepository();
    this.dutyFeesRepository = new DutyFeesRepository();
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
    const appliesTo = Array.isArray(fee.appliesTo) ? fee.appliesTo : [];
    const packageTags = Array.isArray(packageData.tags) ? packageData.tags : [];

    // If fee has no appliesTo tags, apply to all packages
    if (appliesTo.length === 0) {
      // continue to other checks
    } else {
      // Fee only applies if at least one of the package's tags is in appliesTo
      if (!packageTags.some((tag: string) => appliesTo.includes(tag))) {
        return false;
      }
    }

    // Check tag conditions if they exist
    if (metadata.tagConditions) {
      const requiredTags = metadata.tagConditions.requiredTags || [];
      const excludedTags = metadata.tagConditions.excludedTags || [];
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
  async calculatePackageFees(packageId: string, companyId: string, fixedFeesApplied: Set<string> = new Set()) {
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
    
    // Get exchange rate settings for currency conversion
    const defaultExchangeRateSettings = {
      baseCurrency: 'USD' as 'USD',
      targetCurrency: 'JMD' as 'JMD',
      exchangeRate: 1,
      autoUpdate: false,
      lastUpdated: new Date().toISOString()
    };
    
    const exchangeRateSettings = (settings.exchangeRateSettings && 
      typeof settings.exchangeRateSettings === 'object' &&
      'baseCurrency' in settings.exchangeRateSettings)
      ? settings.exchangeRateSettings as any
      : defaultExchangeRateSettings;
    
    const displayCurrency = getDisplayCurrency(exchangeRateSettings);
    
    // Initialize fee totals
    const result: { [key: string]: any; shipping: number; handling: number; customs: number; duty: number; other: number; taxes: number; subtotal: number; total: number; lineItems: any[] } = {
      shipping: 0,
      handling: 0,
      customs: 0,
      duty: 0,
      other: 0,
      taxes: 0,
      subtotal: 0,
      total: 0,
      lineItems: [] as any[],
    };
    // 1. Calculate all base (non-percentage) fees and collect percentage-based fees for later
    const percentageFeesByType: Record<string, any[]> = { shipping: [], handling: [], customs: [], other: [], subtotal: [], taxes: [] };
    for (const type of ['shipping', 'handling', 'customs', 'service', 'other']) {
      const fees = await this.getApplicableFees(packageData, companyId, type);
      for (const fee of fees) {
        // Deduplicate fixed fees (apply only once per invoice)
        if (fee.calculationMethod === 'fixed') {
          if (fixedFeesApplied.has(fee.id)) continue;
          fixedFeesApplied.add(fee.id);
        }
        if (fee.calculationMethod === 'percentage') {
          const baseAttr = (fee.metadata && fee.metadata.baseAttribute) || 'subtotal';
          if (!percentageFeesByType[baseAttr]) percentageFeesByType[baseAttr] = [];
          percentageFeesByType[baseAttr].push(fee);
          continue;
        }
        let baseAmount = 0;
        if (type === 'customs') {
          baseAmount = parseFloat(packageData.declaredValue || '0');
        }
        // Calculate original amount first (without currency conversion)
        const originalAmount = Number(this.feesService.calculateFeeAmount(fee, baseAmount, packageData));
        // Calculate converted amount
        const amount = Number(this.feesService.calculateFeeAmount(fee, baseAmount, packageData, undefined, exchangeRateSettings, displayCurrency));
        const finalAmount = Number(this.applyLimits(amount, fee.metadata));
        // Map 'service' to 'other' for DB enum
        const itemType = type === 'service' ? 'other' : type;
        result[itemType] += finalAmount;
        
        // Create description with currency conversion info if converted
        let description = fee.name;
        if (fee.currency !== displayCurrency) {
          description += ` (${fee.currency} ${originalAmount.toFixed(2)} → ${displayCurrency})`;
        }
        
        result.lineItems.push({
          packageId: packageData.id,
          description,
          quantity: 1,
          unitPrice: finalAmount,
          lineTotal: finalAmount,
          type: itemType as any,
        });
      }
    }
    
    // 1.5. Add duty fees for this package
    const dutyFees = await this.dutyFeesRepository.findByPackageId(packageId, companyId);
    
    for (const dutyFee of dutyFees) {
      const originalAmount = parseFloat(dutyFee.amount);
      
      // Convert duty fee amount to display currency if needed
      const convertedAmount = convertCurrency(
        originalAmount, 
        dutyFee.currency, 
        displayCurrency, 
        exchangeRateSettings
      );
      
      result.duty += convertedAmount;
      
      // Create a display name for the duty fee
      const displayName = dutyFee.feeType === 'Other' && dutyFee.customFeeType 
        ? `${dutyFee.customFeeType} Duty` 
        : `${dutyFee.feeType} Duty`;
      
      // Create description with currency conversion info if converted
      let description = dutyFee.description ? `${displayName} - ${dutyFee.description}` : displayName;
      if (dutyFee.currency !== displayCurrency) {
        description += ` (${dutyFee.currency} ${originalAmount.toFixed(2)} → ${displayCurrency})`;
      }
      
      result.lineItems.push({
        packageId: packageData.id,
        description,
        quantity: 1,
        unitPrice: convertedAmount,
        lineTotal: convertedAmount,
        type: 'duty' as any,
      });
    }
    
    // 2. Calculate subtotal (before tax/percentage fees) - now includes duty fees
    result.subtotal = Number(result.shipping) + Number(result.handling) + Number(result.customs) + Number(result.duty) + Number(result.other);
    // 3. Build context for percentage-based fees
    const context: { [key: string]: any; shipping: number; handling: number; customs: number; duty: number; other: number; subtotal: number; declaredValue: number } = {
      shipping: result.shipping,
      handling: result.handling,
      customs: result.customs,
      duty: result.duty,
      other: result.other,
      subtotal: result.subtotal,
      declaredValue: parseFloat(packageData.declaredValue || '0'),
    };
    // 4. Calculate all percentage-based fees (except taxes)
    for (const baseAttr of Object.keys(percentageFeesByType)) {
      if (baseAttr === 'taxes' || baseAttr === 'subtotal') continue; // taxes handled separately, subtotal handled after others
      for (const fee of percentageFeesByType[baseAttr]) {
        // Use context for base
        let base = 0;
        if (baseAttr === 'customs' || baseAttr === 'declaredValue') {
          base = context.declaredValue;
        } else {
          base = context[baseAttr] ?? 0;
        }
        if (!base) continue; // skip if base is 0
        // Calculate original amount first (without currency conversion)
        const originalAmount = Number(this.feesService.calculateFeeAmount(fee, base, packageData, context));
        // Calculate converted amount
        const amount = Number(this.feesService.calculateFeeAmount(fee, base, packageData, context, exchangeRateSettings, displayCurrency));
        const finalAmount = Number(this.applyLimits(amount, fee.metadata));
        result[fee.feeType] = (result[fee.feeType] || 0) + finalAmount;
        
        // Create description with currency conversion info if converted
        let description = fee.name;
        if (fee.currency !== displayCurrency) {
          description += ` (${fee.currency} ${originalAmount.toFixed(2)} → ${displayCurrency})`;
        }
        
        result.lineItems.push({
          packageId: packageData.id,
          description,
          quantity: 1,
          unitPrice: finalAmount,
          lineTotal: finalAmount,
          type: fee.feeType,
        });
      }
    }
    // 5. Calculate percentage-of-subtotal fees (if any)
    for (const fee of percentageFeesByType['subtotal'] || []) {
      if (!context.subtotal) continue;
      // Calculate original amount first (without currency conversion)
      const originalAmount = Number(this.feesService.calculateFeeAmount(fee, context.subtotal, packageData, context));
      // Calculate converted amount
      const amount = Number(this.feesService.calculateFeeAmount(fee, context.subtotal, packageData, context, exchangeRateSettings, displayCurrency));
      const finalAmount = Number(this.applyLimits(amount, fee.metadata));
      result[fee.feeType] = (result[fee.feeType] || 0) + finalAmount;
      
      // Create description with currency conversion info if converted
      let description = fee.name;
      if (fee.currency !== displayCurrency) {
        description += ` (${fee.currency} ${originalAmount.toFixed(2)} → ${displayCurrency})`;
      }
      
      result.lineItems.push({
        packageId: packageData.id,
        description,
        quantity: 1,
        unitPrice: finalAmount,
        lineTotal: finalAmount,
        type: fee.feeType,
      });
    }
    // 6. Calculate tax fees (percentage-of-subtotal or other base)
    const taxFees = await this.getApplicableFees(packageData, companyId, 'tax');
    for (const fee of taxFees) {
      let base = context.subtotal;
      if (fee.calculationMethod === 'percentage' && fee.metadata && fee.metadata.baseAttribute) {
        if (fee.metadata.baseAttribute === 'customs' || fee.metadata.baseAttribute === 'declaredValue') {
          base = context.declaredValue;
        } else {
          base = context[fee.metadata.baseAttribute] ?? context.subtotal;
        }
      }
      if (!base) continue;
      // Calculate original amount first (without currency conversion)
      const originalAmount = Number(this.feesService.calculateFeeAmount(fee, base, packageData, context));
      // Calculate converted amount
      const amount = Number(this.feesService.calculateFeeAmount(fee, base, packageData, context, exchangeRateSettings, displayCurrency));
      const finalAmount = Number(this.applyLimits(amount, fee.metadata));
      result.taxes += finalAmount;
      
      // Create description with currency conversion info if converted
      let description = fee.name;
      if (fee.currency !== displayCurrency) {
        description += ` (${fee.currency} ${originalAmount.toFixed(2)} → ${displayCurrency})`;
      }
      
      result.lineItems.push({
        packageId: packageData.id,
        description,
        quantity: 1,
        unitPrice: finalAmount,
        lineTotal: finalAmount,
        type: 'tax' as any,
      });
    }
    // 7. Calculate total
    result.total = Number(result.subtotal) + Number(result.taxes);
    return {
      ...result,
      context,
    };
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
      // Initialize fee breakdown
      const feeBreakdown: Record<string, number> = {
        shipping: 0,
        handling: 0,
        customs: 0,
        other: 0,
        taxes: 0,
      };
      
      // Create invoice record
      const invoiceData = {
        userId: validatedData.userId,
        companyId,
        invoiceNumber,
        status: 'issued' as typeof invoiceStatusEnum.enumValues[number],
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
      const fixedFeesApplied = new Set<string>();
      for (const packageId of validatedData.packageIds) {
        const packageFees = await this.calculatePackageFees(packageId, companyId, fixedFeesApplied);
        // Aggregate fee breakdown
        feeBreakdown.shipping += Number(packageFees.shipping) || 0;
        feeBreakdown.handling += Number(packageFees.handling) || 0;
        feeBreakdown.customs += Number(packageFees.customs) || 0;
        feeBreakdown.other += Number(packageFees.other) || 0;
        feeBreakdown.taxes += Number(packageFees.taxes) || 0;
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
            subtotal += Number(item.lineTotal);
          } else {
            taxAmount += Number(item.lineTotal);
          }
        }
      }
      
      // Add additional charge if provided
      if (validatedData.additionalCharge && validatedData.additionalCharge > 0) {
        // Get company settings for currency conversion
        const settings = await this.companySettingsRepository.findByCompanyId(companyId);
        if (!settings) {
          throw new AppError('Company settings not found', 400);
        }
        
        // Get exchange rate settings for currency conversion
        const defaultExchangeRateSettings = {
          baseCurrency: 'USD' as 'USD',
          targetCurrency: 'JMD' as 'JMD',
          exchangeRate: 1,
          autoUpdate: false,
          lastUpdated: new Date().toISOString()
        };
        
        const exchangeRateSettings = (settings.exchangeRateSettings && 
          typeof settings.exchangeRateSettings === 'object' &&
          'baseCurrency' in settings.exchangeRateSettings)
          ? settings.exchangeRateSettings as any
          : defaultExchangeRateSettings;
        
        const displayCurrency = getDisplayCurrency(exchangeRateSettings);
        
        // Determine the source currency for additional charge (default to display currency if not specified)
        const sourceCurrency = validatedData.additionalChargeCurrency || displayCurrency;
        
        // Convert additional charge to display currency
        const originalAmount = validatedData.additionalCharge;
        const convertedAmount = convertCurrency(
          originalAmount,
          sourceCurrency,
          displayCurrency,
          exchangeRateSettings
        );
        
        // Create description with currency conversion info if converted
        let description = 'Additional Charge';
        if (sourceCurrency !== displayCurrency) {
          description += ` (${sourceCurrency} ${originalAmount.toFixed(2)} → ${displayCurrency})`;
        }
        
        const addCharge = {
          invoiceId: invoice.id,
          companyId,
          // Do not set packageId at all if not present
          // packageId: null,
          description,
          quantity: 1,
          unitPrice: convertedAmount,
          lineTotal: convertedAmount,
          type: 'other',
        };
        await this.invoiceItemsRepository.create(addCharge, companyId);
        subtotal += convertedAmount;
        feeBreakdown.other += convertedAmount;
      }
      
      // Calculate total
      const totalAmount = subtotal + taxAmount;
      
      // Update invoice with final totals and fee breakdown
      await this.invoicesRepository.update(invoice.id, {
        subtotal: subtotal.toString(),
        taxAmount: taxAmount.toString(),
        totalAmount: totalAmount.toString(),
        feeBreakdown: feeBreakdown,
        notes: validatedData.notes || '',
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
    // Check if user exists and belongs to this company
    const user = await this.usersRepository.findById(userId, companyId);
    if (!user) {
      throw AppError.notFound('User not found');
    }
    
    // Get all unbilled packages for this user
    const packages = await this.packagesRepository.findUnbilledByUserId(userId, companyId);
    
    if (packages.length === 0) {
      throw AppError.badRequest('No unbilled packages found for this user');
    }
    
    // Generate invoice for these packages
    return this.generateInvoice({
      userId,
      packageIds: packages.map(pkg => pkg.id),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
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
      // Initialize fee breakdown
      const feeBreakdown: Record<string, number> = {
        shipping: 0,
        handling: 0,
        customs: 0,
        other: 0,
        taxes: 0,
      };
      
      // Calculate fees for each package
      const fixedFeesApplied = new Set<string>();
      for (const packageId of validatedData.packageIds) {
        const packageFees = await this.calculatePackageFees(packageId, companyId, fixedFeesApplied);
        // Aggregate fee breakdown (parse as numbers)
        feeBreakdown.shipping += Number(packageFees.shipping) || 0;
        feeBreakdown.handling += Number(packageFees.handling) || 0;
        feeBreakdown.customs += Number(packageFees.customs) || 0;
        feeBreakdown.other += Number(packageFees.other) || 0;
        feeBreakdown.taxes += Number(packageFees.taxes) || 0;
        // Track line items
        lineItems.push(...packageFees.lineItems);
        // Add to totals (parse as numbers)
        subtotal += Number(packageFees.subtotal) || 0;
        taxAmount += Number(packageFees.taxes) || 0;
      }
      
      // Add additional charge to preview if provided
      if (validatedData.additionalCharge && validatedData.additionalCharge > 0) {
        // Get company settings for currency conversion
        const settings = await this.companySettingsRepository.findByCompanyId(companyId);
        if (!settings) {
          throw new AppError('Company settings not found', 400);
        }
        
        // Get exchange rate settings for currency conversion
        const defaultExchangeRateSettings = {
          baseCurrency: 'USD' as 'USD',
          targetCurrency: 'JMD' as 'JMD',
          exchangeRate: 1,
          autoUpdate: false,
          lastUpdated: new Date().toISOString()
        };
        
        const exchangeRateSettings = (settings.exchangeRateSettings && 
          typeof settings.exchangeRateSettings === 'object' &&
          'baseCurrency' in settings.exchangeRateSettings)
          ? settings.exchangeRateSettings as any
          : defaultExchangeRateSettings;
        
        const displayCurrency = getDisplayCurrency(exchangeRateSettings);
        
        // Determine the source currency for additional charge (default to display currency if not specified)
        const sourceCurrency = validatedData.additionalChargeCurrency || displayCurrency;
        
        // Convert additional charge to display currency
        const originalAmount = validatedData.additionalCharge;
        const convertedAmount = convertCurrency(
          originalAmount,
          sourceCurrency,
          displayCurrency,
          exchangeRateSettings
        );
        
        // Create description with currency conversion info if converted
        let description = 'Additional Charge';
        if (sourceCurrency !== displayCurrency) {
          description += ` (${sourceCurrency} ${originalAmount.toFixed(2)} → ${displayCurrency})`;
        }
        
        // Add to preview calculations
        subtotal += convertedAmount;
        feeBreakdown.other += convertedAmount;
        
        // Add to line items for preview
        lineItems.push({
          packageId: null,
          description,
          quantity: 1,
          unitPrice: convertedAmount,
          lineTotal: convertedAmount,
          type: 'other',
        });
      }
      
      // Calculate total
      const totalAmount = subtotal + taxAmount;
      // Return the preview data, including fee breakdown (all numbers)
      return {
        userId: validatedData.userId,
        packageIds: validatedData.packageIds,
        subtotal: Number(subtotal) || 0,
        taxAmount: Number(taxAmount) || 0,
        totalAmount: Number(totalAmount) || 0,
        lineItems,
        feeBreakdown: {
          shipping: Number(feeBreakdown.shipping) || 0,
          handling: Number(feeBreakdown.handling) || 0,
          customs: Number(feeBreakdown.customs) || 0,
          other: Number(feeBreakdown.other) || 0,
          taxes: Number(feeBreakdown.taxes) || 0,
        },
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