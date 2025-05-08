// Import directly from the nextjs-auth0 package
import { handleAuth } from '@auth0/nextjs-auth0';

// The handleAuth function creates all the necessary routes for authentication
export default handleAuth({
  // Optionally customize the handlers if needed
  // login: async (req, res) => { },
  // logout: async (req, res) => { },
  // callback: async (req, res) => { },
  // profile: async (req, res) => { },
}); 