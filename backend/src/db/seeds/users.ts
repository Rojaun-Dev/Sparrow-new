import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { users } from '../schema/users';
import { companies } from '../schema/companies';
import logger from '../../utils/logger';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Seed users table with initial data
 */
export async function seedUsers(db: NodePgDatabase<any>) {
  try {
    logger.info('Seeding users...');
    
    // Check if users already exist to avoid duplicates
    const existingUsers = await db.select().from(users);
    
    if (existingUsers.length > 0) {
      logger.info(`Found ${existingUsers.length} existing users, skipping seed`);
      return;
    }
    
    // Get company IDs
    const companyRecords = await db.select({
      id: companies.id,
      subdomain: companies.subdomain,
    }).from(companies);
    
    if (companyRecords.length === 0) {
      throw new Error('No companies found. Please seed companies first.');
    }
    
    // Map companies by subdomain for easier lookup
    const companyMap = new Map();
    companyRecords.forEach(company => {
      companyMap.set(company.subdomain, company.id);
    });
    
    // Create a super admin for Sparrow platform
    // Use environment variables for dev/test credentials
    const superAdminEmail = process.env.DEV_EMAIL || 'super.admin@sparrowx.com';
    const superAdminAuthId = process.env.DEV_AUTH0_ID || 'auth0|super-admin-sparrow';
    const superAdminPhone = process.env.DEV_PHONE || '+1-876-555-0000';
    
    // Get the ID of the first company (assuming this is the Sparrow company)
    // Or you could add a specific "sparrow" company in companies.ts
    const firstCompanyId = companyRecords[0].id;
    
    // Add super admin user
    await db.insert(users).values({
      companyId: firstCompanyId,
      email: superAdminEmail,
      firstName: 'dev00',
      lastName: 'Admin',
      role: 'super_admin',
      auth0Id: superAdminAuthId,
      phone: superAdminPhone,
      address: 'Sparrow HQ Address',
    });
    
    // Create sample users for each company
    for (const [subdomain, companyId] of companyMap.entries()) {
      // Admin L2 
      await db.insert(users).values({
        companyId,
        email: `admin@${subdomain}.com`,
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin_l2',
        auth0Id: `auth0|admin-${subdomain}`,
        phone: '+1-876-555-1000',
        address: 'Admin Address',
      });
      
      // Admin L1
      await db.insert(users).values({
        companyId,
        email: `staff@${subdomain}.com`,
        firstName: 'Staff',
        lastName: 'User',
        role: 'admin_l1',
        auth0Id: `auth0|staff-${subdomain}`,
        phone: '+1-876-555-2000',
        address: 'Staff Address',
      });
      
      // Create 3 customers per company
      for (let i = 1; i <= 3; i++) {
        await db.insert(users).values({
          companyId,
          email: `customer${i}@${subdomain}.com`,
          firstName: `Customer${i}`,
          lastName: 'User',
          role: 'customer',
          auth0Id: `auth0|customer${i}-${subdomain}`,
          phone: `+1-876-555-${3000 + i}`,
          address: `Customer ${i} Address, Jamaica`,
        });
      }
    }
    
    logger.info('Users seeded successfully');
  } catch (error) {
    logger.error(error, 'Error seeding users');
    throw error;
  }
} 