import { eq } from 'drizzle-orm';
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
   * Update shipping rates for a company
   */
  async updateShippingRates(companyId: string, shippingRates: any) {
    const settings = await this.findByCompanyId(companyId);
    
    if (!settings) {
      // Create new settings with shipping rates
      return this.create({
        shippingRates,
      }, companyId);
    }
    
    // Update existing settings
    return this.update(settings.id, {
      shippingRates,
      updatedAt: new Date(),
    }, companyId);
  }

  /**
   * Update handling fees for a company
   */
  async updateHandlingFees(companyId: string, handlingFees: any) {
    const settings = await this.findByCompanyId(companyId);
    
    if (!settings) {
      // Create new settings with handling fees
      return this.create({
        handlingFees,
      }, companyId);
    }
    
    // Update existing settings
    return this.update(settings.id, {
      handlingFees,
      updatedAt: new Date(),
    }, companyId);
  }

  /**
   * Update customs fees for a company
   */
  async updateCustomsFees(companyId: string, customsFees: any) {
    const settings = await this.findByCompanyId(companyId);
    
    if (!settings) {
      // Create new settings with customs fees
      return this.create({
        customsFees,
      }, companyId);
    }
    
    // Update existing settings
    return this.update(settings.id, {
      customsFees,
      updatedAt: new Date(),
    }, companyId);
  }

  /**
   * Update tax rates for a company
   */
  async updateTaxRates(companyId: string, taxRates: any) {
    const settings = await this.findByCompanyId(companyId);
    
    if (!settings) {
      // Create new settings with tax rates
      return this.create({
        taxRates,
      }, companyId);
    }
    
    // Update existing settings
    return this.update(settings.id, {
      taxRates,
      updatedAt: new Date(),
    }, companyId);
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
} 