import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { packages } from '../schema/packages';
import { users } from '../schema/users';
import { companies } from '../schema/companies';
import { and, eq } from 'drizzle-orm';
import logger from '../../utils/logger';
import { randomUUID } from 'crypto';

// Define package status type
type PackageStatus = 'pre_alert' | 'received' | 'processed' | 'ready_for_pickup' | 'delivered';

/**
 * Generate a unique tracking ID with company-specific prefix
 */
function generateTrackingId(companySubdomain: string): string {
  // Create a unique identifier for the package with company-specific prefix
  const prefixMap: { [key: string]: string } = {
    'sparrow': 'SPX',
    'express': 'EXP',
    'shipitfast': 'SIF',
    'jampack': 'JMP'
  };
  
  const prefix = prefixMap[companySubdomain] || 'PKG';
  const randomDigits = Math.floor(10000 + Math.random() * 90000); // 5-digit random number
  const suffix = randomUUID().substring(0, 4).toUpperCase();
  
  return `${prefix}${randomDigits}${suffix}`;
}

/**
 * Generate random tags for packages
 */
function generateRandomTags(): string[] {
  const allTags = ['fragile', 'heavy', 'electronics', 'clothing', 'urgent', 'documents', 'perishable', 'gift', 'liquid', 'books', 'toys', 'furniture', 'vip', 'priority', 'commercial'];
  const numberOfTags = Math.floor(Math.random() * 3) + 1; // 1-3 tags per package
  const selectedTags: string[] = [];
  
  for (let i = 0; i < numberOfTags; i++) {
    const randomTagIndex = Math.floor(Math.random() * allTags.length);
    const tag = allTags[randomTagIndex];
    
    // Only add tag if not already selected
    if (!selectedTags.includes(tag)) {
      selectedTags.push(tag);
    }
  }
  
  return selectedTags;
}

/**
 * Seed packages table with initial data
 */
export async function seedPackages(db: NodePgDatabase<any>) {
  try {
    logger.info('Seeding packages...');
    
    // Check if packages already exist to avoid duplicates
    const existingPackages = await db.select().from(packages);
    
    if (existingPackages.length > 0) {
      logger.info(`Found ${existingPackages.length} existing packages, skipping seed`);
      return;
    }
    
    // Get companies
    const companyRecords = await db.select({
      id: companies.id,
      subdomain: companies.subdomain,
      name: companies.name,
    }).from(companies);
    
    // For each company, get its customers
    for (const company of companyRecords) {
      const customerUsers = await db.select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(users)
      .where(
        and(
          eq(users.companyId, company.id),
          eq(users.role, 'customer')
        )
      );
      
      // For each customer, create 11–17 packages
      for (const customer of customerUsers) {
        const numPackages = Math.floor(Math.random() * 7) + 11; // 11–17 packages per customer
        
        for (let i = 0; i < numPackages; i++) {
          const weight = parseFloat((Math.random() * 20 + 1).toFixed(2)); // 1-21 pounds
          const declaredValue = parseFloat((Math.random() * 500 + 50).toFixed(2)); // $50-$550
          
          const statusOptions: PackageStatus[] = ['pre_alert', 'received', 'processed', 'ready_for_pickup', 'delivered'];
          const randomStatus = statusOptions[Math.floor(Math.random() * statusOptions.length)];
          
          // Generate dates based on status (earlier statuses have earlier dates)
          const currentDate = new Date();
          const receivedDate = new Date(currentDate);
          receivedDate.setDate(receivedDate.getDate() - Math.floor(Math.random() * 14)); // 0-14 days ago
          
          const processingDate = new Date(receivedDate);
          processingDate.setDate(processingDate.getDate() + 1); // 1 day after receiving
          
          // Package data with explicit company ID
          const packageData = {
            userId: customer.id,
            companyId: company.id,
            trackingNumber: `SHIP${Math.floor(Math.random() * 10000000)}US`,
            internalTrackingId: generateTrackingId(company.subdomain),
            status: randomStatus,
            description: `Package ${i+1} for ${customer.firstName} ${customer.lastName}`,
            weight: weight.toString(),
            dimensions: { length: 12, width: 8, height: 6 },
            declaredValue: declaredValue.toString(),
            senderInfo: {
              name: 'Online Store',
              address: '123 Seller St, Miami, FL',
              phone: '+1-305-555-0000',
            },
            tags: generateRandomTags(),
            receivedDate: randomStatus !== 'pre_alert' ? receivedDate : null,
            processingDate: ['processed', 'ready_for_pickup', 'delivered'].includes(randomStatus) 
              ? processingDate 
              : null,
            photos: [`https://example.com/packages/${company.subdomain}/${i+1}.jpg`],
            notes: `Sample package ${i+1} for ${company.name}`,
          };
          
          // Include all required and optional fields in the proper format
          await db.insert(packages).values(packageData);
        }
      }
    }
    
    logger.info('Packages seeded successfully');
  } catch (error) {
    logger.error(error, 'Error seeding packages');
    throw error;
  }
} 