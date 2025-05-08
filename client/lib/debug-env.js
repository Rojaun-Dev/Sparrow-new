import path from 'path';
import fs from 'fs';

// Skip processing in Edge Runtime (middleware)
const isEdgeRuntime = typeof process !== 'undefined' && 
                     process.env.NEXT_RUNTIME === 'edge';

// Only run this code in standard Node.js environment, not in Edge Runtime
if (!isEdgeRuntime) {
  // Helper function to find the project root (same as in env.js)
  function findProjectRoot(startDir) {
    // First, try to find by splitting the path - most reliable for this specific project
    const parts = startDir.split(path.sep);
    const clientIndex = parts.findIndex(part => part === 'client');
    
    if (clientIndex !== -1) {
      // We're in the client directory, go up one level
      return parts.slice(0, clientIndex).join(path.sep);
    }
    
    // Fallback approach - try up to 3 parent directories
    let currentDir = startDir;
    const MAX_LEVELS = 3;
    
    for (let i = 0; i < MAX_LEVELS; i++) {
      // Check if .env files exist in this directory
      if (fs.existsSync(path.join(currentDir, '.env')) || 
          fs.existsSync(path.join(currentDir, '.env.local'))) {
        return currentDir;
      }
      
      // Check for package.json with a client directory
      if (fs.existsSync(path.join(currentDir, 'package.json')) && 
          fs.existsSync(path.join(currentDir, 'client'))) {
        return currentDir;
      }
      
      // Move up one directory
      const parentDir = path.resolve(currentDir, '..');
      if (parentDir === currentDir) break; // Stop if we can't go up anymore
      currentDir = parentDir;
    }
    
    // Last resort - hardcode the path
    return path.resolve(startDir, '..');
  }

  // Find the project root directory
  const projectRoot = findProjectRoot(process.cwd());

  // Log current directory and constructed paths
  console.log('Current directory (process.cwd()):', process.cwd());
  console.log('__dirname:', __dirname);
  console.log('Project root detected at:', projectRoot);

  // Construct and log paths for .env files
  const envLocalPath = path.join(projectRoot, '.env.local');
  const envPath = path.join(projectRoot, '.env');

  console.log('Path to .env.local:', envLocalPath);
  console.log('Path to .env:', envPath);

  // Check if files exist
  try {
    console.log('.env.local exists:', fs.existsSync(envLocalPath));
    console.log('.env exists:', fs.existsSync(envPath));
  } catch (error) {
    console.log('Cannot check file existence:', error.message);
  }
}

// Log some important environment variables (safe to do in any environment)
console.log('AUTH0_DOMAIN:', process.env.AUTH0_DOMAIN);
console.log('AUTH0_CLIENT_ID:', process.env.AUTH0_CLIENT_ID);
console.log('APP_BASE_URL:', process.env.APP_BASE_URL);
console.log('AUTH0_SECRET:', process.env.AUTH0_SECRET ? '[SECRET EXISTS]' : '[SECRET MISSING]');
console.log('AUTH0_CLIENT_SECRET:', process.env.AUTH0_CLIENT_SECRET ? '[SECRET EXISTS]' : '[SECRET MISSING]');

// Export nothing, this is just for debugging
export default {}; 