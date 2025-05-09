import { Auth0Client } from "@auth0/nextjs-auth0/server";
import { safeGetEnv } from './env';

// Create a factory function for lazy initialization
let _auth0Client: Auth0Client | null = null;

const createAuth0Client = () => {
  // Initialize with the basic required configuration
  return new Auth0Client({
    domain: safeGetEnv('AUTH0_DOMAIN', 'dev-y0gfi2gnw0g6qjyp.us.auth0.com'),
    clientId: safeGetEnv('AUTH0_CLIENT_ID', '41JW3LRc87U1RHYBtNWb7eEGiBa5213o'),
    clientSecret: safeGetEnv('AUTH0_CLIENT_SECRET', 'your-auth0-client-secret-here'),
    appBaseUrl: safeGetEnv('APP_BASE_URL', 'http://localhost:3000'),
    secret: safeGetEnv('AUTH0_SECRET', 'generate-a-32-byte-secret-using-openssl-rand-hex-32'),
    authorizationParameters: {
      scope: safeGetEnv('AUTH0_SCOPE', 'openid profile email'),
      audience: safeGetEnv('AUTH0_AUDIENCE'),
    }
  });
};

// Export a getter function that ensures the client is initialized only when needed
export const getAuth0 = () => {
  if (!_auth0Client) {
    _auth0Client = createAuth0Client();
  }
  return _auth0Client;
};

// Instead of initializing Auth0Client at import time, create a proxy object
// that lazily initializes the client on first method access
export const auth0 = new Proxy({} as Auth0Client, {
  get: (target, prop) => {
    // Initialize the Auth0 client on first access
    const client = getAuth0();
    // Access the property on the initialized client
    const value = client[prop as keyof Auth0Client];
    
    // If it's a method, bind it to the client to preserve `this`
    if (typeof value === 'function') {
      return function(...args: any[]) {
        return (value as Function).apply(client, args);
      };
    }
    
    return value;
  }
}); 