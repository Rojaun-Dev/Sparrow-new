import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from parent directory's .env files
// Update paths to correctly point to the root directory where .env.local is located
dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env'), override: true });

// Server configuration
export const server = {
  port: process.env.API_PORT ,
  env: process.env.NODE_ENV ,
  isDev: process.env.NODE_ENV  === 'development',
  isProd: process.env.NODE_ENV === 'production',
};

// Database configuration
export const database = {
  host: process.env.DB_HOST ,
  port: parseInt(process.env.DB_PORT as string) ,
  name: process.env.DB_NAME  ,
  user: process.env.DB_USER ,
  password: process.env.DB_PASSWORD,
  connectionString: process.env.DATABASE_URL,
};

// JWT configuration
export const jwt = {
  secret: process.env.JWT_SECRET || 'your-default-jwt-secret-key',
  expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-default-jwt-refresh-secret-key',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
};

// Auth0 configuration
export const auth0 = {
  domain: process.env.AUTH0_DOMAIN || '',
  audience: process.env.AUTH0_AUDIENCE || '',
  clientId: process.env.AUTH0_CLIENT_ID || '',
  clientSecret: process.env.AUTH0_CLIENT_SECRET || '',
  apiToken: process.env.AUTH0_API_TOKEN || '',
};

export const client = {
  url: process.env.CLIENT_URL || '',
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
  jwt,
  auth0,
  security,
  logging,
  client,
}; 