require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env', override: false });

// Export shared environment variables
module.exports = {
  // Auth0 configuration
  auth0: {
    domain: process.env.AUTH0_DOMAIN || '',
    audience: process.env.AUTH0_AUDIENCE || '',
    clientId: process.env.AUTH0_CLIENT_ID || '',
    clientSecret: process.env.AUTH0_CLIENT_SECRET || '',
  },
  
  // Database configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    name: process.env.DB_NAME || 'sparrowx',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  },

  // Server configuration
  server: {
    port: parseInt(process.env.PORT || '4000'),
    env: process.env.NODE_ENV || 'development',
  },
};