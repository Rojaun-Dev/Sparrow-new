# Auth0 Integration with Next.js

## Navigation

- [Documentation Hub](../docs/README.md)
- [Main Project README](../README.md)
- [Auth0 Setup Instructions](../AUTH0-SETUP.md)
- [Auth0 Implementation Guide](./AUTH0-README.md)
- [Quick Auth0 Setup Fix](./SETUP-AUTH0.md)

## Overview

This document explains how the Auth0 integration is set up in this project to ensure proper loading of environment variables before initializing the Auth0 client. For basic setup instructions, please refer to the [Auth0 Setup Instructions](../AUTH0-SETUP.md).

## Quick Start

To set up Auth0 in this project, follow these steps:

1. Run the setup script to create the necessary environment file:
   ```bash
   npm run setup
   ```

2. Update the Auth0 Client Secret in the generated `.env.local` file in the project root directory:
   ```
   # Path should be /path/to/cautious-robot/.env.local
   # NOT /path/to/cautious-robot/client/.env.local
   ```

3. Start the application:
   ```bash
   npm run dev
   ```

## Important Note about Environment Variables

This project is configured to ONLY load environment variables from the project root directory, not from the client directory. This means:

- The `.env.local` file should be in the project root (`/path/to/cautious-robot/.env.local`)
- NOT in the client directory (`/path/to/cautious-robot/client/.env.local`)

## Architecture

The Auth0 client is lazy-loaded to ensure that all environment variables are properly loaded before it is initialized. This approach solves common issues related to environment variable loading order and availability.

### Key Components

1. **Lazy-loaded Auth0 Client** (`lib/auth0.ts`):
   - Auth0 client is only initialized when first needed, not at import time
   - Environment variables are safely accessed through a utility function
   - This prevents build-time errors when AUTH0 variables aren't available during static rendering

2. **Environment Variable Loader** (`next.config.mjs`):
   - Automatically detects and loads environment variables from the project root location
   - Processes multiple environment files (`.env`, `.env.local`, `.env.development`, etc.)
   - Makes selected environment variables available to client-side code via Next.js configuration

3. **Safe Environment Variable Access** (`lib/env.js`):
   - Provides a safe way to access environment variables in any execution context
   - Handles browser, server, and edge runtime environments appropriately
   - Falls back to default values when variables aren't available

4. **Dynamic Rendering Configuration**:
   - Protected pages use `export const dynamic = 'force-dynamic'`
   - This prevents static optimization for routes that need Auth0
   - Avoids build-time errors when Auth0 client tries to initialize during static rendering

## Required Environment Variables

The following environment variables must be set in your `.env.local` file in the project root:

```
AUTH0_DOMAIN=your-tenant.region.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret
APP_BASE_URL=http://localhost:3000 (or your production URL)
AUTH0_SECRET=a-long-random-string
AUTH0_SCOPE=openid profile email (optional)
AUTH0_AUDIENCE=https://your-api-identifier/ (optional, for API access)
```

## Usage

### Server-side Authentication

```typescript
import { getAuth0Client } from './lib/auth0';

// Get the Auth0 client instance (lazy-loaded)
const auth0 = getAuth0Client();

// Use the client for authentication operations
const session = await auth0.getSession(req, res);
```

### Client-side Authentication

```typescript
import { useAuth, getLoginUrl, getLogoutUrl } from './lib/auth0-client';

function MyComponent() {
  // Get authentication state
  const { user, isLoading, isAuthenticated } = useAuth();
  
  if (isLoading) return <div>Loading...</div>;
  
  if (isAuthenticated) {
    return (
      <div>
        <p>Welcome, {user.name}!</p>
        <a href={getLogoutUrl()}>Log out</a>
      </div>
    );
  }
  
  return <a href={getLoginUrl()}>Log in</a>;
}
```

### Protected Pages

For pages that require authentication, you should add the dynamic rendering directive:

```typescript
// This prevents static optimization
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Your component code...
```

## Running the Application

Use the provided npm scripts to run the application:

```bash
# Start development server with proper environment variable loading
npm run dev

# Build the application
npm run build

# Start production server
npm run start

# Verify environment variables are loaded correctly
npm run env:check
```

## Troubleshooting

If you encounter issues with Auth0 authentication:

1. Ensure the `.env.local` file exists in the project root directory (not the client directory)

2. Run `npm run env:check` to verify environment variables are loaded correctly

3. If you see errors about missing environment variables during build:
   - Make sure all protected pages use `export const dynamic = 'force-dynamic'`
   - Check that Auth0 client is being lazy-loaded, not initialized at import time
   - Verify environment variables are being loaded from the root directory

4. If you see errors about process.env being undefined:
   - Use the safe environment variable access utility from `lib/env.js`
   - Replace direct access to `process.env.VAR_NAME` with `safeGetEnv('VAR_NAME')`

5. Check browser console for any error messages

6. Verify Auth0 tenant configuration matches your application settings 