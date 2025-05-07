import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { payments } from '../schema/payments';
import { invoices } from '../schema/invoices';
import { eq } from 'drizzle-orm';
import logger from '../../utils/logger';

// Define payment method type
type PaymentMethod = 'credit_card' | 'bank_transfer' | 'cash' | 'check';
type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

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
        ? `TXN-${Math.floor(Math.random() * 1000000)}` 
        : null;
      
      // Payment data
      const paymentData = {
        companyId: invoice.companyId,
        invoiceId: invoice.id,
        userId: invoice.userId,
        amount: invoice.totalAmount,
        paymentMethod: randomMethod,
        status: 'completed' as PaymentStatus,
        transactionId: transactionId,
        paymentDate: new Date(paymentDate),
        notes: `Payment for invoice received via ${randomMethod}`,
      };
      
      await db.insert(payments).values(paymentData);
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
      // Pending payment data
      const pendingPaymentData = {
        companyId: invoice.companyId,
        invoiceId: invoice.id,
        userId: invoice.userId,
        amount: invoice.totalAmount,
        paymentMethod: 'bank_transfer' as PaymentMethod,
        status: 'pending' as PaymentStatus,
        transactionId: `PENDING-${Math.floor(Math.random() * 1000000)}`,
        paymentDate: new Date(),
        notes: 'Bank transfer initiated, awaiting confirmation',
      };
      
      await db.insert(payments).values(pendingPaymentData);
    }
    
    logger.info('Payments seeded successfully');
  } catch (error) {
    logger.error(error, 'Error seeding payments');
    throw error;
  }
} 