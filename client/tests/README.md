# Frontend Testing Guide

This directory contains the complete frontend testing setup for SparrowX, including unit tests, integration tests, and end-to-end tests.

## Testing Stack

- **Jest**: JavaScript testing framework with coverage reporting
- **React Testing Library**: Component testing utilities for React 19
- **MSW (Mock Service Worker)**: API mocking for consistent test data
- **Playwright**: End-to-end testing across multiple browsers
- **Jest Axe**: Accessibility testing integration

## Directory Structure

```
tests/
├── setup/                    # Test configuration and setup files
│   ├── setupTests.ts        # Global Jest configuration
│   └── testUtils.tsx        # Custom render utilities and helpers
├── mocks/                   # API mocking setup
│   ├── server.ts           # MSW server configuration
│   └── handlers/           # API endpoint mock handlers
│       ├── auth.ts         # Authentication endpoints
│       ├── packages.ts     # Package management endpoints
│       └── users.ts        # User management endpoints
├── fixtures/               # Test data and factories
│   ├── users.ts           # User test data
│   ├── packages.ts        # Package test data
│   └── companies.ts       # Company test data
└── e2e/                   # End-to-end test specifications
    ├── auth.spec.ts       # Authentication flows
    ├── customer-portal.spec.ts  # Customer portal workflows
    ├── admin-portal.spec.ts     # Admin portal workflows
    ├── multi-tenant.spec.ts     # Multi-tenant data isolation
    └── performance.spec.ts      # Performance benchmarks
```

## Running Tests

### Unit and Integration Tests (Jest)

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests in CI mode
npm run test:ci
```

### End-to-End Tests (Playwright)

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI mode
npm run test:e2e:ui

# Run E2E tests in headed mode (visible browser)
npm run test:e2e:headed

# Debug E2E tests
npm run test:e2e:debug

# Run all tests (unit + E2E)
npm run test:all
```

## Test Utilities

### Custom Render Function

The `testUtils.tsx` file provides a custom render function that wraps components with necessary providers:

```typescript
import { render } from '@/tests/setup/testUtils'

// Renders with default context
render(<MyComponent />)

// Renders with specific user role
renderWithRole(<MyComponent />, 'admin_l1')

// Renders with specific company context
render(<MyComponent />, {
  company: testCompanies.acmeLogistics,
  user: testUsers.acmeAdmin
})
```

### Test Data Fixtures

Use the test fixtures for consistent test data:

```typescript
import { testUsers, testCompanies, testPackages } from '@/tests/fixtures'

// Use predefined test users
const adminUser = testUsers.acmeAdmin
const customerUser = testUsers.acmeCustomer

// Use predefined test companies
const company = testCompanies.acmeLogistics
```

## Testing Patterns

### Component Testing

```typescript
import { render, screen, user } from '@/tests/setup/testUtils'
import { MyComponent } from '@/components/MyComponent'

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('handles user interactions', async () => {
    const handleClick = jest.fn()
    render(<MyComponent onClick={handleClick} />)
    
    await user.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

### API Mocking with MSW

```typescript
import { server } from '@/tests/mocks/server'
import { http, HttpResponse } from 'msw'

// Override default handlers for specific tests
beforeEach(() => {
  server.use(
    http.get('/api/v1/packages', () => {
      return HttpResponse.json({ packages: [] })
    })
  )
})
```

### Multi-Tenant Testing

```typescript
import { renderWithCompany } from '@/tests/setup/testUtils'
import { testCompanies } from '@/tests/fixtures'

// Test with specific company context
renderWithCompany(<Component />, testCompanies.acmeLogistics)

// Verify data isolation
expect(screen.queryByText('Swift Caribbean')).not.toBeInTheDocument()
```

### E2E Testing Best Practices

```typescript
import { test, expect } from '@playwright/test'

test('should complete user workflow', async ({ page }) => {
  // Use data-testid attributes for reliable selectors
  await page.click('[data-testid="login-button"]')
  
  // Wait for navigation or state changes
  await page.waitForURL('/dashboard')
  
  // Use meaningful assertions
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
})
```

## Coverage Requirements

- **Unit Tests**: Minimum 80% coverage for components and utilities
- **Integration Tests**: All API interactions and complex workflows
- **E2E Tests**: Critical user journeys and multi-tenant scenarios

## Accessibility Testing

Accessibility tests are integrated into component tests:

```typescript
import { axe, toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

it('should be accessible', async () => {
  const { container } = render(<MyComponent />)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

## Multi-Tenant Testing Strategy

### Data Isolation Testing

1. **Component Level**: Test with different company contexts
2. **API Level**: Mock responses with proper tenant filtering
3. **E2E Level**: Verify cross-tenant access prevention

### Role-Based Access Control

Test different user roles and their permissions:

- `customer`: Basic package tracking and profile management
- `admin_l1`: Package management and customer support
- `admin_l2`: Full administrative access including settings
- `super_admin`: System-wide administrative capabilities

## Performance Testing

E2E performance tests verify:

- Page load times (< 3 seconds)
- Search operations (< 2 seconds)
- Form submissions (< 3 seconds)
- Concurrent user handling
- Bundle size optimization

## CI/CD Integration

Tests are configured for continuous integration:

- Jest runs with `--ci --coverage --watchAll=false`
- Playwright generates HTML reports and JUnit XML
- Coverage reports are generated in multiple formats
- Test artifacts are preserved for debugging

## Debugging Tests

### Jest Debugging

```bash
# Debug specific test file
npx jest --debug path/to/test.ts

# Run with verbose output
npm run test -- --verbose
```

### Playwright Debugging

```bash
# Debug with browser inspector
npm run test:e2e:debug

# Run specific test file
npx playwright test auth.spec.ts --debug
```

## Best Practices

1. **Test Organization**: Group related tests in describe blocks
2. **Test Data**: Use fixtures for consistent test data
3. **Async Testing**: Properly handle async operations with await
4. **Clean Tests**: Each test should be independent and clean up after itself
5. **Meaningful Names**: Use descriptive test names that explain the behavior
6. **Arrange-Act-Assert**: Structure tests with clear setup, action, and verification phases
7. **Multi-Tenant Awareness**: Always test with proper tenant context
8. **Accessibility**: Include accessibility tests for all user-facing components