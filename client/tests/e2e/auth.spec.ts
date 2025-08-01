import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/.*login/)
  })

  test('should display login form', async ({ page }) => {
    await page.goto('/login')
    
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })

  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/login')
    
    await page.fill('[data-testid="email"]', 'admin@acmelogistics.jm')
    await page.fill('[data-testid="password"]', 'password123')
    await page.click('[data-testid="login-button"]')
    
    // Should redirect to admin dashboard
    await expect(page).toHaveURL(/.*admin/)
    await expect(page.getByText(/dashboard/i)).toBeVisible()
  })

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login')
    
    await page.fill('[data-testid="email"]', 'wrong@example.com')
    await page.fill('[data-testid="password"]', 'wrongpassword')
    await page.click('[data-testid="login-button"]')
    
    await expect(page.getByText(/invalid.*credentials/i)).toBeVisible()
    // Should stay on login page
    await expect(page).toHaveURL(/.*login/)
  })

  test('should validate email format', async ({ page }) => {
    await page.goto('/login')
    
    await page.fill('[data-testid="email"]', 'invalid-email')
    await page.fill('[data-testid="password"]', 'password123')
    await page.click('[data-testid="login-button"]')
    
    // HTML5 validation should prevent submission
    const emailInput = page.getByLabel(/email/i)
    const validationMessage = await emailInput.evaluate((el: HTMLInputElement) => el.validationMessage)
    expect(validationMessage).toBeTruthy()
  })

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/login')
    await page.fill('[data-testid="email"]', 'admin@acmelogistics.jm')
    await page.fill('[data-testid="password"]', 'password123')
    await page.click('[data-testid="login-button"]')
    
    await expect(page).toHaveURL(/.*admin/)
    
    // Logout
    await page.click('[data-testid="user-menu"]')
    await page.click('[data-testid="logout-button"]')
    
    // Should redirect to home page
    await expect(page).toHaveURL('/')
    
    // Accessing admin should redirect to login again
    await page.goto('/admin')
    await expect(page).toHaveURL(/.*login/)
  })

  test('should handle registration flow', async ({ page }) => {
    await page.goto('/register')
    
    await expect(page.getByText(/create.*account/i)).toBeVisible()
    await expect(page.getByLabel(/first.*name/i)).toBeVisible()
    await expect(page.getByLabel(/last.*name/i)).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    
    // Fill registration form
    await page.fill('[data-testid="firstName"]', 'Test')
    await page.fill('[data-testid="lastName"]', 'User')
    await page.fill('[data-testid="email"]', 'newuser@example.com')
    await page.fill('[data-testid="password"]', 'password123')
    await page.fill('[data-testid="confirmPassword"]', 'password123')
    
    // Submit form
    await page.click('[data-testid="register-button"]')
    
    // Should show success message or redirect
    await expect(page.getByText(/registration.*successful/i)).toBeVisible()
  })
})

test.describe('Multi-tenant Authentication', () => {
  test('should handle company selection during login', async ({ page }) => {
    await page.goto('/login')
    
    // If multiple companies are available, should show company selector
    const companySelector = page.getByLabel(/company/i)
    if (await companySelector.isVisible()) {
      await companySelector.selectOption('ACME Logistics')
    }
    
    await page.fill('[data-testid="email"]', 'admin@acmelogistics.jm')
    await page.fill('[data-testid="password"]', 'password123')
    await page.click('[data-testid="login-button"]')
    
    await expect(page).toHaveURL(/.*admin/)
    
    // Should display company information in header
    await expect(page.getByText(/acme.*logistics/i)).toBeVisible()
  })

  test('should prevent cross-tenant access', async ({ page }) => {
    // Login as Company A user
    await page.goto('/login')
    await page.fill('[data-testid="email"]', 'admin@acmelogistics.jm')
    await page.fill('[data-testid="password"]', 'password123')
    await page.click('[data-testid="login-button"]')
    
    await expect(page).toHaveURL(/.*admin/)
    
    // Try to access another company's data by manipulating URL
    // This should be prevented by the backend, but we test the frontend behavior
    const currentUrl = page.url()
    const manipulatedUrl = currentUrl.replace(/company-a/, 'company-b')
    
    if (manipulatedUrl !== currentUrl) {
      await page.goto(manipulatedUrl)
      // Should redirect back or show access denied
      await expect(page.getByText(/access.*denied|unauthorized/i)).toBeVisible()
    }
  })
})