import { BaseService } from './base-service';
import { CompanySettingsRepository } from '../repositories/company-settings-repository';
import { companySettings } from '../db/schema/company-settings';
import { z } from 'zod';

// Define validation schema for shipping rates
const shippingRatesSchema = z.object({
  baseRate: z.number().min(0),
  weightMultiplier: z.number().min(0),
  expressShippingMultiplier: z.number().min(1).optional(),
  discountThresholds: z.array(
    z.object({
      threshold: z.number().min(0),
      discount: z.number().min(0).max(100),
    })
  ).optional(),
  locations: z.record(z.string(), z.number().min(0)).optional(),
});

// Define validation schema for handling fees
const handlingFeesSchema = z.object({
  baseRate: z.number().min(0),
  percentageValue: z.number().min(0).max(100).optional(),
  specialItemsFee: z.record(z.string(), z.number().min(0)).optional(),
});

// Define validation schema for customs fees
const customsFeesSchema = z.object({
  percentageValue: z.number().min(0).max(100),
  minimumFee: z.number().min(0).optional(),
  specialCategoriesFees: z.record(z.string(), z.number().min(0)).optional(),
});

// Define validation schema for tax rates
const taxRatesSchema = z.object({
  standardRate: z.number().min(0).max(100),
  reducedRates: z.record(z.string(), z.number().min(0).max(100)).optional(),
  exemptCategories: z.array(z.string()).optional(),
});

// Define validation schema for notification settings
const notificationSettingsSchema = z.object({
  email: z.object({
    enabled: z.boolean(),
    events: z.record(z.string(), z.boolean()).optional(),
  }),
  sms: z.object({
    enabled: z.boolean(),
    events: z.record(z.string(), z.boolean()).optional(),
  }).optional(),
  webNotifications: z.object({
    enabled: z.boolean(),
    events: z.record(z.string(), z.boolean()).optional(),
  }).optional(),
});

// Define validation schema for theme settings
const themeSettingsSchema = z.object({
  primaryColor: z.string(),
  secondaryColor: z.string().optional(),
  accentColor: z.string().optional(),
  fontFamily: z.string().optional(),
  logo: z.string().optional(),
  darkMode: z.boolean().optional(),
  customCss: z.string().optional(),
});

// Define validation schema for all settings
const companySettingsSchema = z.object({
  shippingRates: shippingRatesSchema.optional(),
  handlingFees: handlingFeesSchema.optional(),
  customsFees: customsFeesSchema.optional(),
  taxRates: taxRatesSchema.optional(),
  notificationSettings: notificationSettingsSchema.optional(),
  themeSettings: themeSettingsSchema.optional(),
});

export class CompanySettingsService extends BaseService<typeof companySettings> {
  private companySettingsRepository: CompanySettingsRepository;

  constructor() {
    const repository = new CompanySettingsRepository();
    super(repository);
    this.companySettingsRepository = repository;
  }

  /**
   * Get settings for a specific company
   */
  async getCompanySettings(companyId: string) {
    const settings = await this.companySettingsRepository.findByCompanyId(companyId);
    
    if (!settings) {
      // Return default settings if none exist
      return {
        shippingRates: {},
        handlingFees: {},
        customsFees: {},
        taxRates: {},
        notificationSettings: {},
        themeSettings: {},
      };
    }
    
    return settings;
  }

  /**
   * Update all company settings
   */
  async updateCompanySettings(data: any, companyId: string) {
    // Validate settings data
    const validatedData = companySettingsSchema.parse(data);
    
    // Update settings
    return this.companySettingsRepository.upsertSettings(validatedData, companyId);
  }

  /**
   * Update shipping rates
   */
  async updateShippingRates(data: any, companyId: string) {
    // Validate shipping rates
    const validatedData = shippingRatesSchema.parse(data);
    
    // Update shipping rates
    return this.companySettingsRepository.updateShippingRates(companyId, validatedData);
  }

  /**
   * Update handling fees
   */
  async updateHandlingFees(data: any, companyId: string) {
    // Validate handling fees
    const validatedData = handlingFeesSchema.parse(data);
    
    // Update handling fees
    return this.companySettingsRepository.updateHandlingFees(companyId, validatedData);
  }

  /**
   * Update customs fees
   */
  async updateCustomsFees(data: any, companyId: string) {
    // Validate customs fees
    const validatedData = customsFeesSchema.parse(data);
    
    // Update customs fees
    return this.companySettingsRepository.updateCustomsFees(companyId, validatedData);
  }

  /**
   * Update tax rates
   */
  async updateTaxRates(data: any, companyId: string) {
    // Validate tax rates
    const validatedData = taxRatesSchema.parse(data);
    
    // Update tax rates
    return this.companySettingsRepository.updateTaxRates(companyId, validatedData);
  }

  /**
   * Update notification settings
   */
  async updateNotificationSettings(data: any, companyId: string) {
    // Validate notification settings
    const validatedData = notificationSettingsSchema.parse(data);
    
    // Update notification settings
    return this.companySettingsRepository.updateNotificationSettings(companyId, validatedData);
  }

  /**
   * Update theme settings
   */
  async updateThemeSettings(data: any, companyId: string) {
    // Validate theme settings
    const validatedData = themeSettingsSchema.parse(data);
    
    // Update theme settings
    return this.companySettingsRepository.updateThemeSettings(companyId, validatedData);
  }

  /**
   * Calculate shipping cost based on package details
   */
  async calculateShippingCost(
    companyId: string,
    weight: number,
    expressShipping: boolean = false,
    location: string = 'default'
  ) {
    const settings = await this.getCompanySettings(companyId);
    const shippingRates = settings.shippingRates as any;
    
    if (!shippingRates || Object.keys(shippingRates).length === 0) {
      throw new Error('Shipping rates not configured');
    }
    
    let baseRate = shippingRates.baseRate || 0;
    const weightMultiplier = shippingRates.weightMultiplier || 0;
    
    // Apply location-specific rates if available
    if (shippingRates.locations && shippingRates.locations[location]) {
      baseRate = shippingRates.locations[location];
    }
    
    // Calculate base cost
    let cost = baseRate + (weight * weightMultiplier);
    
    // Apply express shipping multiplier if needed
    if (expressShipping && shippingRates.expressShippingMultiplier) {
      cost *= shippingRates.expressShippingMultiplier;
    }
    
    // Apply discount thresholds if available
    if (shippingRates.discountThresholds) {
      // Sort thresholds in descending order to apply highest applicable discount
      const sortedThresholds = [...shippingRates.discountThresholds].sort(
        (a, b) => b.threshold - a.threshold
      );
      
      // Find applicable discount
      const applicableDiscount = sortedThresholds.find(t => weight >= t.threshold);
      
      if (applicableDiscount) {
        cost *= (1 - (applicableDiscount.discount / 100));
      }
    }
    
    return Math.max(0, cost); // Ensure cost is not negative
  }
} 