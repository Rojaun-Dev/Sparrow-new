import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { companies } from '../schema/companies';
import logger from '../../utils/logger';

/**
 * Seed companies table with initial data
 */
export async function seedCompanies(db: NodePgDatabase<any>) {
  try {
    logger.info('Seeding companies...');
    
    // Check if companies already exist to avoid duplicates
    const existingCompanies = await db.select().from(companies);
    
    if (existingCompanies.length > 0) {
      logger.info(`Found ${existingCompanies.length} existing companies, skipping seed`);
      return;
    }
    
    // Create sample companies
    await db.insert(companies).values([
      {
        name: 'Package Express',
        subdomain: 'express',
        images: { logo: 'https://example.com/logo-express.png' },
        address: '123 Shipping Lane, Kingston, Jamaica',
        phone: '+1-876-555-0100',
        locations: ['Kingston', 'Montego Bay'],
        email: 'info@packageexpress.com',
        website: 'https://packageexpress.com',
        bankInfo: 'Bank of Jamaica, Acct #: 12345678',
      },
      {
        name: 'ShipItFast',
        subdomain: 'shipitfast',
        images: { logo: 'https://example.com/logo-shipitfast.png' },
        address: '45 Delivery Road, Ocho Rios, Jamaica',
        phone: '+1-876-555-0200',
        locations: ['Ocho Rios', 'Negril'],
        email: 'contact@shipitfast.com',
        website: 'https://shipitfast.com',
        bankInfo: 'Jamaica National Bank, Acct #: 87654321',
      },
      {
        name: 'JamPack',
        subdomain: 'jampack',
        images: { logo: 'https://example.com/logo-jampack.png' },
        address: '78 Parcel Street, Spanish Town, Jamaica',
        phone: '+1-876-555-0300',
        locations: ['Spanish Town', 'Portmore'],
        email: 'support@jampack.com',
        website: 'https://jampack.com',
        bankInfo: 'Scotiabank Jamaica, Acct #: 55556666',
      }
    ]);
    
    logger.info('Companies seeded successfully');
  } catch (error) {
    logger.error(error, 'Error seeding companies');
    throw error;
  }
} 