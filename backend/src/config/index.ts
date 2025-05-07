import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from parent directory's .env files
// Update paths to correctly point to the root directory where .env.local is located
dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env'), override: false });

// Server configuration
export const server = {
  port: parseInt(process.env.PORT || '4000'),
  env: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') === 'development',
  isProd: process.env.NODE_ENV === 'production',
};

// Database configuration
export const database = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  name: process.env.DB_NAME || 'sparrowx',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
};

// Auth0 configuration
export const auth0 = {
  domain: process.env.AUTH0_DOMAIN || '',
  audience: process.env.AUTH0_AUDIENCE || '',
  clientId: process.env.AUTH0_CLIENT_ID || '',
  clientSecret: process.env.AUTH0_CLIENT_SECRET || '',
  apiToken: process.env.AUTH0_API_TOKEN || '',
};

// Security configuration
export const security = {
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100'),
};

// Log configuration
export const logging = {
  level: process.env.LOG_LEVEL || 'info',
};

// Export default configuration object
export default {
  server,
  database,
  auth0,
  security,
  logging,
}; 