import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

// Mock Express Request/Response helpers
export const mockRequest = (overrides: Partial<Request> = {}): Partial<Request> => ({
  params: {},
  query: {},
  body: {},
  headers: {},
  user: {
    user_id: uuidv4(),
    company_id: uuidv4(),
    role: 'customer',
    email: 'test@example.com'
  },
  ...overrides,
});

export const mockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
  };
  return res;
};

// Test data factories
export const createTestCompany = () => ({
  id: uuidv4(),
  name: 'Test Company',
  email: 'test@company.com',
  phone: '+1-876-555-0123',
  address: '123 Test Street, Kingston, Jamaica',
  logo_url: 'https://example.com/logo.png',
  website: 'https://testcompany.com',
  created_at: new Date(),
  updated_at: new Date(),
});

export const createTestUser = (companyId?: string) => ({
  id: uuidv4(),
  company_id: companyId || uuidv4(),
  email: 'testuser@example.com',
  first_name: 'Test',
  last_name: 'User',
  role: 'customer' as const,
  phone: '+1-876-555-0124',
  address: '456 User Street, Kingston, Jamaica',
  is_active: true,
  created_at: new Date(),
  updated_at: new Date(),
});

export const createTestPackage = (companyId?: string, userId?: string) => ({
  id: uuidv4(),
  company_id: companyId || uuidv4(),
  user_id: userId || uuidv4(),
  tracking_number: `SW${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
  sender_name: 'Test Sender',
  sender_address: '123 Sender Street, Miami, FL',
  recipient_name: 'Test Recipient',
  recipient_address: '456 Recipient Street, Kingston, Jamaica',
  description: 'Test Package Description',
  weight: 2.5,
  declared_value: 100.00,
  status: 'in_transit' as const,
  created_at: new Date(),
  updated_at: new Date(),
});

// Multi-tenant test helpers
export const withTenant = (companyId: string) => ({
  user: {
    user_id: uuidv4(),
    company_id: companyId,
    role: 'customer',
    email: 'test@example.com'
  }
});

export const withAdminTenant = (companyId: string, level: 'admin_l1' | 'admin_l2' = 'admin_l1') => ({
  user: {
    user_id: uuidv4(),
    company_id: companyId,
    role: level,
    email: 'admin@example.com'
  }
});

// Error testing helpers
export const expectError = (error: any, statusCode: number, message?: string) => {
  expect(error.statusCode).toBe(statusCode);
  if (message) {
    expect(error.message).toContain(message);
  }
};

// Async testing helpers
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const expectAsync = async (fn: () => Promise<any>) => {
  try {
    await fn();
    throw new Error('Expected function to throw');
  } catch (error) {
    return error;
  }
};