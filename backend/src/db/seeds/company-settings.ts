import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { companySettings } from '../schema/company-settings';
import { companies } from '../schema/companies';
import logger from '../../utils/logger';

// Company-specific theme colors
interface ThemeColors {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

/**
 * Get company-specific theme colors
 */
function getCompanyThemeColors(subdomain: string): ThemeColors {
  const themeColors: { [key: string]: ThemeColors } = {
    'sparrow': {
      primaryColor: '#3b82f6',  // blue
      secondaryColor: '#10b981', // green
      accentColor: '#f59e0b',    // amber
    },
    'express': {
      primaryColor: '#ef4444',   // red
      secondaryColor: '#f97316', // orange
      accentColor: '#facc15',    // yellow
    },
    'shipitfast': {
      primaryColor: '#8b5cf6',   // purple
      secondaryColor: '#ec4899', // pink
      accentColor: '#14b8a6',    // teal
    },
    'jampack': {
      primaryColor: '#059669',   // emerald
      secondaryColor: '#0284c7', // sky blue
      accentColor: '#9333ea',    // violet
    }
  };
  
  return themeColors[subdomain] || themeColors['sparrow'];
}

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
    
    // Get company IDs and subdomains
    const companyRecords = await db.select({
      id: companies.id,
      subdomain: companies.subdomain,
      name: companies.name,
    }).from(companies);
    
    if (companyRecords.length === 0) {
      throw new Error('No companies found. Please seed companies first.');
    }
    
    // Create sample settings for each company
    for (const company of companyRecords) {
      // Get company-specific theme colors
      const themeColors = getCompanyThemeColors(company.subdomain);
      
      // Slightly vary rates for each company
      const baseRateVariation = parseFloat((Math.random() * 2 - 1).toFixed(2)); // -1 to +1
      const weightRateVariation = parseFloat((Math.random() * 0.5 - 0.25).toFixed(2)); // -0.25 to +0.25
      
      await db.insert(companySettings).values({
        companyId: company.id,
        shippingRates: {
          baseRate: 10.00 + baseRateVariation,
          weightRate: 2.50 + weightRateVariation, // per pound
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
          smsNotifications: company.subdomain === 'express' || company.subdomain === 'shipitfast', // Only enabled for some companies
          emailTypes: ['package_received', 'invoice_created', 'payment_received'],
        },
        themeSettings: {
          primaryColor: themeColors.primaryColor,
          secondaryColor: themeColors.secondaryColor,
          accentColor: themeColors.accentColor,
          fontFamily: 'Inter, sans-serif',
        },
      });
      
      logger.info(`Settings created for ${company.name}`);
    }
    
    logger.info('Company settings seeded successfully');
  } catch (error) {
    logger.error(error, 'Error seeding company settings');
    throw error;
  }
} 