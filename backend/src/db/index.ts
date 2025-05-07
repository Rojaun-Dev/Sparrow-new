import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { database } from '../config/index';
import logger from '../utils/logger';

console.log(database);

// Configure PostgreSQL connection pool
const pool = new Pool({
  host: database.host,
  port: database.port,
  database: database.name,
  user: database.user,
  password: database.password,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Export the drizzle DB instance
export const db = drizzle(pool);

// Handle unexpected errors
pool.on('error', (err) => {
  logger.error(err, 'Unexpected error on idle client');
  process.exit(-1);
});

export default db; 