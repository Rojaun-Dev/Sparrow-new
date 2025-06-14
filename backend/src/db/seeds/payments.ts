import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { payments } from '../schema/payments';
import { invoices } from '../schema/invoices';
import { companies } from '../schema/companies';
import { eq } from 'drizzle-orm';
import logger from '../../utils/logger';

// Define payment method type
type PaymentMethod = 'credit_card' | 'bank_transfer' | 'cash' | 'check' | 'online';
type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

/**
 * Generate company-specific transaction ID
 */
function generateTransactionId(companySubdomain: string, method: PaymentMethod): string {
  const prefixMap: { [key: string]: string } = {
    'sparrow': 'SPX',
    'express': 'EXP',
    'shipitfast': 'SIF',
    'jampack': 'JMP'
  };
  
  const prefix = prefixMap[companySubdomain] || 'TXN';
  const methodCode = method === 'credit_card' ? 'CC' : method === 'bank_transfer' ? 'BT' : 'OT';
  const randomDigits = Math.floor(10000 + Math.random() * 90000);
  
  return `${prefix}-${methodCode}-${randomDigits}`;
}

/**
 * Seed payments table with initial data
 */
export async function seedPayments(db: NodePgDatabase<any>) {
  try {
    logger.info('Seeding payments...');
    
    // Check if payments already exist to avoid duplicates
    const existingPayments = await db.select().from(payments);
    
    if (existingPayments.length > 0) {
      logger.info(`Found ${existingPayments.length} existing payments, skipping seed`);
      return;
    }
    
    // Get all companies for reference
    const companyRecords = await db.select({
      id: companies.id,
      subdomain: companies.subdomain,
      name: companies.name,
    }).from(companies);
    
    // Create a map of companies for easy lookup
    const companyMap = new Map();
    companyRecords.forEach(company => {
      companyMap.set(company.id, company);
    });
    
    // Get all paid invoices
    const paidInvoices = await db.select({
      id: invoices.id,
      companyId: invoices.companyId,
      userId: invoices.userId,
      totalAmount: invoices.totalAmount,
      issueDate: invoices.issueDate,
    })
    .from(invoices)
    .where(eq(invoices.status, 'paid'));
    
    // Create a payment for each paid invoice
    for (const invoice of paidInvoices) {
      const numPayments = Math.floor(Math.random() * 2) + 1; // 1–2
      for (let i = 0; i < numPayments; i++) {
        // Get company information
        const company = companyMap.get(invoice.companyId);
        
        if (!company) {
          logger.warn(`Company not found for invoice ${invoice.id}, skipping payment`);
          continue;
        }
        
        // Payment date is 1-3 days after invoice issue date
        let issueDate: Date;
        
        if (typeof invoice.issueDate === 'string') {
          issueDate = new Date(invoice.issueDate);
        } else if (invoice.issueDate instanceof Date) {
          issueDate = invoice.issueDate;
        } else {
          // Default to current date if issue date is not valid
          issueDate = new Date();
        }
        
        const paymentDate = new Date(issueDate);
        paymentDate.setDate(paymentDate.getDate() + Math.floor(Math.random() * 3) + 1);
        
        // Payment methods
        const paymentMethods: PaymentMethod[] = ['credit_card', 'bank_transfer', 'cash'];
        const randomMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
        
        // Transaction ID for credit card and bank transfer
        const transactionId = randomMethod !== 'cash' 
          ? generateTransactionId(company.subdomain, randomMethod)
          : null;
        
        // Payment data with explicit company ID
        const paymentData = {
          companyId: invoice.companyId,
          invoiceId: invoice.id,
          userId: invoice.userId,
          amount: invoice.totalAmount,
          paymentMethod: randomMethod,
          status: 'completed' as PaymentStatus,
          transactionId: transactionId,
          paymentDate: new Date(paymentDate),
          notes: `Payment for invoice received via ${randomMethod} for ${company.name}`,
        };
        
        await db.insert(payments).values(paymentData);
      }
    }
    
    // Create a few pending payments for issued invoices
    const issuedInvoices = await db.select({
      id: invoices.id,
      companyId: invoices.companyId,
      userId: invoices.userId,
      totalAmount: invoices.totalAmount,
    })
    .from(invoices)
    .where(eq(invoices.status, 'issued'))
    .limit(2);
    
    for (const invoice of issuedInvoices) {
      const numPayments = Math.floor(Math.random() * 2) + 1; // 1–2
      for (let i = 0; i < numPayments; i++) {
        // Get company information
        const company = companyMap.get(invoice.companyId);
        
        if (!company) {
          logger.warn(`Company not found for invoice ${invoice.id}, skipping payment`);
          continue;
        }
        
        // Pending payment data with explicit company ID
        const pendingPaymentData = {
          companyId: invoice.companyId,
          invoiceId: invoice.id,
          userId: invoice.userId,
          amount: invoice.totalAmount,
          paymentMethod: 'bank_transfer' as PaymentMethod,
          status: 'pending' as PaymentStatus,
          transactionId: generateTransactionId(company.subdomain, 'bank_transfer'),
          paymentDate: new Date(),
          notes: `Bank transfer initiated for ${company.name}, awaiting confirmation`,
        };
        
        await db.insert(payments).values(pendingPaymentData);
      }
    }
    
    logger.info('Payments seeded successfully');
  } catch (error) {
    logger.error(error, 'Error seeding payments');
    throw error;
  }
} 