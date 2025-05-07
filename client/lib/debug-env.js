import path from 'path';

// Log current directory and constructed paths
console.log('Current directory (process.cwd()):', process.cwd());
console.log('__dirname:', __dirname);

// Construct and log paths for .env files
const rootPath = path.resolve(process.cwd(), '..');
const envLocalPath = path.resolve(process.cwd(), '../.env.local');
const envPath = path.resolve(process.cwd(), '../.env');

console.log('Root path:', rootPath);
console.log('Path to .env.local:', envLocalPath);
console.log('Path to .env:', envPath);

// Check if files exist (if Node.js fs is available)
try {
  const fs = require('fs');
  console.log('.env.local exists:', fs.existsSync(envLocalPath));
  console.log('.env exists:', fs.existsSync(envPath));
} catch (error) {
  console.log('Cannot check file existence in browser environment');
}

// Log some important environment variables
console.log('AUTH0_DOMAIN:', process.env.AUTH0_DOMAIN);
console.log('AUTH0_CLIENT_ID:', process.env.AUTH0_CLIENT_ID);
console.log('APP_BASE_URL:', process.env.APP_BASE_URL);
console.log('AUTH0_SECRET:', process.env.AUTH0_SECRET ? '[SECRET EXISTS]' : '[SECRET MISSING]');
console.log('AUTH0_CLIENT_SECRET:', process.env.AUTH0_CLIENT_SECRET ? '[SECRET EXISTS]' : '[SECRET MISSING]');

// Export nothing, this is just for debugging
export default {}; 