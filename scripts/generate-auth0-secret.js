/**
 * This script generates a random key for AUTH0_SECRET
 * Run with: node scripts/generate-auth0-secret.js
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Generate a random 32-byte hex string
const secret = crypto.randomBytes(32).toString('hex');

console.log('Generated AUTH0_SECRET:');
console.log(secret);
console.log('\nYou can add this to your .env.local file.\n');

// Optionally, update the .env.local file if it exists
const envPath = path.resolve(__dirname, '../.env.local');

if (fs.existsSync(envPath)) {
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Replace existing AUTH0_SECRET or add a new one
  if (envContent.includes('AUTH0_SECRET=')) {
    envContent = envContent.replace(/AUTH0_SECRET=.*/, `AUTH0_SECRET='${secret}'`);
  } else {
    envContent += `\nAUTH0_SECRET='${secret}'`;
  }
  
  fs.writeFileSync(envPath, envContent);
  console.log(`Updated .env.local file with the new secret.`);
} else {
  console.log(`No .env.local file found at ${envPath}.`);
  console.log('Please create one and add your AUTH0_SECRET manually.');
} 