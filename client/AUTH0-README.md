# Auth0 Implementation Guide

This document provides an overview of the Auth0 implementation in the SparrowX application.

## Configuration

Auth0 integration is configured in the following files:

- `client/lib/auth0.ts` - The Auth0 client configuration
- `client/middleware.ts` - Middleware for handling authentication routes
- `client/hooks/useAuth.tsx` - React context provider for Auth0 authentication

## Environment Variables

Ensure you have the following environment variables in your `.env.local` file:

```
# Auth0 configuration
AUTH0_SECRET='your-generated-secret'
APP_BASE_URL='http://localhost:3000'
AUTH0_DOMAIN='your-tenant-domain.auth0.com'
AUTH0_CLIENT_ID='your-client-id'
AUTH0_CLIENT_SECRET='your-client-secret'
AUTH0_AUDIENCE='your-api-identifier' # If using an API
AUTH0_SCOPE='openid profile email' # Adjust scopes as needed
```

You can generate a secure secret using:
```
openssl rand -hex 32
```

## Auth0 Dashboard Configuration

In your Auth0 dashboard, configure the following settings:

1. Create a "Regular Web Application"
2. Set the following URLs:
   - **Allowed Callback URLs**: `http://localhost:3000/auth/callback`
   - **Allowed Logout URLs**: `http://localhost:3000`
   - **Allowed Web Origins**: `http://localhost:3000`

## Authentication Routes

The following routes are automatically created by the Auth0 SDK:

- `/auth/login` - Log in with Auth0
- `/auth/logout` - Log out of the application
- `/auth/callback` - Callback route after successful authentication
- `/auth/register` - Sign up with Auth0 (redirects to login with screen_hint=signup)
- `/auth/profile` - Get the user profile data
- `/auth/access-token` - Get an access token for API calls

## Using Authentication in Components

### Server Components

In server components, use the Auth0 client directly:

```tsx
import { auth0 } from "@/lib/auth0";

export default async function ServerComponent() {
  const session = await auth0.getSession();
  
  if (!session) {
    // Handle unauthenticated user
    return <p>Please log in</p>;
  }
  
  return <p>Hello, {session.user.name}</p>;
}
```

### Client Components

In client components, use the useAuth hook:

```tsx
'use client';

import { useAuth } from "@/hooks/useAuth";

export default function ClientComponent() {
  const { user, isLoading, login, logout, signup } = useAuth();
  
  if (isLoading) {
    return <p>Loading...</p>;
  }
  
  if (!user) {
    return (
      <div>
        <p>Please log in</p>
        <button onClick={login}>Log In</button>
        <button onClick={signup}>Sign Up</button>
      </div>
    );
  }
  
  return (
    <div>
      <p>Hello, {user.name}</p>
      <button onClick={logout}>Log Out</button>
    </div>
  );
}
```

## Protecting Routes

To protect routes, you can use the Auth0 client in your page components to check for authentication and redirect if needed:

```tsx
import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const session = await auth0.getSession();
  
  if (!session) {
    redirect('/auth/login');
    return null;
  }
  
  return <ProtectedContent />;
}
```

## Available Auth0 User Properties

The following properties are typically available on the user object:

- `sub` - The unique identifier for the user in Auth0
- `name` - The user's full name
- `email` - The user's email address
- `email_verified` - Whether the email has been verified
- `picture` - URL to the user's profile picture
- `updated_at` - When the user profile was last updated

## Troubleshooting

If you encounter issues with Auth0 authentication:

1. Check your environment variables are correctly set
2. Verify the callback, logout, and web origins URLs in Auth0 dashboard
3. Check browser console for errors
4. Ensure the Auth0 SDK is properly initialized in `lib/auth0.ts` 