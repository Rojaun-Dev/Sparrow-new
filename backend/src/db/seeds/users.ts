import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { users } from '../schema/users';
import { companies } from '../schema/companies';
import { companySettings as companySettingsSchema } from '../schema/company-settings';
import logger from '../../utils/logger';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { or, eq } from 'drizzle-orm';

// Load environment variables
dotenv.config();

/**
 * Hash a password using bcrypt
 */
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Generate a unique 4-digit internal ID
 */
function generateInternalId(existingIds: Set<string>): string {
  let internalId: string;
  do {
    // Generate a random 4-digit number
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    internalId = randomNum.toString();
  } while (existingIds.has(internalId));
  
  return internalId;
}

/**
 * Format a prefId based on company prefix and internal ID
 */
function formatPrefId(prefix: string, internalId: string): string {
  return `${prefix}-${internalId}`;
}

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
    
    // Get company IDs from database
    const companyRecords = await db.select({
      id: companies.id,
      subdomain: companies.subdomain
    }).from(companies);

    // Set for tracking used internalIds to ensure uniqueness
    const usedInternalIds = new Set<string>();
    
    // Map company subdomains to their IDs for easy lookup
    const companyMap = new Map<string, string>();
    for (const company of companyRecords) {
      companyMap.set(company.subdomain, company.id);
    }
    
    // Get Sparrow company ID for super admin
    const sparrowCompanyId = companyMap.get('sparrowx') || companyRecords[0].id;

    // Get company settings to access prefixes
    const settingsRecords = await db.select()
      .from(companySettingsSchema)
      .where(
        or(
          ...companyRecords.map(company => eq(companySettingsSchema.companyId, company.id))
        )
      );

    // Map company IDs to their prefixes
    const companyPrefixes = new Map<string, string>();
    for (const setting of settingsRecords) {
      companyPrefixes.set(setting.companyId, setting.internalPrefix || 'SPX');
    }
    
    // Default prefix if not found
    const getCompanyPrefix = (companyId: string) => companyPrefixes.get(companyId) || 'SPX';
    
    // User credentials for testing
    const superAdminEmail = 'super@cautious-robot.com';
    const superAdminPassword = 'Admin123!';
    const superAdminHash = await hashPassword(superAdminPassword);
    const superAdminAuthId = 'auth0|super-admin';
    const superAdminPhone = '+1-876-555-0000';
    
    // Generate internalId and prefId for super admin
    const superAdminInternalId = generateInternalId(usedInternalIds);
    usedInternalIds.add(superAdminInternalId);
    const superAdminPrefId = formatPrefId(getCompanyPrefix(sparrowCompanyId), superAdminInternalId);
    
    // Add super admin user
    await db.insert(users).values({
      companyId: sparrowCompanyId,
      email: superAdminEmail,
      firstName: 'dev00',
      lastName: 'Admin',
      role: 'super_admin',
      auth0Id: superAdminAuthId,
      phone: superAdminPhone,
      address: 'Sparrow HQ Address',
      passwordHash: superAdminHash,
      internalId: superAdminInternalId,
      prefId: superAdminPrefId,
    });
    
    // Create sample users for each company
    for (const [subdomain, companyId] of companyMap.entries()) {
      // Get company prefix
      const companyPrefix = getCompanyPrefix(companyId);
      
      // Admin L2 
      const adminPassword = 'Admin123!';
      const adminHash = await hashPassword(adminPassword);
      
      // Generate internalId and prefId for admin
      const adminInternalId = generateInternalId(usedInternalIds);
      usedInternalIds.add(adminInternalId);
      const adminPrefId = formatPrefId(companyPrefix, adminInternalId);
      
      await db.insert(users).values({
        companyId,
        email: `admin@${subdomain}.com`,
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin_l2',
        auth0Id: `auth0|admin-${subdomain}`,
        phone: '+1-876-555-1000',
        address: 'Admin Address',
        passwordHash: adminHash,
        internalId: adminInternalId,
        prefId: adminPrefId,
      });
      
      // Admin L1
      const staffPassword = 'Staff123!';
      const staffHash = await hashPassword(staffPassword);
      
      // Generate internalId and prefId for staff
      const staffInternalId = generateInternalId(usedInternalIds);
      usedInternalIds.add(staffInternalId);
      const staffPrefId = formatPrefId(companyPrefix, staffInternalId);
      
      await db.insert(users).values({
        companyId,
        email: `staff@${subdomain}.com`,
        firstName: 'Staff',
        lastName: 'User',
        role: 'admin_l1',
        auth0Id: `auth0|staff-${subdomain}`,
        phone: '+1-876-555-2000',
        address: 'Staff Address',
        passwordHash: staffHash,
        internalId: staffInternalId,
        prefId: staffPrefId,
      });
      
      // Create 11–17 customers per company
      const customerIds: string[] = [];
      const numCustomers = Math.floor(Math.random() * 7) + 11;
      for (let i = 1; i <= numCustomers; i++) {
        const customerPassword = `Customer${i}123!`;
        const customerHash = await hashPassword(customerPassword);
        
        // Generate internalId and prefId for customer
        const customerInternalId = generateInternalId(usedInternalIds);
        usedInternalIds.add(customerInternalId);
        const customerPrefId = formatPrefId(companyPrefix, customerInternalId);
        
        const result = await db.insert(users).values({
          companyId,
          email: `customer${i}@${subdomain}.com`,
          firstName: `Customer${i}`,
          lastName: `User`,
          role: 'customer',
          auth0Id: `auth0|customer${i}-${subdomain}`,
          phone: `+1-876-555-${3000 + i}`,
          address: `Customer ${i} Address, Jamaica`,
          passwordHash: customerHash,
          internalId: customerInternalId,
          prefId: customerPrefId,
        }).returning({ id: users.id });
        customerIds.push(result[0].id);
      }
    }
    
    logger.info('Users seeded successfully');
    logger.info('Default passwords created:');
    logger.info('- Super Admin: SuperAdmin123!');
    logger.info('- Admin L2: Admin123!');
    logger.info('- Admin L1: Staff123!');
    logger.info('- Customers: Customer1123!, Customer2123!, etc.');
    logger.info('NOTE: In production, ensure all passwords are securely generated and stored.');
  } catch (error) {
    logger.error(error, 'Error seeding users');
    throw error;
  }
} 