# Build Error Fixes - Environment Variables and Auth0

This document details the recent (depending on when you're reading this.) fixes for build errors related to environment variables and Auth0 integration in the Next.js client application. I feel like its important to outline this since it mentions my work arounds a solution for getting the environment variables to loaded intime for the rest of the systems being used (namely Auth0).

## Problem

The application was experiencing the following build error:

```
TypeError: Cannot read properties of undefined (reading 'env')
```

This occurred during the static optimization phase of Next.js build, when certain pages tried to access environment variables that weren't properly loaded or weren't available during build time.

## Root Causes

Several issues contributed to this problem:

1. **Environment Variables Location**: The application expected environment variables to be in the client directory, but they were actually stored at the project root.

2. **Eager Auth0 Initialization**: The Auth0 client was being initialized at import time rather than lazily when needed, causing errors during static build.

3. **Static Optimization**: Next.js was attempting to statically optimize pages that required runtime data like environment variables and Auth0 authentication.

4. **Unsafe Environment Access**: Direct access to `process.env` wasn't properly guarded against undefined scenarios.

## Solutions Implemented

### 1. Root-Level Environment Loading

The `next.config.mjs` file now includes a custom loader that:
- Searches for environment files in the parent directory (project root)
- Loads `.env`, `.env.local`, `.env.{environment}`, and `.env.{environment}.local`
- Makes environment variables available to the application

```javascript
// next.config.mjs
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
```

### 2. Lazy Auth0 Client Initialization

Auth0 client is now lazily initialized only when needed, preventing errors during static build:

```javascript
// lib/auth0.ts
let _auth0Client: Auth0Client | null = null;

export function getAuth0Client() {
  if (!_auth0Client) {
    _auth0Client = createAuth0Client();
  }
  return _auth0Client;
}
```

### 3. Forced Dynamic Rendering for Protected Pages

Protected pages now use the dynamic directive to prevent static optimization:

```javascript
// app/admin/layout.tsx, app/superadmin/layout.tsx, etc.
export const dynamic = 'force-dynamic';
export const revalidate = 0;
```

### 4. Safe Environment Variable Access

A utility function provides safe access to environment variables in any context:

```javascript
// lib/env.js
export function safeGetEnv(key, defaultValue = '') {
  if (isBrowser) {
    // Browser-safe access
    return window.__NEXT_DATA__?.env?.[key] || defaultValue;
  }
  
  if (isEdgeRuntime || typeof process === 'undefined' || !process.env) {
    return defaultValue;
  }
  
  return process.env[key] || defaultValue;
}
```

## Results

These changes have successfully resolved the build errors by:

1. Properly loading environment variables from the project root
2. Preventing Auth0 initialization during static build
3. Forcing dynamic rendering for protected pages
4. Safely accessing environment variables in all contexts

## Best Practices Going Forward

To avoid similar issues in the future:

1. Place all environment files in the project root directory
2. Use the safe environment variable access utility for all environment variable access
3. Make Auth0 and other external service clients lazy-loaded
4. Apply the dynamic directive to pages that need authentication or runtime environment variables
5. Be cautious with environment variables in components that might be statically rendered 