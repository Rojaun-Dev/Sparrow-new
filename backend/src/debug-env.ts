import path from 'path';
import fs from 'fs';

// Log current directory and constructed paths
console.log('\n================== DEBUG ENVIRONMENT PATHS ==================');
console.log('Current directory (__dirname):', __dirname);
console.log('process.cwd():', process.cwd());

// Construct paths to environment files
const rootPath = path.resolve(__dirname, '../../');
const envLocalPath = path.resolve(__dirname, '../../../.env.local');
const envPath = path.resolve(__dirname, '../../../.env');

console.log('\nResolved paths:');
console.log('Root path:', rootPath);
console.log('Path to .env.local:', envLocalPath);
console.log('Path to .env:', envPath);

// Check if files exist
console.log('\nFile existence:');
console.log('.env.local exists:', fs.existsSync(envLocalPath));
console.log('.env exists:', fs.existsSync(envPath));

// Log environment variables
console.log('\nEnvironment variables:');
console.log('AUTH0_DOMAIN:', process.env.AUTH0_DOMAIN || '[MISSING]');
console.log('AUTH0_CLIENT_ID:', process.env.AUTH0_CLIENT_ID || '[MISSING]');
console.log('AUTH0_CLIENT_SECRET:', process.env.AUTH0_CLIENT_SECRET ? '[SECRET EXISTS]' : '[SECRET MISSING]');
console.log('AUTH0_AUDIENCE:', process.env.AUTH0_AUDIENCE || '[MISSING]');
console.log('APP_BASE_URL:', process.env.APP_BASE_URL || '[MISSING]');
console.log('NODE_ENV:', process.env.NODE_ENV || '[MISSING]');
console.log('PORT:', process.env.PORT || '[MISSING]');
console.log('================================================================\n');

// This file doesn't export anything, it's just for debugging 