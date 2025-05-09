/** @type {import('next').NextConfig} */
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables from the parent directory (root of the project)
const projectDir = path.resolve(process.cwd(), '..');

// Function to load environment files
function loadEnvFromRoot() {
  const envFiles = [
    path.join(projectDir, '.env'),
    path.join(projectDir, '.env.local'),
    path.join(projectDir, `.env.${process.env.NODE_ENV || 'development'}`),
    path.join(projectDir, `.env.${process.env.NODE_ENV || 'development'}.local`),
  ];

  // Load each env file if it exists
  for (const file of envFiles) {
    if (fs.existsSync(file)) {
      console.log(`Loading env from: ${file}`);
      const envConfig = dotenv.parse(fs.readFileSync(file));
      for (const k in envConfig) {
        process.env[k] = envConfig[k];
      }
    }
  }
}

// Load environment variables
loadEnvFromRoot();

// Gather any environment variables that should be exposed to the client
// Prefix with NEXT_PUBLIC_ to make them available to the client
const env = Object.keys(process.env)
  .filter(key => key.startsWith('NEXT_PUBLIC_') || 
                 key === 'AUTH0_DOMAIN' || 
                 key === 'AUTH0_CLIENT_ID' || 
                 key === 'AUTH0_AUDIENCE' ||
                 key === 'APP_BASE_URL')
  .reduce((env, key) => {
    env[key] = process.env[key];
    return env;
  }, {});

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Make selected environment variables available to the client
  env,
  // Skip static optimization for routes that need Auth0
  experimental: {
    // This prevents Next.js from statically optimizing pages that might need auth
    ppr: false
  },
  // Modify the output configuration for production builds
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  // Skip static generation for specific paths
  onDemandEntries: {
    // Period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 60 * 60 * 1000, // 1 hour
    // Number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 5,
  },
  // Configure which paths should not be statically generated
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
}

export default nextConfig
