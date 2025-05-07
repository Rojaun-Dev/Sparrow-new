import { config } from 'dotenv';
import path from 'path';

// Load environment variables from parent directory
// Fix path resolution to point to the root directory where .env.local is located
const envLocalPath = path.resolve(process.cwd(), '../.env.local');
const envPath = path.resolve(process.cwd(), '../.env');

// Load .env.local first (higher priority)
config({ path: envLocalPath });
// Then load .env (lower priority, won't override existing vars)
config({ path: envPath, override: false });

// This file doesn't export anything, it just runs the config function to load env vars