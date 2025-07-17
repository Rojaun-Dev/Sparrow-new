import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { database, server } from '../config';
import logger from '../utils/logger';

// Import seed functions
import { seedCompanies } from './seeds/companies';
import { seedUsers, seedProductionSuperAdmin } from './seeds/users';
import { seedCompanySettings } from './seeds/company-settings';
import { seedFees } from './seeds/fees';
import { seedPackages } from './seeds/packages';
import { seedPreAlerts } from './seeds/pre-alerts';
import { seedInvoices } from './seeds/invoices';
import { seedPayments } from './seeds/payments';

/**
 * Seed the database with production-only data (superadmin only)
 */
async function seedProductionDatabase() {
  logger.info('Seeding database with production data (superadmin only)...');
  
  // Create a PostgreSQL connection
  const pool = new Pool({
    host: database.host,
    port: database.port,
    database: database.name,
    user: database.user,
    password: database.password,
    connectionString: database.connectionString,
    ssl: {
      rejectUnauthorized: false, // Necessary for Render's SSL
    },
  });
  
  const db = drizzle(pool);
  
  try {
    // For production, only seed the superadmin user
    await seedProductionSuperAdmin(db);
    logger.info('Production superadmin seeded successfully');
    
    logger.info('Production database seeding completed successfully');
  } catch (error) {
    logger.error(error, 'Error during production database seeding');
    process.exit(1);
  }
  
  // Close the pool
  await pool.end();
}

/**
 * Seed the database with full development data
 */
async function seedDevelopmentDatabase() {
  logger.info('Seeding database with development data...');
  
  // Create a PostgreSQL connection
  const pool = new Pool({
    host: database.host,
    port: database.port,
    database: database.name,
    user: database.user,
    password: database.password,
    connectionString: database.connectionString,
    ssl: {
      rejectUnauthorized: false, // Necessary for Render's SSL
    },
  });
  
  const db = drizzle(pool);
  
  try {
    // Run seed functions in order
    // Companies need to be seeded first as they are referenced by other entities
    await seedCompanies(db);
    logger.info('Companies seeded successfully');
    
    // Users depend on companies
    await seedUsers(db);
    logger.info('Users seeded successfully');
    
    // Company settings depend on companies
    await seedCompanySettings(db);
    logger.info('Company settings seeded successfully');
    
    // Fees depend on companies
    await seedFees(db);
    logger.info('Fees seeded successfully');
    
    // Packages depend on companies and users
    await seedPackages(db);
    logger.info('Packages seeded successfully');
    
    // Pre-alerts depend on companies and users
    await seedPreAlerts(db);
    logger.info('Pre-alerts seeded successfully');
    
    // Invoices depend on companies, users, and packages
    await seedInvoices(db);
    logger.info('Invoices seeded successfully');
    
    // Payments depend on companies, users, and invoices
    await seedPayments(db);
    logger.info('Payments seeded successfully');
    
    logger.info('Development database seeding completed successfully');
  } catch (error) {
    logger.error(error, 'Error during development database seeding');
    process.exit(1);
  }
  
  // Close the pool
  await pool.end();
}

/**
 * Main seeding function that chooses between production and development seeding
 */
async function seedDatabase() {
  logger.info(`Environment: ${server.env}`);
  
  if (server.isProd) {
    logger.info('Production environment detected - seeding superadmin only');
    await seedProductionDatabase();
  } else {
    logger.info('Development environment detected - seeding full test data');
    await seedDevelopmentDatabase();
  }
}

// Run seeding when script is executed directly
if (require.main === module) {
  seedDatabase().catch((err) => {
    logger.error(err, 'Database seeding failed');
    process.exit(1);
  });
}

export { seedDatabase }; 