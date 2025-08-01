import { v4 as uuidv4 } from 'uuid';

export const testCompanies = {
  acmeLogistics: {
    id: uuidv4(),
    name: 'ACME Logistics',
    email: 'info@acmelogistics.jm',
    phone: '+1-876-555-0100',
    address: '123 Spanish Town Road, Kingston 11, Jamaica',
    logo_url: 'https://example.com/acme-logo.png',
    website: 'https://acmelogistics.jm',
    created_at: new Date('2024-01-01T00:00:00Z'),
    updated_at: new Date('2024-01-01T00:00:00Z'),
  },
  swiftShipping: {
    id: uuidv4(),
    name: 'Swift Shipping JA',
    email: 'contact@swiftshipping.jm',
    phone: '+1-876-555-0200',
    address: '456 Half Way Tree Road, Kingston 10, Jamaica',
    logo_url: 'https://example.com/swift-logo.png',
    website: 'https://swiftshipping.jm',
    created_at: new Date('2024-01-02T00:00:00Z'),
    updated_at: new Date('2024-01-02T00:00:00Z'),
  },
  caribbeanCargo: {
    id: uuidv4(),
    name: 'Caribbean Cargo Express',
    email: 'hello@caribbeancargo.jm',
    phone: '+1-876-555-0300',
    address: '789 Hope Road, Kingston 6, Jamaica',
    logo_url: 'https://example.com/caribbean-logo.png',
    website: 'https://caribbeancargo.jm',
    created_at: new Date('2024-01-03T00:00:00Z'),
    updated_at: new Date('2024-01-03T00:00:00Z'),
  },
};

export const getTestCompanyIds = () => ({
  acme: testCompanies.acmeLogistics.id,
  swift: testCompanies.swiftShipping.id,
  caribbean: testCompanies.caribbeanCargo.id,
});