import { BaseService } from './base-service';
import { CompanySettingsRepository } from '../repositories/company-settings-repository';
import { companySettings } from '../db/schema/company-settings';
import { z } from 'zod';

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

// Define validation schema for payment settings
const paymentSettingsSchema = z.object({
  wipay: z.object({
    enabled: z.boolean(),
    accountNumber: z.string().optional(),
    apiKey: z.string().optional(),
    environment: z.enum(['sandbox', 'live']).optional(),
    countryCode: z.string().optional(),
    currency: z.string().optional(),
    feeStructure: z.enum(['customer_pay', 'merchant_absorb', 'split']).optional(),
  }),
});

// Define validation schema for all settings
const companySettingsSchema = z.object({
  notificationSettings: notificationSettingsSchema.optional(),
  themeSettings: themeSettingsSchema.optional(),
  paymentSettings: paymentSettingsSchema.optional(),
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
        notificationSettings: {},
        themeSettings: {},
        paymentSettings: {},
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
   * Get payment settings
   */
  async getPaymentSettings(companyId: string) {
    const settings = await this.companySettingsRepository.findByCompanyId(companyId);
    
    if (!settings || !settings.paymentSettings) {
      // Return default payment settings if none exist
      return {
        wipay: {
          enabled: false,
          environment: 'sandbox',
          feeStructure: 'customer_pay',
        }
      };
    }
    
    return settings.paymentSettings;
  }

  /**
   * Update payment settings
   */
  async updatePaymentSettings(data: any, companyId: string) {
    // Validate payment settings
    const validatedData = paymentSettingsSchema.parse(data);
    
    // Update payment settings
    return this.companySettingsRepository.updatePaymentSettings(companyId, validatedData);
  }
} 