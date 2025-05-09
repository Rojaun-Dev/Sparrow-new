# Fix Auth0 Setup Issues

## Navigation

- [Documentation Hub](../docs/README.md)
- [Main Project README](../README.md)
- [Auth0 Setup Instructions](../AUTH0-SETUP.md)
- [Auth0 Implementation Guide](./AUTH0-README.md)
- [Auth0 Integration with Next.js](./AUTH0-INTEGRATION.md)

## Overview

This document provides quick fixes for common Auth0 setup issues. For complete setup instructions, please refer to the [Auth0 Setup Instructions](../AUTH0-SETUP.md).

## Quick Fix Steps

1. **Run the setup script**

   ```bash
   npm run setup
   ```

   This will create an `.env.local` file in the project root with the correct Auth0 settings.

2. **Update the Auth0 Client Secret**

   Edit the `.env.local` file in the project root directory and replace `your-client-secret-here` with your actual Auth0 Client Secret.

3. **Restart your server**

   ```bash
   npm run dev
   ```

## Why this works

The Auth0 integration needs environment variables to be properly loaded before the Auth0 client is initialized. The setup script ensures that:

1. An `.env.local` file is created in the project root directory (not the client directory)
2. All necessary Auth0 configuration variables are properly set
3. The Auth0 secret is generated with a secure random value

## Important Note

This project is configured to ONLY use environment variables from the project root directory, not from the client directory.

## Verifying it worked

When your application starts, you should see output confirming that all environment variables are loaded:

```
Environment variables status: {
  AUTH0_DOMAIN: true,
  AUTH0_CLIENT_ID: true,
  AUTH0_CLIENT_SECRET: true,
  APP_BASE_URL: true,
  AUTH0_SECRET: true,
  AUTH0_SCOPE: true,
  AUTH0_AUDIENCE: false  // This is optional
}
```

## Still having issues?

Check the [full Auth0 integration documentation](AUTH0-INTEGRATION.md) for more details on the architecture and troubleshooting steps. 