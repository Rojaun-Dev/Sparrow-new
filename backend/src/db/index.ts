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
  connectionTimeoutMillis: 10000,
  connectionString: database.connectionString,
  ssl: {
    rejectUnauthorized: false, // Necessary for Render's SSL
  },
  // Improve connection reliability in Docker/Render environments
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

// Export the drizzle DB instance
export const db = drizzle(pool);

// Export pool for graceful shutdown
export { pool };

// Handle unexpected errors on idle clients
// Don't exit the process - let the pool handle recovery and graceful shutdown handle cleanup
pool.on('error', (err) => {
  logger.error(err, 'Unexpected error on idle client');
  // Removed process.exit(-1) to allow graceful recovery and proper shutdown
});

export default db; 