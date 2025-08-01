import { test, expect } from '@playwright/test'

test.describe('Performance Tests', () => {
  test('should load pages within acceptable time limits', async ({ page }) => {
    // Test home page load time
    const startTime = Date.now()
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const homeLoadTime = Date.now() - startTime
    
    expect(homeLoadTime).toBeLessThan(3000) // 3 seconds
    
    // Test login page
    const loginStartTime = Date.now()
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    const loginLoadTime = Date.now() - loginStartTime
    
    expect(loginLoadTime).toBeLessThan(2000) // 2 seconds
  })

  test('should handle large data sets efficiently', async ({ page }) => {
    // Login as admin
    await page.goto('/login')
    await page.fill('[data-testid="email"]', 'admin@acmelogistics.jm')
    await page.fill('[data-testid="password"]', 'password123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/admin')
    
    // Navigate to packages page with large dataset
    const startTime = Date.now()
    await page.goto('/admin/packages')
    await page.waitForSelector('tbody tr', { timeout: 10000 })
    const loadTime = Date.now() - startTime
    
    expect(loadTime).toBeLessThan(5000) // 5 seconds for data-heavy page
    
    // Test pagination performance
    if (await page.locator('[data-testid="next-page"]').isVisible()) {
      const paginationStartTime = Date.now()
      await page.click('[data-testid="next-page"]')
      await page.waitForSelector('tbody tr')
      const paginationTime = Date.now() - paginationStartTime
      
      expect(paginationTime).toBeLessThan(2000) // 2 seconds for pagination
    }
  })

  test('should maintain performance with concurrent users', async ({ browser }) => {
    // Simulate multiple users accessing the system
    const contexts = await Promise.all([
      browser.newContext(),
      browser.newContext(),
      browser.newContext()
    ])
    
    const pages = await Promise.all(contexts.map(ctx => ctx.newPage()))
    
    // Login all users concurrently
    const loginPromises = pages.map(async (page, index) => {
      const startTime = Date.now()
      await page.goto('/login')
      await page.fill('[data-testid="email"]', `user${index + 1}@acmelogistics.jm`)
      await page.fill('[data-testid="password"]', 'password123')
      await page.click('[data-testid="login-button"]')
      await page.waitForURL('/customer')
      return Date.now() - startTime
    })
    
    const loginTimes = await Promise.all(loginPromises)
    
    // All logins should complete within reasonable time
    loginTimes.forEach(time => {
      expect(time).toBeLessThan(5000) // 5 seconds even with concurrent load
    })
    
    // Cleanup
    await Promise.all(contexts.map(ctx => ctx.close()))
  })

  test('should handle search operations efficiently', async ({ page }) => {
    // Login as admin
    await page.goto('/login')
    await page.fill('[data-testid="email"]', 'admin@acmelogistics.jm')
    await page.fill('[data-testid="password"]', 'password123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/admin')
    
    await page.goto('/admin/packages')
    
    // Test search performance
    const searchStartTime = Date.now()
    await page.fill('[data-testid="search-input"]', 'PKG')
    await page.click('[data-testid="search-button"]')
    
    // Wait for search results
    await page.waitForSelector('tbody tr', { timeout: 5000 })
    const searchTime = Date.now() - searchStartTime
    
    expect(searchTime).toBeLessThan(3000) // 3 seconds for search
    
    // Test real-time search if implemented
    const realtimeSearchInput = page.locator('[data-testid="realtime-search"]')
    if (await realtimeSearchInput.isVisible()) {
      const realtimeStartTime = Date.now()
      await realtimeSearchInput.fill('test')
      
      // Wait for results to appear
      await page.waitForSelector('[data-testid="search-results"]')
      const realtimeSearchTime = Date.now() - realtimeStartTime
      
      expect(realtimeSearchTime).toBeLessThan(1000) // 1 second for real-time search
    }
  })

  test('should optimize image loading', async ({ page }) => {
    await page.goto('/')
    
    // Check for lazy loading images
    const images = page.locator('img')
    const imageCount = await images.count()
    
    if (imageCount > 0) {
      // Check that images have loading="lazy" attribute where appropriate
      for (let i = 0; i < Math.min(imageCount, 5); i++) {
        const img = images.nth(i)
        const loading = await img.getAttribute('loading')
        const src = await img.getAttribute('src')
        
        // Above-the-fold images might not be lazy loaded
        if (src && !src.includes('hero') && !src.includes('logo')) {
          expect(loading).toBe('lazy')
        }
      }
    }
  })

  test('should handle form submissions efficiently', async ({ page }) => {
    // Login as customer
    await page.goto('/login')
    await page.fill('[data-testid="email"]', 'customer@acmelogistics.jm')
    await page.fill('[data-testid="password"]', 'password123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/customer')
    
    // Test profile update form
    await page.goto('/customer/profile')
    
    const formStartTime = Date.now()
    await page.fill('[data-testid="firstName"]', 'Updated Name')
    await page.fill('[data-testid="phone"]', '+1876555-0199')
    await page.click('[data-testid="save-profile-button"]')
    
    // Wait for success message
    await expect(page.getByText(/profile.*updated/i)).toBeVisible()
    const formSubmissionTime = Date.now() - formStartTime
    
    expect(formSubmissionTime).toBeLessThan(3000) // 3 seconds for form submission
  })

  test('should optimize bundle size', async ({ page }) => {
    // Navigate to different pages and check for efficient resource loading
    const pages = [
      '/',
      '/login',
      '/customer',
      '/admin'
    ]
    
    for (const pagePath of pages) {
      // Track network requests
      const responses: any[] = []
      page.on('response', response => {
        if (response.url().includes('.js') || response.url().includes('.css')) {
          responses.push({
            url: response.url(),
            size: response.headers()['content-length'],
            status: response.status()
          })
        }
      })
      
      await page.goto(pagePath)
      await page.waitForLoadState('networkidle')
      
      // Check that JavaScript bundles are not excessively large
      const jsResponses = responses.filter(r => r.url.includes('.js'))
      jsResponses.forEach(response => {
        if (response.size) {
          const sizeInKB = parseInt(response.size) / 1024
          // Main bundle should be under 500KB
          if (response.url.includes('main') || response.url.includes('app')) {
            expect(sizeInKB).toBeLessThan(500)
          }
        }
      })
    }
  })
})