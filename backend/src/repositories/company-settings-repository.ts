import { eq, sql } from 'drizzle-orm';
import { BaseRepository } from './base-repository';
import { companySettings } from '../db/schema/company-settings';

export class CompanySettingsRepository extends BaseRepository<typeof companySettings> {
  constructor() {
    super(companySettings);
  }

  /**
   * Find settings by company ID
   */
  async findByCompanyId(companyId: string) {
    const result = await this.db
      .select()
      .from(companySettings)
      .where(eq(companySettings.companyId, companyId))
      .limit(1);
    
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Create or update company settings
   * Since there's a unique constraint on company_id, we'll use upsert
   */
  async upsertSettings(data: any, companyId: string) {
    // Check if settings exist for this company
    const existingSettings = await this.findByCompanyId(companyId);
    
    if (existingSettings) {
      // Update existing settings
      return this.update(existingSettings.id, data, companyId);
    } else {
      // Create new settings
      return this.create(data, companyId);
    }
  }

  /**
   * Update notification settings for a company
   */
  async updateNotificationSettings(companyId: string, notificationSettings: any) {
    const settings = await this.findByCompanyId(companyId);
    
    if (!settings) {
      // Create new settings with notification settings
      return this.create({
        notificationSettings,
      }, companyId);
    }
    
    // Update existing settings
    return this.update(settings.id, {
      notificationSettings,
      updatedAt: new Date(),
    }, companyId);
  }

  /**
   * Update theme settings for a company
   */
  async updateThemeSettings(companyId: string, themeSettings: any) {
    const settings = await this.findByCompanyId(companyId);
    
    if (!settings) {
      // Create new settings with theme settings
      return this.create({
        themeSettings,
      }, companyId);
    }
    
    // Update existing settings
    return this.update(settings.id, {
      themeSettings,
      updatedAt: new Date(),
    }, companyId);
  }

  /**
   * Update payment settings for a company
   */
  async updatePaymentSettings(companyId: string, paymentSettings: any) {
    const settings = await this.findByCompanyId(companyId);
    
    if (!settings) {
      // Create new settings with payment settings
      return this.create({
        paymentSettings,
      }, companyId);
    }
    
    // Update existing settings
    return this.update(settings.id, {
      paymentSettings,
      updatedAt: new Date(),
    }, companyId);
  }

  /**
   * Update integration settings for a company
   */
  async updateIntegrationSettings(companyId: string, integrationSettings: any) {
    const settings = await this.findByCompanyId(companyId);
    
    if (!settings) {
      // Create new settings with integration settings
      return this.create({
        integrationSettings,
      }, companyId);
    }
    
    // Update existing settings
    return this.update(settings.id, {
      integrationSettings,
      updatedAt: new Date(),
    }, companyId);
  }

  /**
   * Find settings by API key
   */
  async findByApiKey(apiKey: string) {
    // Need to JSON stringify the API key to match how it's stored in the JSON field
    const result = await this.db
      .select()
      .from(companySettings)
      .where(
        sql`integration_settings->>'apiKey' = ${apiKey}`
      )
      .limit(1);
    
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Update exchange rate settings for a company
   */
  async updateExchangeRateSettings(companyId: string, exchangeRateSettings: any) {
    const settings = await this.findByCompanyId(companyId);
    
    if (!settings) {
      // Create new settings with exchange rate settings
      return this.create({
        exchangeRateSettings,
      }, companyId);
    }
    
    // Update existing settings
    return this.update(settings.id, {
      exchangeRateSettings,
      updatedAt: new Date(),
    }, companyId);
  }
} 