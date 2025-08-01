#!/usr/bin/env node

/**
 * Validation script for frontend testing setup
 * This script verifies that all testing infrastructure is properly configured
 */

const fs = require('fs')
const path = require('path')

console.log('🧪 Validating Frontend Testing Setup...\n')

const checks = [
  {
    name: 'Jest Configuration',
    check: () => fs.existsSync(path.join(__dirname, '../jest.config.js')),
    description: 'Jest configuration file exists'
  },
  {
    name: 'Playwright Configuration', 
    check: () => fs.existsSync(path.join(__dirname, '../playwright.config.ts')),
    description: 'Playwright configuration file exists'
  },
  {
    name: 'Test Setup Files',
    check: () => fs.existsSync(path.join(__dirname, 'setup/setupTests.ts')),
    description: 'Jest setup file exists'
  },
  {
    name: 'Test Utilities',
    check: () => fs.existsSync(path.join(__dirname, 'setup/testUtils.tsx')),
    description: 'Custom render utilities exist'
  },
  {
    name: 'Test Fixtures',
    check: () => fs.existsSync(path.join(__dirname, 'fixtures/users.ts')),
    description: 'Test data fixtures exist'
  },
  {
    name: 'MSW Handlers',
    check: () => fs.existsSync(path.join(__dirname, 'mocks/handlers/index.ts')),
    description: 'API mock handlers exist'
  },
  {
    name: 'Component Tests',
    check: () => fs.existsSync(path.join(__dirname, '../__tests__/components/ui/button.test.tsx')),
    description: 'Example component tests exist'
  },
  {
    name: 'E2E Tests',
    check: () => fs.existsSync(path.join(__dirname, 'e2e/auth.spec.ts')),
    description: 'End-to-end tests exist'
  },
  {
    name: 'Multi-tenant Tests',
    check: () => fs.existsSync(path.join(__dirname, 'e2e/multi-tenant.spec.ts')),
    description: 'Multi-tenant isolation tests exist'
  }
]

let passed = 0
let failed = 0

checks.forEach(({ name, check, description }) => {
  const result = check()
  const status = result ? '✅' : '❌'
  const statusText = result ? 'PASS' : 'FAIL'
  
  console.log(`${status} ${name}: ${description} - ${statusText}`)
  
  if (result) {
    passed++
  } else {
    failed++
  }
})

console.log(`\n📊 Test Setup Validation Results:`)
console.log(`✅ Passed: ${passed}`)
console.log(`❌ Failed: ${failed}`)
console.log(`📈 Success Rate: ${Math.round((passed / checks.length) * 100)}%`)

if (failed === 0) {
  console.log('\n🎉 All checks passed! Frontend testing setup is complete.')
  console.log('\n📚 Available Testing Commands:')
  console.log('  npm run test           - Run unit tests')
  console.log('  npm run test:watch     - Run tests in watch mode')
  console.log('  npm run test:coverage  - Run tests with coverage')
  console.log('  npm run test:ci        - Run tests in CI mode')
  console.log('  npm run test:e2e       - Run E2E tests')
  console.log('  npm run test:e2e:ui    - Run E2E tests with UI')
  console.log('  npm run test:all       - Run all tests')
} else {
  console.log('\n⚠️  Some checks failed. Please review the setup.')
  process.exit(1)
}