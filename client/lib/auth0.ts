import { Auth0Client } from "@auth0/nextjs-auth0/server";

// Create a factory function for lazy initialization
let _auth0Client: Auth0Client | null = null;

const createAuth0Client = () => {
  // Log environment variable presence for debugging
  const envStatus = {
    AUTH0_DOMAIN: !!process.env.AUTH0_DOMAIN,
    AUTH0_CLIENT_ID: !!process.env.AUTH0_CLIENT_ID,
    AUTH0_CLIENT_SECRET: !!process.env.AUTH0_CLIENT_SECRET,
    APP_BASE_URL: !!process.env.APP_BASE_URL,
    AUTH0_SECRET: !!process.env.AUTH0_SECRET,
    AUTH0_SCOPE: !!process.env.AUTH0_SCOPE,
    AUTH0_AUDIENCE: !!process.env.AUTH0_AUDIENCE,
  };
  
  console.log("Environment variables status:", envStatus);
  
  // Check if critical environment variables are missing
  const missingVars = Object.entries(envStatus)
    .filter(([key, exists]) => !exists && key !== 'AUTH0_SCOPE' && key !== 'AUTH0_AUDIENCE')
    .map(([key]) => key);
    
  if (missingVars.length > 0) {
    const clientDir = process.cwd();
    const projectRoot = clientDir.endsWith('client') 
      ? clientDir.substring(0, clientDir.length - 7) 
      : clientDir;
      
    console.error("\n\n======== AUTH0 CONFIGURATION ERROR ========");
    console.error("Missing critical environment variables:", missingVars.join(', '));
    console.error("\nPlease run the setup script to create a proper .env.local file in the PROJECT ROOT:");
    console.error("npm run setup");
    console.error("\nThe .env.local file should be located at: " + projectRoot + ".env.local");
    console.error("Note: This project is configured to ONLY use environment variables from the project root directory.");
    console.error("========================================\n\n");
  }

  // Initialize the Auth0 client with direct values since env vars might not be loaded
  return new Auth0Client({
    // Using the values from the logs directly, but preferring environment variables if available
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