import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { companySettings } from '../schema/company-settings';
import { companies } from '../schema/companies';
import logger from '../../utils/logger';

/**
 * Seed company settings table with initial data
 */
export async function seedCompanySettings(db: NodePgDatabase<any>) {
  try {
    logger.info('Seeding company settings...');
    
    // Check if company settings already exist to avoid duplicates
    const existingSettings = await db.select().from(companySettings);
    
    if (existingSettings.length > 0) {
      logger.info(`Found ${existingSettings.length} existing company settings, skipping seed`);
      return;
    }
    
    // Get company IDs
    const companyRecords = await db.select({
      id: companies.id,
    }).from(companies);
    
    if (companyRecords.length === 0) {
      throw new Error('No companies found. Please seed companies first.');
    }
    
    // Create sample settings for each company
    for (const company of companyRecords) {
      await db.insert(companySettings).values({
        companyId: company.id,
        shippingRates: {
          baseRate: 10.00,
          weightRate: 2.50, // per pound
          dimensionalDivisor: 139,
          minimumCharge: 15.00,
        },
        handlingFees: {
          baseCharge: 5.00,
          overweightCharge: 10.00, // for packages over 50 lbs
          overweightThreshold: 50,
        },
        customsFees: {
          percentage: 15.00, // 15% of declared value
          minimumCharge: 10.00,
        },
        taxRates: {
          generalConsumptionTax: 15.00,
          customsDuty: 20.00,
        },
        notificationSettings: {
          emailNotifications: true,
          smsNotifications: false,
          emailTypes: ['package_received', 'invoice_created', 'payment_received'],
        },
        themeSettings: {
          primaryColor: '#3b82f6',
          secondaryColor: '#10b981',
          accentColor: '#f59e0b',
          fontFamily: 'Inter, sans-serif',
        },
      });
    }
    
    logger.info('Company settings seeded successfully');
  } catch (error) {
    logger.error(error, 'Error seeding company settings');
    throw error;
  }
} 