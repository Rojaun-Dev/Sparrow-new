import type { Config } from 'drizzle-kit';
import { database } from './src/config';

export default {
  schema: './src/db/schema',
  out: './src/db/migrations',
  driver: 'pg',
  dbCredentials: {
    host: database.host || 'localhost',
    port: database.port || 5432,
    database: database.name || 'sparrowx',
    user: database.user || 'postgres',
    password: database.password || '',
  },
  // Comment out shadowDatabaseName since it's not recognized in the Config type
  // shadowDatabaseName: 'sparrowx_shadow',
  verbose: true,
  strict: true,
} satisfies Config; 