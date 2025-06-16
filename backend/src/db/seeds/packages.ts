import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { packages } from '../schema/packages';
import { users } from '../schema/users';
import { companies } from '../schema/companies';
import { and, eq, sql } from 'drizzle-orm';
import logger from '../../utils/logger';

// Define package status type
type PackageStatus = 'pre_alert' | 'received' | 'processed' | 'ready_for_pickup' | 'delivered';

/**
 * Generate internal tracking ID based on user's internal ID
 */
async function generateInternalTrackingId(db: NodePgDatabase<any>, userId: string, companyId: string): Promise<{internalTrackingId: string, prefId: string}> {
  // Get the user to access their internalId
  const userResults = await db.select({
    internalId: users.internalId,
    prefId: users.prefId
  })
  .from(users)
  .where(
    and(
      eq(users.id, userId),
      eq(users.companyId, companyId)
    )
  );
  
  if (!userResults.length || !userResults[0].internalId) {
    throw new Error(`User ${userId} not found or missing internalId`);
  }
  
  const user = userResults[0];
  
  // Get current count of packages for this user to make a unique identifier
  const existingPackages = await db.select({
    count: sql<number>`count(*)`.mapWith(Number)
  })
  .from(packages)
  .where(
    and(
      eq(packages.userId, userId),
      eq(packages.companyId, companyId)
    )
  );
  
  const packageCount = existingPackages[0].count + 1;
  
  // Create package-specific suffix (padded count)
  const packageSuffix = packageCount.toString().padStart(3, '0');
  
  // Format internal tracking ID as USER_INTERNAL_ID-PACKAGE_SUFFIX
  const internalTrackingId = `${user.internalId}-${packageSuffix}`;
  
  return {
    internalTrackingId,
    prefId: user.prefId
  };
}

/**
 * Generate random tags for packages
 */
function generateRandomTags(): string[] {
  const allTags = ['general', 'fragile', 'electronics', 'clothing', 'books', 'food', 'toys', 'furniture', 'urgent'];
  const numTags = Math.floor(Math.random() * 3) + 1; // 1-3 tags
  const tags: string[] = ['general']; // Always include general
  
  // Add additional random tags
  for (let i = 0; i < numTags; i++) {
    const randomIndex = Math.floor(Math.random() * (allTags.length - 1)) + 1; // Skip 'general'
    const tag = allTags[randomIndex];
    if (!tags.includes(tag)) {
      tags.push(tag);
    }
  }
  
  return tags;
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
          processingDate.setDate(processingDate.getDate() + 1);
          
          // Generate internal tracking ID and prefId based on user
          const { internalTrackingId, prefId } = await generateInternalTrackingId(db, customer.id, company.id);
          
          // Package data with explicit company ID
          const packageData = {
            userId: customer.id,
            companyId: company.id,
            trackingNumber: `SHIP${Math.floor(Math.random() * 10000000)}US`,
            internalTrackingId,
            prefId,
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