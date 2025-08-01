import { v4 as uuidv4 } from 'uuid';
import { getTestCompanyIds } from './companies';

const companyIds = getTestCompanyIds();

export const testUsers = {
  // ACME Logistics Users
  acmeCustomer: {
    id: uuidv4(),
    company_id: companyIds.acme,
    email: 'john.doe@example.com',
    first_name: 'John',
    last_name: 'Doe',
    role: 'customer' as const,
    phone: '+1-876-555-1001',
    address: '123 Customer Lane, Kingston, Jamaica',
    is_active: true,
    created_at: new Date('2024-01-01T10:00:00Z'),
    updated_at: new Date('2024-01-01T10:00:00Z'),
  },
  acmeAdmin: {
    id: uuidv4(),
    company_id: companyIds.acme,
    email: 'admin@acmelogistics.jm',
    first_name: 'Admin',
    last_name: 'User',
    role: 'admin_l1' as const,
    phone: '+1-876-555-1002',
    address: '123 Spanish Town Road, Kingston 11, Jamaica',
    is_active: true,
    created_at: new Date('2024-01-01T09:00:00Z'),
    updated_at: new Date('2024-01-01T09:00:00Z'),
  },
  
  // Swift Shipping Users
  swiftCustomer: {
    id: uuidv4(),
    company_id: companyIds.swift,
    email: 'jane.smith@example.com',
    first_name: 'Jane',
    last_name: 'Smith',
    role: 'customer' as const,
    phone: '+1-876-555-2001',
    address: '456 Customer Avenue, Spanish Town, Jamaica',
    is_active: true,
    created_at: new Date('2024-01-02T10:00:00Z'),
    updated_at: new Date('2024-01-02T10:00:00Z'),
  },
  swiftAdmin: {
    id: uuidv4(),
    company_id: companyIds.swift,
    email: 'admin@swiftshipping.jm',
    first_name: 'Swift',
    last_name: 'Admin',
    role: 'admin_l2' as const,
    phone: '+1-876-555-2002',
    address: '456 Half Way Tree Road, Kingston 10, Jamaica',
    is_active: true,
    created_at: new Date('2024-01-02T09:00:00Z'),
    updated_at: new Date('2024-01-02T09:00:00Z'),
  },
  
  // Caribbean Cargo Users
  caribbeanCustomer: {
    id: uuidv4(),
    company_id: companyIds.caribbean,
    email: 'bob.johnson@example.com',
    first_name: 'Bob',
    last_name: 'Johnson',
    role: 'customer' as const,
    phone: '+1-876-555-3001',
    address: '789 Customer Street, Montego Bay, Jamaica',
    is_active: true,
    created_at: new Date('2024-01-03T10:00:00Z'),
    updated_at: new Date('2024-01-03T10:00:00Z'),
  },
  caribbeanAdmin: {
    id: uuidv4(),
    company_id: companyIds.caribbean,
    email: 'admin@caribbeancargo.jm',
    first_name: 'Caribbean',
    last_name: 'Admin',
    role: 'admin_l1' as const,
    phone: '+1-876-555-3002',
    address: '789 Hope Road, Kingston 6, Jamaica',
    is_active: true,
    created_at: new Date('2024-01-03T09:00:00Z'),
    updated_at: new Date('2024-01-03T09:00:00Z'),
  },
};

export const getTestUserIds = () => ({
  acmeCustomer: testUsers.acmeCustomer.id,
  acmeAdmin: testUsers.acmeAdmin.id,
  swiftCustomer: testUsers.swiftCustomer.id,
  swiftAdmin: testUsers.swiftAdmin.id,
  caribbeanCustomer: testUsers.caribbeanCustomer.id,
  caribbeanAdmin: testUsers.caribbeanAdmin.id,
});