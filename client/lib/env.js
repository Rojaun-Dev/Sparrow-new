// Environment variable utility
const isEdgeRuntime = typeof process !== 'undefined' && process.env.NEXT_RUNTIME === 'edge';
const isBrowser = typeof window !== 'undefined';

/**
 * Safe environment variable accessor
 * Handles edge cases where process.env might be undefined
 * 
 * @param {string} key - Environment variable key
 * @param {string} defaultValue - Default value if not found
 * @returns {string} - Environment variable value or default
 */
export function safeGetEnv(key, defaultValue = '') {
  // In browser context, we need to handle differently
  if (isBrowser) {
    // In the browser, we can only access NEXT_PUBLIC_ variables 
    // or variables exposed via next.config.js env property
    return typeof window !== 'undefined' && 
           typeof window.__NEXT_DATA__ !== 'undefined' && 
           window.__NEXT_DATA__.env && 
           window.__NEXT_DATA__.env[key] 
      ? window.__NEXT_DATA__.env[key] 
      : defaultValue;
  }
  
  // In Edge Runtime or if process.env is undefined
  if (isEdgeRuntime || typeof process === 'undefined' || !process.env) {
    return defaultValue;
  }
  
  // Normal server-side context
  return process.env[key] || defaultValue;
}

// Export common environment variables with defaults
export const AUTH0_DOMAIN = safeGetEnv('AUTH0_DOMAIN', 'dev-y0gfi2gnw0g6qjyp.us.auth0.com');
export const AUTH0_CLIENT_ID = safeGetEnv('AUTH0_CLIENT_ID', '41JW3LRc87U1RHYBtNWb7eEGiBa5213o');
export const AUTH0_AUDIENCE = safeGetEnv('AUTH0_AUDIENCE', 'https://api.sparrowx.com');
export const APP_BASE_URL = safeGetEnv('APP_BASE_URL', 'http://localhost:3000');

// Public getter to avoid potential destructuring issues
export function getEnv(key, defaultValue = '') {
  return safeGetEnv(key, defaultValue);
}

export default {
  AUTH0_DOMAIN,
  AUTH0_CLIENT_ID,
  AUTH0_AUDIENCE,
  APP_BASE_URL,
  getEnv
};