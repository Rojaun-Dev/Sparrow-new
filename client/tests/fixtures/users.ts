import { v4 as uuidv4 } from 'uuid'

// Company test data
export const testCompanies = {
  acmeLogistics: {
    id: 'company-acme-id',
    name: 'ACME Logistics',
    email: 'info@acmelogistics.jm',
    phone: '+1-876-555-0100',
    address: '123 Spanish Town Road, Kingston 11, Jamaica',
    logoUrl: 'https://example.com/acme-logo.png',
    website: 'https://acmelogistics.jm',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  },
  swiftShipping: {
    id: 'company-swift-id',
    name: 'Swift Shipping JA',
    email: 'contact@swiftshipping.jm',
    phone: '+1-876-555-0200',
    address: '456 Half Way Tree Road, Kingston 10, Jamaica',
    logoUrl: 'https://example.com/swift-logo.png',
    website: 'https://swiftshipping.jm',
    createdAt: new Date('2024-01-02T00:00:00Z'),
    updatedAt: new Date('2024-01-02T00:00:00Z'),
  },
}

// User test data
export const testUsers = {
  // ACME Logistics Users
  acmeCustomer: {
    id: 'user-acme-customer-id',
    companyId: testCompanies.acmeLogistics.id,
    email: 'john.doe@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'customer' as const,
    phone: '+1-876-555-1001',
    address: '123 Customer Lane, Kingston, Jamaica',
    isActive: true,
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:00Z'),
  },
  acmeAdmin: {
    id: 'user-acme-admin-id',
    companyId: testCompanies.acmeLogistics.id,
    email: 'admin@acmelogistics.jm',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin_l1' as const,
    phone: '+1-876-555-1002',
    address: '123 Spanish Town Road, Kingston 11, Jamaica',
    isActive: true,
    createdAt: new Date('2024-01-01T09:00:00Z'),
    updatedAt: new Date('2024-01-01T09:00:00Z'),
  },
  
  // Swift Shipping Users
  swiftCustomer: {
    id: 'user-swift-customer-id',
    companyId: testCompanies.swiftShipping.id,
    email: 'jane.smith@example.com',
    firstName: 'Jane',
    lastName: 'Smith',
    role: 'customer' as const,
    phone: '+1-876-555-2001',
    address: '456 Customer Avenue, Spanish Town, Jamaica',
    isActive: true,
    createdAt: new Date('2024-01-02T10:00:00Z'),
    updatedAt: new Date('2024-01-02T10:00:00Z'),
  },
  swiftAdmin: {
    id: 'user-swift-admin-id',
    companyId: testCompanies.swiftShipping.id,
    email: 'admin@swiftshipping.jm',
    firstName: 'Swift',
    lastName: 'Admin',
    role: 'admin_l2' as const,
    phone: '+1-876-555-2002',
    address: '456 Half Way Tree Road, Kingston 10, Jamaica',
    isActive: true,
    createdAt: new Date('2024-01-02T09:00:00Z'),
    updatedAt: new Date('2024-01-02T09:00:00Z'),
  },
}

// Helper functions
export const createMockUser = (overrides: Partial<typeof testUsers.acmeCustomer> = {}) => ({
  id: uuidv4(),
  companyId: testCompanies.acmeLogistics.id,
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'customer' as const,
  phone: '+1-876-555-0000',
  address: 'Test Address',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

export const createMockCompany = (overrides: Partial<typeof testCompanies.acmeLogistics> = {}) => ({
  id: uuidv4(),
  name: 'Test Company',
  email: 'test@company.com',
  phone: '+1-876-555-0000',
  address: 'Test Company Address',
  logoUrl: 'https://example.com/test-logo.png',
  website: 'https://testcompany.com',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})