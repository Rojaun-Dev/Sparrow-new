import { FullConfig } from '@playwright/test'

async function globalTeardown(config: FullConfig) {
  // Perform cleanup tasks here
  console.log('Running global teardown...')
  
  // Example cleanup tasks:
  // - Clean up test database
  // - Remove test files
  // - Reset test state
}

export default globalTeardown