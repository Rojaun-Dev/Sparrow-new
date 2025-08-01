import { chromium, FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  // Launch browser and create context
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  // Perform authentication steps
  await page.goto(process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000')
  
  // You can perform global setup here like:
  // - Setting up test database
  // - Creating test users
  // - Authenticating admin users
  
  // Example: Login as admin user for tests that require authentication
  try {
    await page.goto('/login')
    await page.fill('[data-testid="email"]', 'admin@acmelogistics.jm')
    await page.fill('[data-testid="password"]', 'password123')
    await page.click('[data-testid="login-button"]')
    
    // Wait for successful login
    await page.waitForURL('/admin')
    
    // Save authentication state
    await page.context().storageState({ path: 'playwright/.auth/admin.json' })
  } catch (error) {
    console.log('Authentication setup failed, tests will run without auth state')
  }

  await browser.close()
}

export default globalSetup