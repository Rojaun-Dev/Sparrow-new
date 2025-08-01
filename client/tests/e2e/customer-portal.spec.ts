import { test, expect } from '@playwright/test'

test.describe('Customer Portal', () => {
  test.beforeEach(async ({ page }) => {
    // Login as customer
    await page.goto('/login')
    await page.fill('[data-testid="email"]', 'customer@acmelogistics.jm')
    await page.fill('[data-testid="password"]', 'password123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/customer')
  })

  test('should display customer dashboard', async ({ page }) => {
    await expect(page.getByText(/welcome/i)).toBeVisible()
    await expect(page.getByText(/my packages/i)).toBeVisible()
    await expect(page.getByText(/recent activity/i)).toBeVisible()
  })

  test('should allow package tracking', async ({ page }) => {
    await page.click('[data-testid="track-package-button"]')
    
    await page.fill('[data-testid="tracking-number"]', 'PKG123456')
    await page.click('[data-testid="search-button"]')
    
    // Should display package information
    await expect(page.getByText(/package.*details/i)).toBeVisible()
    await expect(page.getByText(/status/i)).toBeVisible()
    await expect(page.getByText(/PKG123456/i)).toBeVisible()
  })

  test('should display package history', async ({ page }) => {
    await page.goto('/customer/packages')
    
    await expect(page.getByRole('table')).toBeVisible()
    await expect(page.getByText(/tracking.*number/i)).toBeVisible()
    await expect(page.getByText(/status/i)).toBeVisible()
    await expect(page.getByText(/date.*created/i)).toBeVisible()
    
    // Should have at least one package row
    const rows = page.locator('tbody tr')
    await expect(rows).toHaveCountGreaterThan(0)
  })

  test('should allow profile management', async ({ page }) => {
    await page.goto('/customer/profile')
    
    await expect(page.getByLabel(/first.*name/i)).toBeVisible()
    await expect(page.getByLabel(/last.*name/i)).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/phone/i)).toBeVisible()
    
    // Update profile information
    await page.fill('[data-testid="firstName"]', 'Updated')
    await page.fill('[data-testid="phone"]', '+1876555-0123')
    await page.click('[data-testid="save-profile-button"]')
    
    await expect(page.getByText(/profile.*updated/i)).toBeVisible()
  })

  test('should handle address management', async ({ page }) => {
    await page.goto('/customer/addresses')
    
    await expect(page.getByText(/shipping.*addresses/i)).toBeVisible()
    
    // Add new address
    await page.click('[data-testid="add-address-button"]')
    
    await page.fill('[data-testid="street"]', '123 Test Street')
    await page.fill('[data-testid="city"]', 'Kingston')
    await page.fill('[data-testid="parish"]', 'St. Andrew')
    await page.fill('[data-testid="postalCode"]', '12345')
    await page.click('[data-testid="save-address-button"]')
    
    await expect(page.getByText(/address.*added/i)).toBeVisible()
    await expect(page.getByText(/123 Test Street/i)).toBeVisible()
  })

  test('should display notifications', async ({ page }) => {
    await page.goto('/customer/notifications')
    
    await expect(page.getByText(/notifications/i)).toBeVisible()
    
    // Should have notification preferences
    await expect(page.getByText(/email.*notifications/i)).toBeVisible()
    await expect(page.getByText(/sms.*notifications/i)).toBeVisible()
    
    // Toggle notification settings
    const emailToggle = page.locator('[data-testid="email-notifications"]')
    await emailToggle.click()
    
    await page.click('[data-testid="save-preferences-button"]')
    await expect(page.getByText(/preferences.*updated/i)).toBeVisible()
  })

  test('should handle package requests', async ({ page }) => {
    await page.goto('/customer/requests')
    
    await expect(page.getByText(/package.*requests/i)).toBeVisible()
    
    // Create new package request
    await page.click('[data-testid="new-request-button"]')
    
    await page.fill('[data-testid="merchant"]', 'Amazon')
    await page.fill('[data-testid="description"]', 'Electronics package')
    await page.fill('[data-testid="value"]', '150.00')
    await page.selectOption('[data-testid="currency"]', 'USD')
    
    await page.click('[data-testid="submit-request-button"]')
    
    await expect(page.getByText(/request.*submitted/i)).toBeVisible()
  })

  test('should calculate shipping costs', async ({ page }) => {
    await page.goto('/customer/calculator')
    
    await expect(page.getByText(/shipping.*calculator/i)).toBeVisible()
    
    // Input package details
    await page.fill('[data-testid="weight"]', '2.5')
    await page.fill('[data-testid="length"]', '12')
    await page.fill('[data-testid="width"]', '8')
    await page.fill('[data-testid="height"]', '6')
    await page.selectOption('[data-testid="destination"]', 'Kingston')
    
    await page.click('[data-testid="calculate-button"]')
    
    // Should display calculated costs
    await expect(page.getByText(/estimated.*cost/i)).toBeVisible()
    await expect(page.getByText(/\$\d+\.\d{2}/)).toBeVisible()
  })

  test('should allow document uploads', async ({ page }) => {
    await page.goto('/customer/documents')
    
    await expect(page.getByText(/my.*documents/i)).toBeVisible()
    
    // Upload a document
    const fileInput = page.locator('[data-testid="file-input"]')
    
    // Create a test file
    const buffer = Buffer.from('test document content')
    await fileInput.setInputFiles({
      name: 'test-document.pdf',
      mimeType: 'application/pdf',
      buffer: buffer,
    })
    
    await page.fill('[data-testid="document-name"]', 'Test Document')
    await page.selectOption('[data-testid="document-type"]', 'invoice')
    await page.click('[data-testid="upload-button"]')
    
    await expect(page.getByText(/document.*uploaded/i)).toBeVisible()
    await expect(page.getByText(/test-document\.pdf/i)).toBeVisible()
  })
})

test.describe('Customer Portal Responsive', () => {
  test('should work on mobile devices', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Login
    await page.goto('/login')
    await page.fill('[data-testid="email"]', 'customer@acmelogistics.jm')
    await page.fill('[data-testid="password"]', 'password123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/customer')
    
    // Should display mobile navigation
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible()
    
    // Open mobile menu
    await page.click('[data-testid="mobile-menu-button"]')
    await expect(page.getByText(/packages/i)).toBeVisible()
    await expect(page.getByText(/profile/i)).toBeVisible()
    
    // Navigate to packages page
    await page.click('[data-testid="packages-link"]')
    await expect(page).toHaveURL('/customer/packages')
    
    // Should display responsive table/cards
    await expect(page.locator('[data-testid="package-card"]')).toBeVisible()
  })
})