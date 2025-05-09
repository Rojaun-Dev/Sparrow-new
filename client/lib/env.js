// Skip processing in Edge Runtime
const isEdgeRuntime = typeof process !== 'undefined' && process.env.NEXT_RUNTIME === 'edge';

// Only run in Node.js environment, not in Edge Runtime or browser
if (!isEdgeRuntime && typeof process !== 'undefined' && typeof window === 'undefined') {
  try {
    // Dynamic imports are safer in different environments
    const { config } = require('dotenv');
    const path = require('path');
    const fs = require('fs');
    
    // Helper function to find the project root (where the .env files should be)
    function findProjectRoot(startDir) {
      try {
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
        
        // Last resort - return current directory
        return startDir;
      } catch (error) {
        console.error('Error finding project root:', error.message);
        return startDir;
      }
    }

    // Find the project root directory
    const projectRoot = findProjectRoot(process.cwd());

    // Set paths for .env files relative to the project root
    const envLocalPath = path.join(projectRoot, '.env.local');
    const envPath = path.join(projectRoot, '.env');

    // Load .env.local first (higher priority)
    config({ path: envLocalPath });
    // Then load .env (lower priority, won't override existing vars)
    config({ path: envPath, override: false });

    console.log('Project root detected at:', projectRoot);
    console.log('Looking for .env.local at:', envLocalPath);
    console.log('Looking for .env at:', envPath);
  } catch (error) {
    console.error('Error loading environment variables:', error.message);
  }
}

// This file doesn't export anything, it just runs the config function to load env vars