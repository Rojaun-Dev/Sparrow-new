# Auth0 Setup Instructions

This document provides instructions for setting up Auth0 authentication in this project.

## Prerequisites

1. An Auth0 account (sign up at https://auth0.com)
2. Node.js and npm installed

## Setup Steps

### 1. Create an Auth0 Application

1. Log in to your Auth0 dashboard
2. Navigate to Applications > Applications
3. Click "Create Application"
4. Give your application a name (e.g., "SparrowX")
5. Select "Regular Web Application"
6. Click "Create"

### 2. Configure Application Settings

1. In your Auth0 application settings, configure the following:

   - **Allowed Callback URLs**: `http://localhost:3000/auth/callback`
   - **Allowed Logout URLs**: `http://localhost:3000`
   - **Allowed Web Origins**: `http://localhost:3000`
   
2. Make note of the following values:
   - Domain
   - Client ID
   - Client Secret

### 3. Configure Environment Variables

1. Create a `.env.local` file in the root directory with the following variables:

```
# Auth0 configuration
AUTH0_SECRET='your-generated-secret'
APP_BASE_URL='http://localhost:3000'
AUTH0_DOMAIN='your-tenant-domain.auth0.com'
AUTH0_CLIENT_ID='your-client-id'
AUTH0_CLIENT_SECRET='your-client-secret'
AUTH0_AUDIENCE='your-api-identifier'
AUTH0_SCOPE='openid profile email'

# Database configuration
# You can find this information using the pg CLI with commands like:
# - Connection info: \conninfo
# - List databases: \l
# - List users: \du
# - Current database: SELECT current_database();
# - Host and port are typically in your connection string or psql command
DB_HOST='localhost'
DB_PORT='5432'
DB_NAME='sparrowx'
DB_USER='postgres'
DB_PASSWORD='postgres'

# Server configuration
PORT='4000'
NODE_ENV='development'
```

2. Generate a random secret for AUTH0_SECRET by running:

```
node scripts/generate-auth0-secret.js
```

### 4. API Authorization (Optional)

If you want to protect backend API routes:

1. In your Auth0 dashboard, go to "APIs" and click "Create API"
2. Provide a name (e.g., "SparrowX API") and an identifier (e.g., "https://api.sparrowx.com")
3. Use this identifier as the value for AUTH0_AUDIENCE in your .env.local file

### 5. Testing Your Setup

1. Start the frontend and backend servers:

```
# In one terminal (frontend)
cd client
npm run dev

# In another terminal (backend)
cd backend
npm run dev
```

2. Open `http://localhost:3000` in your browser
3. Click the login button and verify that you're redirected to Auth0
4. After logging in, you should be redirected back to your application

## Troubleshooting

- **Callback URL Errors**: Ensure your callback URL in Auth0 settings exactly matches your application's callback URL.
- **CORS Issues**: Verify that your Auth0 application has the correct Allowed Web Origins.
- **Token Validation Errors**: Ensure AUTH0_AUDIENCE and AUTH0_DOMAIN match between frontend and backend.

## Additional Resources

- [Auth0 Next.js SDK Documentation](https://auth0.github.io/nextjs-auth0/modules/index.html)
- [Auth0 Express SDK Documentation](https://auth0.github.io/express-openid-connect/) 