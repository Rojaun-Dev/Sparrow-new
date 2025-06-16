import { BaseService } from './base-service';
import { CompanySettingsRepository } from '../repositories/company-settings-repository';
import { companySettings } from '../db/schema/company-settings';
import { z } from 'zod';
import { CompaniesService } from './companies-service';
import crypto from 'crypto';

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

// Define validation schema for integration settings
const integrationSettingsSchema = z.object({
  apiKey: z.string().optional(),
  allowedOrigins: z.array(z.string()).optional(),
  redirectIntegration: z.object({
    enabled: z.boolean().default(false),
    allowedDomains: z.array(z.string()).optional(),
  }).optional(),
  iframeIntegration: z.object({
    enabled: z.boolean().default(false),
    iframeCode: z.string().optional(),
    allowedDomains: z.array(z.string()).optional(),
  }).optional(),
});

// Define validation schema for all settings
const companySettingsSchema = z.object({
  notificationSettings: notificationSettingsSchema.optional(),
  themeSettings: themeSettingsSchema.optional(),
  paymentSettings: paymentSettingsSchema.optional(),
  integrationSettings: integrationSettingsSchema.optional(),
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
        internalPrefix: 'SPX',
        notificationSettings: {},
        themeSettings: {},
        paymentSettings: {},
        integrationSettings: {},
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

  /**
   * Get integration settings
   */
  async getIntegrationSettings(companyId: string) {
    const settings = await this.companySettingsRepository.findByCompanyId(companyId);
    
    if (!settings || !settings.integrationSettings) {
      // Return default integration settings if none exist
      return {
        redirectIntegration: {
          enabled: false,
          allowedDomains: [],
        },
        iframeIntegration: {
          enabled: false,
          allowedDomains: [],
        },
        apiKey: '',
        allowedOrigins: [],
      };
    }
    
    return settings.integrationSettings;
  }

  /**
   * Update integration settings
   */
  async updateIntegrationSettings(data: any, companyId: string) {
    // Validate integration settings
    const validatedData = integrationSettingsSchema.parse(data);
    
    // Update integration settings
    return this.companySettingsRepository.updateIntegrationSettings(companyId, validatedData);
  }
  
  /**
   * Generate API key for company
   */
  async generateApiKey(companyId: string) {
    // Generate a cryptographically secure random API key
    // Use crypto.randomBytes for better security than Math.random
    const buffer = crypto.randomBytes(32);
    const apiKey = 'spx_' + buffer.toString('hex');
    
    // Get existing integration settings
    const settings = await this.getIntegrationSettings(companyId);
    
    // Update with new API key
    const updatedSettings = {
      ...settings,
      apiKey
    };
    
    // Save updated settings
    await this.updateIntegrationSettings(updatedSettings, companyId);
    
    return apiKey;
  }

  /**
   * Find company by API key
   * Used for authenticating API requests and iframe integration
   */
  async findCompanyByApiKey(apiKey: string) {
    // Find settings record with matching API key
    const settings = await this.companySettingsRepository.findByApiKey(apiKey);
    
    if (!settings) {
      return null;
    }
    
    // Get company details
    const companiesService = new CompaniesService();
    
    try {
      const company = await companiesService.getCompanyById(settings.companyId);
      
      // Return settings with company info
      return {
        ...settings,
        company
      };
    } catch (error) {
      console.error(`Error fetching company for API key: ${error}`);
      return null;
    }
  }
} 