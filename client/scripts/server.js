const { spawn } = require('child_process');
const loadEnvVariables = require('./load-env');

/**
 * Custom server script that ensures environment variables are loaded
 * before starting the Next.js server
 */
async function startServer() {
  // Load environment variables first
  loadEnvVariables();
  
  console.log('Environment variables loaded, starting Next.js server...');
  
  // Determine which Next.js script to run based on first argument
  const scriptArg = process.argv[2] || 'dev';
  let nextCommand = '';
  
  switch (scriptArg) {
    case 'build':
      nextCommand = 'next build';
      break;
    case 'start':
      nextCommand = 'next start';
      break;
    case 'dev':
    default:
      nextCommand = 'next dev';
      break;
  }
  
  console.log(`Running: ${nextCommand}`);
  
  // Start Next.js process
  const [cmd, ...args] = nextCommand.split(' ');
  const nextProcess = spawn(cmd, args, {
    stdio: 'inherit',
    shell: true
  });
  
  // Handle process exit
  nextProcess.on('close', (code) => {
    process.exit(code);
  });
  
  // Handle process errors
  nextProcess.on('error', (err) => {
    console.error('Failed to start Next.js process:', err);
    process.exit(1);
  });
}

// Start the server
startServer().catch(error => {
  console.error('Server startup error:', error);
  process.exit(1);
}); 