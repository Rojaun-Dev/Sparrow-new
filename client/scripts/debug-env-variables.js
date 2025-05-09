// Debug script to verify environment variables are being loaded correctly
import path from 'path';
import { loadEnvConfig } from '@next/env';

// Load environment variables from the parent directory (root of the project)
const projectDir = path.resolve(process.cwd(), '..');
console.log('Loading environment variables from:', projectDir);
const { combinedEnv, loadedEnvFiles } = loadEnvConfig(projectDir);

console.log('\nLoaded environment files:');
loadedEnvFiles.forEach(file => {
  console.log(`- ${file.path}`);
});

console.log('\nEnvironment variables loaded:');
// Don't print sensitive values, just show which variables are set
Object.keys(combinedEnv).forEach(key => {
  console.log(`- ${key}: ${key.includes('SECRET') || key.includes('PASSWORD') ? '[HIDDEN]' : combinedEnv[key]}`);
}); 