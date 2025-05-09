import { Auth0Client } from "@auth0/nextjs-auth0/server";

// Create a factory function for lazy initialization
let _auth0Client: Auth0Client | null = null;

const createAuth0Client = () => {
  // Initialize with the basic required configuration
  return new Auth0Client({
    domain: process.env.AUTH0_DOMAIN || 'dev-y0gfi2gnw0g6qjyp.us.auth0.com',
    clientId: process.env.AUTH0_CLIENT_ID || '41JW3LRc87U1RHYBtNWb7eEGiBa5213o',
    clientSecret: process.env.AUTH0_CLIENT_SECRET || 'your-auth0-client-secret-here',
    appBaseUrl: process.env.APP_BASE_URL || 'http://localhost:3000',
    secret: process.env.AUTH0_SECRET || 'generate-a-32-byte-secret-using-openssl-rand-hex-32',
    authorizationParameters: {
      scope: process.env.AUTH0_SCOPE || 'openid profile email',
      audience: process.env.AUTH0_AUDIENCE,
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

// Export the auth0 client directly for backwards compatibility
export const auth0 = new Auth0Client({
  domain: process.env.AUTH0_DOMAIN || 'dev-y0gfi2gnw0g6qjyp.us.auth0.com',
  clientId: process.env.AUTH0_CLIENT_ID || '41JW3LRc87U1RHYBtNWb7eEGiBa5213o',
  clientSecret: process.env.AUTH0_CLIENT_SECRET || 'your-auth0-client-secret-here',
  appBaseUrl: process.env.APP_BASE_URL || 'http://localhost:3000',
  secret: process.env.AUTH0_SECRET || 'generate-a-32-byte-secret-using-openssl-rand-hex-32',
  authorizationParameters: {
    scope: process.env.AUTH0_SCOPE || 'openid profile email',
    audience: process.env.AUTH0_AUDIENCE,
  }
}); 