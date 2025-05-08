const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Generate a random hex string for AUTH0_SECRET
function generateSecret() {
  return crypto.randomBytes(32).toString('hex');
}

// Create an .env.local file with the required variables
function setupEnv() {
  console.log('Setting up environment variables...');
  
  const clientDir = process.cwd();
  const projectRoot = path.resolve(clientDir, '..');
  
  console.log('Client directory:', clientDir);
  console.log('Project root:', projectRoot);
  
  // Define file path in project root only
  const rootEnvPath = path.join(projectRoot, '.env.local');
  
  const secret = generateSecret();
  
  const envContent = `# Auth0 configuration
AUTH0_DOMAIN=dev-y0gfi2gnw0g6qjyp.us.auth0.com
AUTH0_CLIENT_ID=41JW3LRc87U1RHYBtNWb7eEGiBa5213o
AUTH0_CLIENT_SECRET=your-client-secret-here
APP_BASE_URL=http://localhost:3000
AUTH0_SECRET=${secret}

# Optional API configuration
# AUTH0_SCOPE=openid profile email
# AUTH0_AUDIENCE=https://your-api-identifier/
`;

  // Write the .env.local file to project root only
  console.log(`Creating .env.local file in project root: ${rootEnvPath}`);
  fs.writeFileSync(rootEnvPath, envContent);
  
  console.log('\n✅ Environment setup complete!');
  console.log('\n⚠️ IMPORTANT: Make sure to replace "your-client-secret-here" with your actual Auth0 Client Secret in the .env.local file.');
  console.log('\nYou can now start your application with:');
  console.log('npm run dev');
}

setupEnv(); 