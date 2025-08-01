import { test, expect } from '@playwright/test'

test.describe('Admin Portal', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login')
    await page.fill('[data-testid="email"]', 'admin@acmelogistics.jm')
    await page.fill('[data-testid="password"]', 'password123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/admin')
  })

  test('should display admin dashboard', async ({ page }) => {
    await expect(page.getByText(/admin.*dashboard/i)).toBeVisible()
    await expect(page.getByText(/total.*packages/i)).toBeVisible()
    await expect(page.getByText(/active.*customers/i)).toBeVisible()
    await expect(page.getByText(/revenue/i)).toBeVisible()
    
    // Should display charts and metrics
    await expect(page.locator('[data-testid="packages-chart"]')).toBeVisible()
    await expect(page.locator('[data-testid="revenue-chart"]')).toBeVisible()
  })

  test('should manage packages', async ({ page }) => {
    await page.goto('/admin/packages')
    
    await expect(page.getByText(/package.*management/i)).toBeVisible()
    await expect(page.getByRole('table')).toBeVisible()
    
    // Create new package
    await page.click('[data-testid="add-package-button"]')
    
    await page.fill('[data-testid="trackingNumber"]', 'PKG' + Date.now())
    await page.fill('[data-testid="customerEmail"]', 'customer@acmelogistics.jm')
    await page.fill('[data-testid="description"]', 'Test package')
    await page.fill('[data-testid="weight"]', '1.5')
    await page.fill('[data-testid="value"]', '100.00')
    await page.selectOption('[data-testid="status"]', 'received')
    
    await page.click('[data-testid="save-package-button"]')
    
    await expect(page.getByText(/package.*created/i)).toBeVisible()
  })

  test('should update package status', async ({ page }) => {
    await page.goto('/admin/packages')
    
    // Find first package row
    const firstRow = page.locator('tbody tr').first()
    await firstRow.click()
    
    // Update status
    await page.selectOption('[data-testid="status-select"]', 'in_transit')
    await page.fill('[data-testid="status-notes"]', 'Package shipped via DHL')
    await page.click('[data-testid="update-status-button"]')
    
    await expect(page.getByText(/status.*updated/i)).toBeVisible()
    await expect(page.getByText(/in.*transit/i)).toBeVisible()
  })

  test('should manage customers', async ({ page }) => {
    await page.goto('/admin/customers')
    
    await expect(page.getByText(/customer.*management/i)).toBeVisible()
    await expect(page.getByRole('table')).toBeVisible()
    
    // Search for customer
    await page.fill('[data-testid="search-input"]', 'customer@acmelogistics.jm')
    await page.click('[data-testid="search-button"]')
    
    await expect(page.getByText(/customer@acmelogistics\.jm/i)).toBeVisible()
    
    // View customer details
    await page.click('[data-testid="view-customer-button"]')
    
    await expect(page.getByText(/customer.*details/i)).toBeVisible()
    await expect(page.getByText(/package.*history/i)).toBeVisible()
    await expect(page.getByText(/contact.*information/i)).toBeVisible()
  })

  test('should handle bulk operations', async ({ page }) => {
    await page.goto('/admin/packages')
    
    // Select multiple packages
    await page.check('[data-testid="select-package-1"]')
    await page.check('[data-testid="select-package-2"]')
    
    // Bulk status update
    await page.click('[data-testid="bulk-actions-button"]')
    await page.click('[data-testid="bulk-status-update"]')
    
    await page.selectOption('[data-testid="bulk-status"]', 'delivered')
    await page.click('[data-testid="apply-bulk-update"]')
    
    await expect(page.getByText(/\d+.*packages.*updated/i)).toBeVisible()
  })

  test('should generate reports', async ({ page }) => {
    await page.goto('/admin/reports')
    
    await expect(page.getByText(/reports.*analytics/i)).toBeVisible()
    
    // Generate monthly report
    await page.selectOption('[data-testid="report-type"]', 'monthly')
    await page.fill('[data-testid="start-date"]', '2024-01-01')
    await page.fill('[data-testid="end-date"]', '2024-01-31')
    await page.click('[data-testid="generate-report-button"]')
    
    // Should display report data
    await expect(page.getByText(/report.*generated/i)).toBeVisible()
    await expect(page.locator('[data-testid="report-chart"]')).toBeVisible()
    
    // Download report
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('[data-testid="download-report-button"]')
    ])
    
    expect(download.suggestedFilename()).toContain('report')
  })

  test('should manage fees and pricing', async ({ page }) => {
    await page.goto('/admin/fees')
    
    await expect(page.getByText(/fees.*management/i)).toBeVisible()
    
    // Update base shipping fee
    await page.fill('[data-testid="base-fee"]', '15.00')
    await page.fill('[data-testid="per-pound-fee"]', '2.50')
    await page.check('[data-testid="enable-dimensional-pricing"]')
    
    await page.click('[data-testid="save-fees-button"]')
    
    await expect(page.getByText(/fees.*updated/i)).toBeVisible()
    
    // Add tiered pricing
    await page.click('[data-testid="add-tier-button"]')
    
    await page.fill('[data-testid="tier-min-weight"]', '5')
    await page.fill('[data-testid="tier-max-weight"]', '10')
    await page.fill('[data-testid="tier-rate"]', '2.25')
    
    await page.click('[data-testid="save-tier-button"]')
    
    await expect(page.getByText(/tier.*added/i)).toBeVisible()
  })

  test('should handle notifications', async ({ page }) => {
    await page.goto('/admin/notifications')
    
    await expect(page.getByText(/notifications/i)).toBeVisible()
    
    // Create broadcast notification
    await page.click('[data-testid="create-notification-button"]')
    
    await page.fill('[data-testid="notification-title"]', 'System Maintenance')
    await page.fill('[data-testid="notification-message"]', 'Scheduled maintenance tonight from 10 PM to 2 AM')
    await page.selectOption('[data-testid="notification-type"]', 'info')
    await page.check('[data-testid="send-to-all-customers"]')
    
    await page.click('[data-testid="send-notification-button"]')
    
    await expect(page.getByText(/notification.*sent/i)).toBeVisible()
  })

  test('should manage company settings', async ({ page }) => {
    await page.goto('/admin/settings')
    
    await expect(page.getByText(/company.*settings/i)).toBeVisible()
    
    // Update company information
    await page.fill('[data-testid="company-name"]', 'ACME Logistics Ltd.')
    await page.fill('[data-testid="company-email"]', 'info@acmelogistics.jm')
    await page.fill('[data-testid="company-phone"]', '+1876555-0100')
    await page.fill('[data-testid="company-address"]', '123 Business Blvd, Kingston, Jamaica')
    
    // Upload company logo
    const logoInput = page.locator('[data-testid="logo-input"]')
    const buffer = Buffer.from('fake image data')
    await logoInput.setInputFiles({
      name: 'logo.png',
      mimeType: 'image/png',
      buffer: buffer,
    })
    
    await page.click('[data-testid="save-settings-button"]')
    
    await expect(page.getByText(/settings.*updated/i)).toBeVisible()
  })

  test('should handle user management', async ({ page }) => {
    await page.goto('/admin/users')
    
    await expect(page.getByText(/user.*management/i)).toBeVisible()
    
    // Create new admin user
    await page.click('[data-testid="add-user-button"]')
    
    await page.fill('[data-testid="firstName"]', 'New')
    await page.fill('[data-testid="lastName"]', 'Admin')
    await page.fill('[data-testid="email"]', 'newadmin@acmelogistics.jm')
    await page.selectOption('[data-testid="role"]', 'admin_l1')
    await page.fill('[data-testid="password"]', 'password123')
    
    await page.click('[data-testid="create-user-button"]')
    
    await expect(page.getByText(/user.*created/i)).toBeVisible()
    await expect(page.getByText(/newadmin@acmelogistics\.jm/i)).toBeVisible()
  })
})

test.describe('Admin Portal Permissions', () => {
  test('should restrict L1 admin access', async ({ page }) => {
    // Login as L1 admin
    await page.goto('/login')
    await page.fill('[data-testid="email"]', 'admin_l1@acmelogistics.jm')
    await page.fill('[data-testid="password"]', 'password123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/admin')
    
    // Should not see user management
    await expect(page.getByText(/user.*management/i)).not.toBeVisible()
    
    // Should not access settings directly
    await page.goto('/admin/settings')
    await expect(page.getByText(/access.*denied|unauthorized/i)).toBeVisible()
  })

  test('should allow L2 admin full access', async ({ page }) => {
    // Login as L2 admin
    await page.goto('/login')
    await page.fill('[data-testid="email"]', 'admin_l2@acmelogistics.jm')
    await page.fill('[data-testid="password"]', 'password123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/admin')
    
    // Should see all management options
    await expect(page.getByText(/user.*management/i)).toBeVisible()
    await expect(page.getByText(/settings/i)).toBeVisible()
    
    // Should access all admin pages
    await page.goto('/admin/settings')
    await expect(page.getByText(/company.*settings/i)).toBeVisible()
    
    await page.goto('/admin/users')
    await expect(page.getByText(/user.*management/i)).toBeVisible()
  })
})