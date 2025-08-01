import { beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { DataBase, IMemoryDb, newDb } from 'pg-mem';
import { drizzle } from 'drizzle-orm/pg-mem';
import * as schema from '../../src/db/schema';

// Global test database instance
let testDb: IMemoryDb;
let db: ReturnType<typeof drizzle>;

beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  
  // Create in-memory PostgreSQL database
  testDb = newDb();
  
  // Add required extensions
  testDb.public.registerFunction({
    name: 'current_database',
    implementation: () => 'test',
  });
  
  testDb.public.registerFunction({
    name: 'version',
    implementation: () => 'PostgreSQL 15.0 (test)',
  });
  
  // Create drizzle instance
  db = drizzle(testDb.adapters.createPg(), { schema });
  
  // Create tables by running schema
  await testDb.public.none(`
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    
    CREATE TABLE IF NOT EXISTS companies (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      phone VARCHAR(50),
      address TEXT,
      logo_url VARCHAR(500),
      website VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      email VARCHAR(255) UNIQUE NOT NULL,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'customer',
      phone VARCHAR(50),
      address TEXT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  // Mock console methods to reduce noise in tests
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

beforeEach(async () => {
  // Clear all data before each test
  await testDb.public.none('TRUNCATE companies, users CASCADE');
  
  // Clear all mocks before each test
  jest.clearAllMocks();
});

afterEach(() => {
  // Additional cleanup if needed
});

afterAll(() => {
  // Restore console methods
  jest.restoreAllMocks();
});

export { testDb, db };