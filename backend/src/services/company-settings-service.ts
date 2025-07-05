import { BaseService } from './base-service';
import { CompanySettingsRepository } from '../repositories/company-settings-repository';
import { companySettings } from '../db/schema/company-settings';
import { z } from 'zod';
import { CompaniesService } from './companies-service';
import crypto from 'crypto';
import { db } from '../db';

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
  magayaIntegration: z.object({
    enabled: z.boolean().default(false),
    username: z.string().optional(),
    password: z.string().optional(),
    networkId: z.string().optional(),
    dateRangePreference: z.enum(['today', 'this_week', 'this_month']).default('this_week'),
    autoImportEnabled: z.boolean().default(false),
    lastImportDate: z.string().optional(),
    cronEnabled: z.boolean().optional(),
    cronInterval: z.number().int().optional(),
  }).optional(),
});

// Define validation schema for exchange rate settings
const exchangeRateSettingsSchema = z.object({
  baseCurrency: z.enum(['USD', 'JMD']),
  targetCurrency: z.enum(['USD', 'JMD']),
  exchangeRate: z.number().positive(),
  lastUpdated: z.string().optional(),
  autoUpdate: z.boolean().default(false),
});

// Define validation schema for all settings
const companySettingsSchema = z.object({
  internalPrefix: z.string().min(2).max(5).optional(),
  notificationSettings: notificationSettingsSchema.optional(),
  themeSettings: themeSettingsSchema.optional(),
  paymentSettings: paymentSettingsSchema.optional(),
  integrationSettings: integrationSettingsSchema.optional(),
  exchangeRateSettings: exchangeRateSettingsSchema.optional(),
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
    try {
      // Validate integration settings
      const validatedData = integrationSettingsSchema.parse(data);
      
      console.log('Updating integration settings:', JSON.stringify(validatedData, null, 2));
      
      // Update integration settings
      return this.companySettingsRepository.updateIntegrationSettings(companyId, validatedData);
    } catch (error) {
      console.error('Error validating integration settings:', error);
      throw error;
    }
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

  /**
   * Get all company settings with integration settings for all companies
   */
  async getAllCompanySettings() {
    try {
      const result = await db.select().from(companySettings);
      return result;
    } catch (error) {
      console.error('Error getting all company settings:', error);
      throw error;
    }
  }

  /**
   * Update internal prefix for a company
   */
  async updateInternalPrefix(companyId: string, internalPrefix: string) {
    // Validate prefix (2-5 characters)
    if (!internalPrefix || internalPrefix.length < 2 || internalPrefix.length > 5) {
      throw new Error('Internal prefix must be between 2 and 5 characters');
    }
    
    // Get existing settings
    const settings = await this.companySettingsRepository.findByCompanyId(companyId);
    
    if (!settings) {
      // Create new settings with the prefix
      return this.companySettingsRepository.create({
        companyId,
        internalPrefix,
      }, companyId);
    }
    
    // Update existing settings
    return this.companySettingsRepository.update(settings.id, {
      internalPrefix,
      updatedAt: new Date(),
    }, companyId);
  }

  /**
   * Update exchange rate settings for a company
   */
  async updateExchangeRateSettings(companyId: string, exchangeRateSettings: any) {
    // Validate exchange rate settings
    const validatedData = exchangeRateSettingsSchema.parse(exchangeRateSettings);
    
    // Additional validation: base and target currencies must be different
    if (validatedData.baseCurrency === validatedData.targetCurrency) {
      throw new Error('Base currency and target currency must be different');
    }
    
    // Update exchange rate settings
    return this.companySettingsRepository.updateExchangeRateSettings(companyId, validatedData);
  }
} 