import { testUsers, testCompanies } from './users'

export const testPackages = {
  acmePackage1: {
    id: 'pkg-acme-001',
    companyId: testCompanies.acmeLogistics.id,
    userId: testUsers.acmeCustomer.id,
    trackingNumber: 'AC123456789JM',
    senderName: 'Amazon Warehouse',
    senderAddress: '1234 Warehouse Blvd, Miami, FL 33101, USA',
    recipientName: 'John Doe',
    recipientAddress: '123 Customer Lane, Kingston, Jamaica',
    recipientPhone: '+1-876-555-1001',
    description: 'Electronics - Laptop Computer',
    weight: 3.5,
    declaredValue: 1200.00,
    status: 'in_transit' as const,
    estimatedDelivery: '2024-08-05',
    trackingHistory: [
      {
        status: 'received',
        location: 'Miami Warehouse',
        timestamp: '2024-08-01T10:00:00Z',
        description: 'Package received at Miami facility'
      },
      {
        status: 'in_transit',
        location: 'Kingston Sorting Facility',
        timestamp: '2024-08-02T14:30:00Z',
        description: 'Package arrived in Kingston'
      }
    ],
    createdAt: '2024-08-01T10:00:00Z',
    updatedAt: '2024-08-02T14:30:00Z',
  },
  
  acmePackage2: {
    id: 'pkg-acme-002',
    companyId: testCompanies.acmeLogistics.id,
    userId: testUsers.acmeCustomer.id,
    trackingNumber: 'AC987654321JM',
    senderName: 'eBay Seller',
    senderAddress: '5678 Commerce St, Los Angeles, CA 90210, USA',
    recipientName: 'John Doe',
    recipientAddress: '123 Customer Lane, Kingston, Jamaica',
    recipientPhone: '+1-876-555-1001',
    description: 'Clothing - Designer Shoes',
    weight: 1.2,
    declaredValue: 350.00,
    status: 'delivered' as const,
    estimatedDelivery: '2024-07-30',
    trackingHistory: [
      {
        status: 'received',
        location: 'Los Angeles Warehouse',
        timestamp: '2024-07-25T08:00:00Z',
        description: 'Package received at LA facility'
      },
      {
        status: 'in_transit',
        location: 'Kingston Sorting Facility',
        timestamp: '2024-07-28T12:00:00Z',
        description: 'Package arrived in Kingston'
      },
      {
        status: 'delivered',
        location: 'Customer Address',
        timestamp: '2024-07-30T16:45:00Z',
        description: 'Package delivered to recipient'
      }
    ],
    createdAt: '2024-07-25T08:00:00Z',
    updatedAt: '2024-07-30T16:45:00Z',
  },
  
  swiftPackage1: {
    id: 'pkg-swift-001',
    companyId: testCompanies.swiftShipping.id,
    userId: testUsers.swiftCustomer.id,
    trackingNumber: 'SW456789123JM',
    senderName: 'Apple Store',
    senderAddress: '9876 Tech Plaza, New York, NY 10001, USA',
    recipientName: 'Jane Smith',
    recipientAddress: '456 Customer Avenue, Spanish Town, Jamaica',
    recipientPhone: '+1-876-555-2001',
    description: 'Electronics - iPhone 15 Pro',
    weight: 0.8,
    declaredValue: 999.00,
    status: 'pending' as const,
    estimatedDelivery: '2024-08-10',
    trackingHistory: [
      {
        status: 'received',
        location: 'New York Warehouse',
        timestamp: '2024-08-03T09:15:00Z',
        description: 'Package received at NY facility'
      }
    ],
    createdAt: '2024-08-03T09:15:00Z',
    updatedAt: '2024-08-03T09:15:00Z',
  },
}

export const createMockPackage = (overrides: Partial<typeof testPackages.acmePackage1> = {}) => ({
  id: `pkg-${Date.now()}`,
  companyId: testCompanies.acmeLogistics.id,
  userId: testUsers.acmeCustomer.id,
  trackingNumber: `TK${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
  senderName: 'Test Sender',
  senderAddress: 'Test Sender Address',
  recipientName: 'Test Recipient',
  recipientAddress: 'Test Recipient Address',
  recipientPhone: '+1-876-555-0000',
  description: 'Test Package',
  weight: 1.0,
  declaredValue: 100.00,
  status: 'pending' as const,
  estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  trackingHistory: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
})