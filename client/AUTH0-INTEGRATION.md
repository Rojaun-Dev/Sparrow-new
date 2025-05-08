# Auth0 Integration with Next.js

This document explains how the Auth0 integration is set up in this project to ensure proper loading of environment variables before initializing the Auth0 client.

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
   - Auth0 client is only initialized when first needed
   - Environment variables are verified when client is created
   - Singleton pattern ensures only one client instance exists

2. **Environment Variable Loader** (`scripts/load-env.js`):
   - Detects project root location
   - Loads environment variables from `.env.local` and `.env` files in the project root
   - Verifies critical Auth0-related environment variables

3. **Server Wrapper** (`scripts/server.js`):
   - Ensures environment variables are loaded before server starts
   - Forwards commands to Next.js (dev, build, start)
   - Provides consistent startup process

4. **Client-side Helpers** (`lib/auth0-client.ts`):
   - Provides hooks and utilities for client-side authentication
   - Simplifies authentication state management in components

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
import { getAuth0 } from './lib/auth0';

// Get the Auth0 client instance
const auth0 = getAuth0();

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

3. If you see errors about missing environment variables:
   - Run `npm run setup` to create the `.env.local` file in the project root
   - Make sure to update the Auth0 Client Secret in the file

4. Check browser console for any error messages

5. Verify Auth0 tenant configuration matches your application settings 