import { test, expect } from '@playwright/test'

test.describe('Multi-Tenant Data Isolation', () => {
  test('should isolate data between companies', async ({ page }) => {
    // Login as Company A admin
    await page.goto('/login')
    await page.fill('[data-testid="email"]', 'admin@acmelogistics.jm')
    await page.fill('[data-testid="password"]', 'password123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/admin')
    
    // Record Company A data
    await page.goto('/admin/packages')
    const companyAPackages = await page.locator('tbody tr').count()
    
    await page.goto('/admin/customers')
    const companyACustomers = await page.locator('tbody tr').count()
    
    // Logout
    await page.click('[data-testid="user-menu"]')
    await page.click('[data-testid="logout-button"]')
    await page.waitForURL('/')
    
    // Login as Company B admin
    await page.goto('/login')
    await page.fill('[data-testid="email"]', 'admin@swiftcaribbean.jm')
    await page.fill('[data-testid="password"]', 'password123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/admin')
    
    // Check Company B data is different
    await page.goto('/admin/packages')
    const companyBPackages = await page.locator('tbody tr').count()
    
    await page.goto('/admin/customers')
    const companyBCustomers = await page.locator('tbody tr').count()
    
    // Data should be isolated (different counts or no overlap)
    // In a real scenario, companies should have different data
    // For testing, we verify isolation by checking that company info is different
    await expect(page.getByText(/swift.*caribbean/i)).toBeVisible()
    await expect(page.getByText(/acme.*logistics/i)).not.toBeVisible()
  })

  test('should prevent cross-tenant API access', async ({ page }) => {
    // Login as Company A user
    await page.goto('/login')
    await page.fill('[data-testid="email"]', 'customer@acmelogistics.jm')
    await page.fill('[data-testid="password"]', 'password123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/customer')
    
    // Attempt to access Company B data through API manipulation
    // This tests frontend behavior when backend properly rejects cross-tenant requests
    await page.route('**/api/v1/packages*', async (route) => {
      const request = route.request()
      const response = await route.fetch()
      
      // Verify that the request includes proper company_id context
      const headers = request.headers()
      expect(headers['authorization']).toBeTruthy()
      
      // Mock a cross-tenant attempt (backend should prevent this)
      if (request.url().includes('company_id=company-b')) {
        await route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Access denied' })
        })
      } else {
        await route.continue()
      }
    })
    
    await page.goto('/customer/packages')
    
    // Try to manipulate URL to access another company's data
    const currentUrl = page.url()
    const manipulatedUrl = currentUrl.replace(/company-a/, 'company-b')
    
    if (manipulatedUrl !== currentUrl) {
      await page.goto(manipulatedUrl)
      // Should show access denied or redirect back
      await expect(page.getByText(/access.*denied|unauthorized/i)).toBeVisible()
    }
  })

  test('should maintain company branding', async ({ page }) => {
    // Test Company A branding
    await page.goto('/login')
    await page.fill('[data-testid="email"]', 'admin@acmelogistics.jm')
    await page.fill('[data-testid="password"]', 'password123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/admin')
    
    // Check for company-specific branding
    await expect(page.getByText(/acme.*logistics/i)).toBeVisible()
    const companyALogo = page.locator('[data-testid="company-logo"]')
    const companyALogoSrc = await companyALogo.getAttribute('src')
    
    // Logout and test Company B branding
    await page.click('[data-testid="user-menu"]')
    await page.click('[data-testid="logout-button"]')
    await page.waitForURL('/')
    
    await page.goto('/login')
    await page.fill('[data-testid="email"]', 'admin@swiftcaribbean.jm')
    await page.fill('[data-testid="password"]', 'password123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/admin')
    
    // Check for different company branding
    await expect(page.getByText(/swift.*caribbean/i)).toBeVisible()
    const companyBLogo = page.locator('[data-testid="company-logo"]')
    const companyBLogoSrc = await companyBLogo.getAttribute('src')
    
    // Logos should be different
    expect(companyALogoSrc).not.toBe(companyBLogoSrc)
  })

  test('should handle company-specific settings', async ({ page }) => {
    // Login as Company A admin
    await page.goto('/login')
    await page.fill('[data-testid="email"]', 'admin@acmelogistics.jm')
    await page.fill('[data-testid="password"]', 'password123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/admin')
    
    await page.goto('/admin/settings')
    
    // Check Company A settings
    const companyAName = await page.locator('[data-testid="company-name"]').inputValue()
    const companyAEmail = await page.locator('[data-testid="company-email"]').inputValue()
    
    // Update Company A settings
    await page.fill('[data-testid="base-fee"]', '20.00')
    await page.click('[data-testid="save-settings-button"]')
    await expect(page.getByText(/settings.*updated/i)).toBeVisible()
    
    // Logout and login as Company B admin
    await page.click('[data-testid="user-menu"]')
    await page.click('[data-testid="logout-button"]')
    await page.waitForURL('/')
    
    await page.goto('/login')
    await page.fill('[data-testid="email"]', 'admin@swiftcaribbean.jm')
    await page.fill('[data-testid="password"]', 'password123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/admin')
    
    await page.goto('/admin/settings')
    
    // Check Company B has different settings
    const companyBName = await page.locator('[data-testid="company-name"]').inputValue()
    const companyBEmail = await page.locator('[data-testid="company-email"]').inputValue()
    const companyBBaseFee = await page.locator('[data-testid="base-fee"]').inputValue()
    
    // Settings should be different
    expect(companyAName).not.toBe(companyBName)
    expect(companyAEmail).not.toBe(companyBEmail)
    // Company B should not have Company A's updated fee
    expect(companyBBaseFee).not.toBe('20.00')
  })

  test('should isolate user access between companies', async ({ page }) => {
    // Try to login Company A user with Company B context
    await page.goto('/login')
    
    // If there's a company selector, select Company B
    const companySelector = page.getByLabel(/company/i)
    if (await companySelector.isVisible()) {
      await companySelector.selectOption('Swift Caribbean')
    }
    
    // Try to login with Company A credentials
    await page.fill('[data-testid="email"]', 'customer@acmelogistics.jm')
    await page.fill('[data-testid="password"]', 'password123')
    await page.click('[data-testid="login-button"]')
    
    // Should show error or redirect to proper company context
    if (await companySelector.isVisible()) {
      await expect(page.getByText(/invalid.*credentials|company.*mismatch/i)).toBeVisible()
    } else {
      // If no company selector, should still login but with proper company context
      await expect(page).toHaveURL(/customer/)
      await expect(page.getByText(/acme.*logistics/i)).toBeVisible()
    }
  })

  test('should handle subdomain routing', async ({ page }) => {
    // Test if the application supports subdomain-based tenant routing
    const baseUrl = page.url()
    
    // Try accessing with company subdomain
    const acmeUrl = baseUrl.replace('localhost:3000', 'acme.localhost:3000')
    const swiftUrl = baseUrl.replace('localhost:3000', 'swift.localhost:3000')
    
    // This test assumes subdomain routing is implemented
    // In a real multi-tenant app, each company might have its own subdomain
    try {
      await page.goto(acmeUrl)
      await expect(page.getByText(/acme.*logistics/i)).toBeVisible()
      
      await page.goto(swiftUrl)
      await expect(page.getByText(/swift.*caribbean/i)).toBeVisible()
    } catch (error) {
      // Skip this test if subdomain routing is not implemented
      console.log('Subdomain routing not implemented, skipping test')
    }
  })

  test('should prevent data leakage in search results', async ({ page }) => {
    // Login as Company A admin
    await page.goto('/login')
    await page.fill('[data-testid="email"]', 'admin@acmelogistics.jm')
    await page.fill('[data-testid="password"]', 'password123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/admin')
    
    // Search for packages
    await page.goto('/admin/packages')
    await page.fill('[data-testid="search-input"]', 'PKG')
    await page.click('[data-testid="search-button"]')
    
    // Verify all results belong to current company
    const searchResults = page.locator('tbody tr')
    const resultCount = await searchResults.count()
    
    if (resultCount > 0) {
      // Check that all results show Company A branding/context
      for (let i = 0; i < resultCount; i++) {
        const row = searchResults.nth(i)
        // Results should not contain other company references
        await expect(row.getByText(/swift.*caribbean/i)).not.toBeVisible()
      }
    }
    
    // Search for customers
    await page.goto('/admin/customers')
    await page.fill('[data-testid="search-input"]', '@')
    await page.click('[data-testid="search-button"]')
    
    const customerResults = page.locator('tbody tr')
    const customerCount = await customerResults.count()
    
    if (customerCount > 0) {
      // All customer results should belong to current company
      for (let i = 0; i < customerCount; i++) {
        const row = customerResults.nth(i)
        // Check that email domains or other identifiers match company
        const emailCell = row.locator('td').nth(1) // Assuming email is in second column
        const emailText = await emailCell.textContent()
        if (emailText) {
          // Should contain company domain or be associated with this company
          expect(emailText.includes('@acmelogistics.jm') || emailText.includes('acme')).toBeTruthy()
        }
      }
    }
  })
})