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
  userId: string | null;
  weight: string | null;
  declaredValue: string | null;
}

// Define packages by user interface
interface PackagesByUser {
  [userId: string]: PackageRecord[];
}

// Define invoice status type
type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'overdue' | 'cancelled';

/**
 * Generate company-specific invoice number
 */
function generateInvoiceNumber(companySubdomain: string, counter: number): string {
  const prefixMap: { [key: string]: string } = {
    'sparrow': 'SPX-INV',
    'express': 'EXP-INV',
    'shipitfast': 'SIF-INV',
    'jampack': 'JMP-INV'
  };
  const prefix = prefixMap[companySubdomain] || 'INV';
  return `${prefix}-${String(counter).padStart(5, '0')}`;
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
    
    // Before the company loop
    const invoiceCounters: { [companyId: string]: number } = {};
    // For each company
    for (const company of companyRecords) {
      invoiceCounters[company.id] = 1;
      // Invoice statuses weighted toward 'issued' and 'paid'
      const statusOptions: InvoiceStatus[] = ['draft', 'issued', 'paid', 'issued', 'paid', 'overdue'];
      
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
        if (pkg.userId === null) continue; // Skip packages without a user ID
        
        if (!packagesByUser[pkg.userId]) {
          packagesByUser[pkg.userId] = [];
        }
        packagesByUser[pkg.userId].push(pkg);
      }
      
      // Create invoices for each user with packages
      for (const [userId, userPackages] of Object.entries(packagesByUser)) {
        const numInvoices = Math.min(userPackages.length, Math.floor(Math.random() * 7) + 11);
        for (let inv = 0; inv < numInvoices; inv++) {
          // Use the per-company counter for invoice number
          const invoiceNumber = generateInvoiceNumber(company.subdomain, invoiceCounters[company.id]++);
          // Create invoice (without totals yet)
          const invoiceResult = await db.insert(invoices).values({
            companyId: company.id,
            userId,
            invoiceNumber,
            status: statusOptions[Math.floor(Math.random() * statusOptions.length)],
            issueDate: new Date(),
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            subtotal: '0',
            taxAmount: '0',
            totalAmount: '0',
            notes: `Sample invoice generated for ${company.name}`,
          }).returning({ id: invoices.id });

          let subtotal = 0;
          const taxRate = 0.15;
          const invoiceId = invoiceResult[0].id;

          // Select 1–3 random packages for this invoice
          const numItems = Math.min(Math.floor(Math.random() * 3) + 1, userPackages.length);
          const selectedPackages: typeof userPackages = [];
          while (selectedPackages.length < numItems) {
            const pkg = userPackages[Math.floor(Math.random() * userPackages.length)];
            if (!selectedPackages.includes(pkg)) selectedPackages.push(pkg);
          }

          for (const pkg of selectedPackages) {
            // Shipping fee based on weight
            const weight = pkg.weight ? parseFloat(pkg.weight) : 0;
            const shippingFee = Math.max(15, weight * 2.5);
            subtotal += shippingFee;

            await db.insert(invoiceItems).values({
              invoiceId,
              packageId: pkg.id,
              companyId: company.id,
              description: `Shipping fee for package (${weight} lbs)`,
              quantity: 1,
              unitPrice: shippingFee.toString(),
              lineTotal: shippingFee.toString(),
              type: 'shipping',
            });
          }

          const taxAmount = subtotal * taxRate;
          const totalAmount = subtotal + taxAmount;

          // Update invoice with calculated totals
          await db.update(invoices)
            .set({
              subtotal: subtotal.toString(),
              taxAmount: taxAmount.toString(),
              totalAmount: totalAmount.toString(),
            })
            .where(eq(invoices.id, invoiceId));
        }
      }
    }
    
    logger.info('Invoices and invoice items seeded successfully');
  } catch (error) {
    logger.error(error, 'Error seeding invoices');
    throw error;
  }
} 