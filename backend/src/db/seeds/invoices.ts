import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { invoices } from '../schema/invoices';
import { invoiceItems } from '../schema/invoice-items';
import { packages } from '../schema/packages';
import { companies } from '../schema/companies';
import { and, eq, ne } from 'drizzle-orm';
import logger from '../../utils/logger';

// Define package interface for type safety
interface PackageRecord {
  id: string;
  userId: string;
  weight: string | null;
  declaredValue: string | null;
}

// Define packages by user interface
interface PackagesByUser {
  [userId: string]: PackageRecord[];
}

// Define invoice status type
type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'overdue' | 'cancelled';

// Define invoice item type
type InvoiceItemType = 'shipping' | 'handling' | 'customs' | 'tax' | 'other';

/**
 * Generate company-specific invoice number
 */
function generateInvoiceNumber(companySubdomain: string): string {
  const prefixMap: { [key: string]: string } = {
    'sparrow': 'SPX-INV',
    'express': 'EXP-INV',
    'shipitfast': 'SIF-INV',
    'jampack': 'JMP-INV'
  };
  
  const prefix = prefixMap[companySubdomain] || 'INV';
  const randomDigits = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
  
  return `${prefix}-${randomDigits}`;
}

/**
 * Seed invoices and invoice items tables with initial data
 */
export async function seedInvoices(db: NodePgDatabase<any>) {
  try {
    logger.info('Seeding invoices and invoice items...');
    
    // Check if invoices already exist to avoid duplicates
    const existingInvoices = await db.select().from(invoices);
    
    if (existingInvoices.length > 0) {
      logger.info(`Found ${existingInvoices.length} existing invoices, skipping seed`);
      return;
    }
    
    // Get companies
    const companyRecords = await db.select({
      id: companies.id,
      subdomain: companies.subdomain,
      name: companies.name,
    }).from(companies);
    
    // For each company
    for (const company of companyRecords) {
      // Get packages that are processed or ready_for_pickup (eligible for invoicing)
      const packageRecords = await db.select({
        id: packages.id,
        userId: packages.userId,
        weight: packages.weight,
        declaredValue: packages.declaredValue,
      })
      .from(packages)
      .where(
        and(
          eq(packages.companyId, company.id),
          ne(packages.status, 'pre_alert') // Skip packages that are still pre-alerts
        )
      );
      
      // Group packages by user for invoicing
      const packagesByUser: PackagesByUser = {};
      for (const pkg of packageRecords) {
        if (!packagesByUser[pkg.userId]) {
          packagesByUser[pkg.userId] = [];
        }
        packagesByUser[pkg.userId].push(pkg);
      }
      
      // Create invoices for each user with packages
      for (const [userId, userPackages] of Object.entries(packagesByUser)) {
        if (userPackages.length === 0) continue;
        
        // Calculate invoice totals
        let subtotal = 0;
        const taxRate = 0.15; // 15% tax
        
        // Create company-specific invoice number
        const invoiceNumber = generateInvoiceNumber(company.subdomain);
        
        // Issue date (0-7 days ago)
        const issueDate = new Date();
        issueDate.setDate(issueDate.getDate() - Math.floor(Math.random() * 8));
        
        // Due date (7-14 days after issue date)
        const dueDate = new Date(issueDate);
        dueDate.setDate(dueDate.getDate() + 7 + Math.floor(Math.random() * 8));
        
        // Invoice statuses weighted toward 'issued' and 'paid'
        const statusOptions: InvoiceStatus[] = ['draft', 'issued', 'paid', 'issued', 'paid', 'overdue'];
        const randomStatus = statusOptions[Math.floor(Math.random() * statusOptions.length)];
        
        // Invoice data with explicit company ID
        const invoiceData = {
          companyId: company.id,
          userId: userId,
          invoiceNumber: invoiceNumber,
          status: randomStatus,
          issueDate: issueDate,
          dueDate: dueDate,
          subtotal: '0', // Will update after adding items
          taxAmount: '0', // Will update after adding items
          totalAmount: '0', // Will update after adding items
          notes: `Sample invoice generated for ${company.name}`,
        };
        
        // Insert the invoice first to get its ID
        const result = await db.insert(invoices).values(invoiceData).returning({ id: invoices.id });
        
        const invoiceResult = result[0];
        
        // Add invoice items for each package
        for (const pkg of userPackages) {
          // Shipping fee based on weight
          const weight = pkg.weight ? parseFloat(pkg.weight) : 0;
          const shippingFee = Math.max(15, weight * 2.5);
          subtotal += shippingFee;
          
          // Shipping item data with explicit company ID
          const shippingItemData = {
            invoiceId: invoiceResult.id,
            packageId: pkg.id,
            companyId: company.id,
            description: `Shipping fee for package (${weight} lbs)`,
            quantity: 1,
            unitPrice: shippingFee.toString(),
            lineTotal: shippingFee.toString(),
            type: 'shipping' as InvoiceItemType,
          };
          
          await db.insert(invoiceItems).values(shippingItemData);
          
          // Handling fee (flat rate)
          const handlingFee = 5;
          subtotal += handlingFee;
          
          // Handling item data with explicit company ID
          const handlingItemData = {
            invoiceId: invoiceResult.id,
            packageId: pkg.id,
            companyId: company.id,
            description: 'Package handling fee',
            quantity: 1,
            unitPrice: handlingFee.toString(),
            lineTotal: handlingFee.toString(),
            type: 'handling' as InvoiceItemType,
          };
          
          await db.insert(invoiceItems).values(handlingItemData);
          
          // Customs fee (percentage of declared value)
          const declaredValue = pkg.declaredValue ? parseFloat(pkg.declaredValue) : 0;
          const customsFee = Math.max(10, declaredValue * 0.15);
          subtotal += customsFee;
          
          // Customs item data with explicit company ID
          const customsItemData = {
            invoiceId: invoiceResult.id,
            packageId: pkg.id,
            companyId: company.id,
            description: `Customs processing (${declaredValue} declared value)`,
            quantity: 1,
            unitPrice: customsFee.toString(),
            lineTotal: customsFee.toString(),
            type: 'customs' as InvoiceItemType,
          };
          
          await db.insert(invoiceItems).values(customsItemData);
        }
        
        // Calculate tax
        const taxAmount = subtotal * taxRate;
        const totalAmount = subtotal + taxAmount;
        
        // Update the invoice with the final totals
        await db.update(invoices)
          .set({
            subtotal: subtotal.toString(),
            taxAmount: taxAmount.toString(),
            totalAmount: totalAmount.toString(),
          })
          .where(eq(invoices.id, invoiceResult.id));
      }
    }
    
    logger.info('Invoices and invoice items seeded successfully');
  } catch (error) {
    logger.error(error, 'Error seeding invoices');
    throw error;
  }
} 