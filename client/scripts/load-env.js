const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

/**
 * Load environment variables from .env files
 * This script ensures environment variables are loaded properly before the server starts
 */
function loadEnvVariables() {
  console.log('Current directory (process.cwd()):', process.cwd());
  
  // Detect client directory and project root
  const clientDir = process.cwd(); // Current directory (likely the client directory)
  console.log('Client directory:', clientDir);
  
  const projectRoot = path.resolve(clientDir, '..');
  console.log('Project root detected at:', projectRoot);
  
  // Define paths to .env files in project root ONLY
  const rootEnvLocalPath = path.join(projectRoot, '.env.local');
  const rootEnvPath = path.join(projectRoot, '.env');
  
  console.log('Using environment files from project root:');
  console.log('Root .env.local:', rootEnvLocalPath);
  console.log('Root .env:', rootEnvPath);
  
  // Check if files exist
  const rootEnvLocalExists = fs.existsSync(rootEnvLocalPath);
  const rootEnvExists = fs.existsSync(rootEnvPath);
  
  console.log('Root .env.local exists:', rootEnvLocalExists);
  console.log('Root .env exists:', rootEnvExists);
  
  // Load .env.local first (takes precedence)
  if (rootEnvLocalExists) {
    console.log('Loading variables from root .env.local');
    dotenv.config({ path: rootEnvLocalPath });
  }
  
  // Load .env second (for defaults)
  if (rootEnvExists) {
    console.log('Loading variables from root .env');
    dotenv.config({ path: rootEnvPath, override: false });
  }
  
  // Verify critical Auth0 environment variables
  const criticalVars = [
    'AUTH0_DOMAIN',
    'AUTH0_CLIENT_ID',
    'AUTH0_CLIENT_SECRET',
    'APP_BASE_URL',
    'AUTH0_SECRET'
  ];
  
  console.log('\nEnvironment variables status:');
  criticalVars.forEach(varName => {
    if (process.env[varName]) {
      if (varName.includes('SECRET')) {
        console.log(`${varName}: [SECRET EXISTS]`);
      } else {
        console.log(`${varName}: ${process.env[varName]}`);
      }
    } else {
      console.warn(`WARNING: Missing ${varName}`);
    }
  });
}

/**
 * Find the project root by looking for package.json or .env file
 */
function findProjectRoot() {
  let currentDir = process.cwd();
  
  // Go up to 10 levels to find project root
  for (let i = 0; i < 10; i++) {
    if (
      fs.existsSync(path.join(currentDir, 'package.json')) || 
      fs.existsSync(path.join(currentDir, '.env'))
    ) {
      return currentDir;
    }
    
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      // We've reached the root of the filesystem
      break;
    }
    
    currentDir = parentDir;
  }
  
  // Fallback to current directory if no project root found
  return process.cwd();
}

// Export function for direct use
module.exports = loadEnvVariables;

// Run if this script is executed directly
if (require.main === module) {
  loadEnvVariables();
} 