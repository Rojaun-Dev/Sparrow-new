# Environment Variables Setup Guide

This document provides detailed information about how environment variables are set up, loaded, and used throughout the SparrowX application.

## Environment Files Location

All environment files must be placed in the **project root directory**, not in client or backend subdirectories. This is critical for the proper functioning of the application.

```
cautious-robot/          # Project root
├── .env                 # Base environment variables (commit to git)
├── .env.local           # Local overrides (do not commit to git)
├── .env.development     # Development-specific variables
├── .env.production      # Production-specific variables
├── client/              # Next.js front-end application
└── backend/             # Express.js API server
```

## Environment Loading Mechanism

### Next.js Client

The environment loading in the Next.js client application has been enhanced to reliably load environment variables from the project root:

1. **next.config.mjs**: The configuration file now includes a custom loader that:
   - Searches for environment files in the parent directory (project root)
   - Loads `.env`, `.env.local`, `.env.{environment}`, and `.env.{environment}.local`
   - Explicitly exposes selected variables to the client via the `env` property

2. **Lazy-loaded Auth0 Client**: 
   - Auth0 client is now initialized on-demand rather than at import time
   - This prevents errors during build-time when environment variables may not be available
   - The client is initialized only when methods are actually called

3. **Dynamic Rendering**: 
   - Protected pages are configured with `export const dynamic = 'force-dynamic'`
   - This prevents static optimization for routes that need Auth0
   - Avoids build-time errors related to missing environment variables during static generation

### Safe Environment Access

A utility function is provided in `client/lib/env.js` to safely access environment variables in any context:

```javascript
import { safeGetEnv } from './lib/env';

// Safely access an environment variable with a fallback
const apiUrl = safeGetEnv('NEXT_PUBLIC_API_URL', 'http://localhost:4000/api');
```

This utility handles different runtime contexts:
- Browser environment
- Server environment
- Edge runtime
- Cases where `process.env` might be undefined

## Required Environment Variables

The following environment variables are required for the application to function properly:

### Auth0 Configuration
```
AUTH0_DOMAIN=your-tenant.region.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret
APP_BASE_URL=http://localhost:3000 (or your production URL)
AUTH0_SECRET=a-long-random-string
AUTH0_SCOPE=openid profile email (optional)
AUTH0_AUDIENCE=https://your-api-identifier/ (optional, for API access)
```

### Database Configuration
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sparrowx
DB_USER=postgres
DB_PASSWORD=postgres
```

### Server Configuration
```
PORT=4000
NODE_ENV=development
```

### Client Configuration
```
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

## Client-Side Environment Variables

For environment variables to be accessible in browser code, they must be:

1. Prefixed with `NEXT_PUBLIC_`, or
2. Explicitly added to the `env` object in `next.config.mjs`

The following Auth0 variables are automatically made available to the client:
- `AUTH0_DOMAIN`
- `AUTH0_CLIENT_ID`
- `AUTH0_AUDIENCE`
- `APP_BASE_URL`

## Setup Script

A setup script is provided to help generate the initial environment file:

```bash
npm run setup
```

This script:
1. Creates a `.env.local` file in the project root
2. Generates a secure random value for `AUTH0_SECRET`
3. Adds default values for required environment variables

## Environment Files Priority

Environment files are loaded in the following order, with later files taking precedence:

1. `.env` (base defaults, commit to git)
2. `.env.environment` (e.g., `.env.development`, `.env.production`)
3. `.env.local` (local overrides, do not commit to git)
4. `.env.environment.local` (e.g., `.env.development.local`)

## Troubleshooting

Common issues and solutions:

### Missing Environment Variables During Build

If you encounter errors about missing environment variables during build:

- Make sure all protected pages use `export const dynamic = 'force-dynamic'`
- Check that Auth0 client is being lazy-loaded with `getAuth0Client()`
- Verify environment files are in the project root, not in the client directory

### Access to process.env is Undefined

If you see errors about `process.env` being undefined:

- Use the safe environment variable access utility: `safeGetEnv('VAR_NAME')`
- Replace direct access to `process.env.VAR_NAME` with `safeGetEnv('VAR_NAME')`
- Add appropriate default values as fallbacks

### Build-Time vs. Runtime Environment Access

- Some environment variables are only available at runtime, not during static build
- Auth0-related code should be wrapped in runtime-only components/functions
- Pages with authentication should use `dynamic = 'force-dynamic'` to ensure runtime rendering 