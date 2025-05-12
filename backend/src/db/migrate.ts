import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import path from 'path';
import { database } from '../config';
import logger from '../utils/logger';

async function runMigrations() {
  logger.info('Running migrations...');
  
  // Create a PostgreSQL connection
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
    host: database.host,
    port: database.port,
    database: database.name,
    user: database.user,
    password: database.password,
  });
  
  // Ensure schema exists before running migrations
  try {
    const client = await pool.connect();
    try {
      // Create the public schema if it doesn't exist
      await client.query('CREATE SCHEMA IF NOT EXISTS public');
      logger.info('Ensured public schema exists');
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error(error, 'Error creating schema');
    process.exit(1);
  }
  
  const db = drizzle(pool);
  
  // Run migrations
  try {
    await migrate(db, {
      migrationsFolder: path.join(__dirname, 'migrations'),
    });
    logger.info('Migrations completed successfully');
  } catch (error) {
    logger.error(error, 'Error during migration');
    process.exit(1);
  }
  
  // Close the pool
  await pool.end();
}

// Run migrations when the script is executed directly
if (require.main === module) {
  runMigrations().catch((err) => {
    logger.error(err, 'Migration failed');
    process.exit(1);
  });
}

export { runMigrations }; 