import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { preAlerts, preAlertStatusEnum } from '../schema/pre-alerts';
import { users } from '../schema/users';
import { companies } from '../schema/companies';
import { and, eq } from 'drizzle-orm';
import logger from '../../utils/logger';

// Define courier type
type Courier = 'USPS' | 'FedEx' | 'UPS' | 'DHL' | 'Amazon';

/**
 * Seed pre-alerts table with initial data
 */
export async function seedPreAlerts(db: NodePgDatabase<any>) {
  try {
    logger.info('Seeding pre-alerts...');
    
    // Check if pre-alerts already exist to avoid duplicates
    const existingPreAlerts = await db.select().from(preAlerts);
    
    if (existingPreAlerts.length > 0) {
      logger.info(`Found ${existingPreAlerts.length} existing pre-alerts, skipping seed`);
      return;
    }
    
    // Get companies
    const companyRecords = await db.select({
      id: companies.id,
    }).from(companies);
    
    // For each company, get its customers
    for (const company of companyRecords) {
      const customerUsers = await db.select({
        id: users.id,
      })
      .from(users)
      .where(
        and(
          eq(users.companyId, company.id),
          eq(users.role, 'customer')
        )
      );
      
      // For each customer, create 1-3 pre-alerts
      for (const customer of customerUsers) {
        const numPreAlerts = Math.floor(Math.random() * 3) + 1; // 1-3 pre-alerts per customer
        
        for (let i = 0; i < numPreAlerts; i++) {
          const estimatedWeight = parseFloat((Math.random() * 15 + 0.5).toFixed(2)); // 0.5-15.5 pounds
          
          // Generate future date for estimated arrival (1-10 days in future)
          const estimatedArrival = new Date();
          estimatedArrival.setDate(estimatedArrival.getDate() + Math.floor(Math.random() * 10) + 1);
          
          const courierOptions: Courier[] = ['USPS', 'FedEx', 'UPS', 'DHL', 'Amazon'];
          const randomCourier = courierOptions[Math.floor(Math.random() * courierOptions.length)];
          
          // Pre-alert data
          const preAlertData = {
            companyId: company.id,
            userId: customer.id,
            trackingNumber: `${randomCourier}${Math.floor(Math.random() * 10000000000)}`,
            courier: randomCourier,
            description: `Pre-alert ${i+1} - ${['Clothing', 'Electronics', 'Books', 'Household items', 'Gifts'][Math.floor(Math.random() * 5)]}`,
            estimatedWeight: estimatedWeight.toString(),
            estimatedArrival: estimatedArrival,
            status: preAlertStatusEnum.enumValues[0], // Use the first enum value (pending)
          };
          
          await db.insert(preAlerts).values(preAlertData);
        }
      }
    }
    
    logger.info('Pre-alerts seeded successfully');
  } catch (error) {
    logger.error(error, 'Error seeding pre-alerts');
    throw error;
  }
} 