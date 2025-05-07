import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { database } from '../config';
import logger from '../utils/logger';

// Import seed functions
import { seedCompanies } from './seeds/companies';
import { seedUsers } from './seeds/users';
import { seedCompanySettings } from './seeds/company-settings';
import { seedPackages } from './seeds/packages';
import { seedPreAlerts } from './seeds/pre-alerts';
import { seedInvoices } from './seeds/invoices';
import { seedPayments } from './seeds/payments';

/**
 * Seed the database with initial data for development
 */
async function seedDatabase() {
  logger.info('Seeding database with initial data...');
  
  // Create a PostgreSQL connection
  const pool = new Pool({
    host: database.host,
    port: database.port,
    database: database.name,
    user: database.user,
    password: database.password,
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
    
    logger.info('Database seeding completed successfully');
  } catch (error) {
    logger.error(error, 'Error during database seeding');
    process.exit(1);
  }
  
  // Close the pool
  await pool.end();
}

// Run seeding when script is executed directly
if (require.main === module) {
  seedDatabase().catch((err) => {
    logger.error(err, 'Database seeding failed');
    process.exit(1);
  });
}

export { seedDatabase }; 