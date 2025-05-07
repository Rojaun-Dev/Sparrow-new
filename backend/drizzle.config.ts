import type { Config } from 'drizzle-kit';
import { database } from './src/config';

export default {
  schema: './src/db/schema',
  out: './src/db/migrations',
  driver: 'pg',
  dbCredentials: {
    host: database.host,
    port: database.port,
    database: database.name,
    user: database.user,
    password: database.password,
  },
  // Use "shadow" as a database name for the drizzle migrations
  // This creates and verifies migrations against a test database
  shadowDatabaseName: 'sparrowx_shadow',
  verbose: true,
  strict: true,
} satisfies Config; 