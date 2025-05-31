import { BaseService } from './base-service';
import { PaymentsRepository } from '../repositories/payments-repository';
import { payments } from '../db/schema/payments';
import { InvoicesService } from './invoices-service';
import { z } from 'zod';

// Define validation schema for payment creation
const createPaymentSchema = z.object({
  invoiceId: z.string().uuid(),
  userId: z.string().uuid(),
  amount: z.number().positive(),
  paymentMethod: z.enum(['credit_card', 'bank_transfer', 'cash', 'check']),
  transactionId: z.string().optional(),
  paymentDate: z.date().optional(),
  notes: z.string().optional(),
});

// Define validation schema for payment update
const updatePaymentSchema = z.object({
  amount: z.number().positive().optional(),
  paymentMethod: z.enum(['credit_card', 'bank_transfer', 'cash', 'check']).optional(),
  status: z.enum(['pending', 'completed', 'failed', 'refunded']).optional(),
  transactionId: z.string().optional(),
  paymentDate: z.date().optional(),
  notes: z.string().optional(),
});

export class PaymentsService extends BaseService<typeof payments> {
  private invoicesService: InvoicesService;
  private paymentsRepository: PaymentsRepository;

  constructor() {
    const repository = new PaymentsRepository();
    super(repository);
    this.paymentsRepository = repository;
    this.invoicesService = new InvoicesService();
  }

  /**
   * Create a new payment with validation
   */
  async createPayment(data: any, companyId: string) {
    // Validate payment data
    const validatedData = createPaymentSchema.parse(data);
    
    // Check if the invoice exists and belongs to the given company
    const invoice = await this.invoicesService.getInvoiceById(validatedData.invoiceId, companyId);
    
    // Verify that the invoice is in a valid state for payment
    if (invoice.status !== 'issued' && invoice.status !== 'overdue') {
      throw new Error('Cannot process payment for an invoice that is not issued or overdue');
    }
    
    // Create the payment record
    const payment = await this.paymentsRepository.create({
      ...validatedData,
      status: 'pending',
      paymentDate: validatedData.paymentDate || new Date(),
    }, companyId);
    
    // If payment is marked as completed immediately, update the invoice status
    if (payment && data.status && data.status === 'completed') {
      await this.completePayment(payment.id, companyId);
    }
    
    return payment;
  }

  /**
   * Update payment details with validation
   */
  async updatePayment(id: string, data: any, companyId: string) {
    // Validate update data
    const validatedData = updatePaymentSchema.parse(data);
    
    // If status is changing to 'completed', handle invoice update
    const currentPayment = await this.getById(id, companyId);
    if (validatedData.status === 'completed' && currentPayment.status !== 'completed') {
      return this.completePayment(id, companyId);
    }
    
    // Handle other update scenarios
    return this.update(id, validatedData, companyId);
  }

  /**
   * Mark a payment as completed and update related invoice
   */
  async completePayment(id: string, companyId: string) {
    // Get the payment to verify it exists
    const payment = await this.getById(id, companyId);
    
    // Update payment status to completed
    const updatedPayment = await this.update(id, {
      status: 'completed',
      paymentDate: payment.paymentDate || new Date(),
    }, companyId);
    
    // Get the invoice
    const invoice = await this.invoicesService.getInvoiceById(payment.invoiceId, companyId);
    
    // Calculate total paid for this invoice
    const allPayments = await this.paymentsRepository.findByInvoiceId(invoice.id, companyId);
    const completedPayments = allPayments.filter(p => p.status === 'completed');
    const totalPaid = completedPayments.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);
    
    // Check if invoice is fully paid
    if (totalPaid >= parseFloat(invoice.totalAmount.toString())) {
      // Update invoice status to paid
      await this.invoicesService.updateInvoice(invoice.id, {
        status: 'paid',
      }, companyId);
    }
    
    return updatedPayment;
  }

  /**
   * Process a refund for a payment
   */
  async refundPayment(id: string, companyId: string) {
    // Get payment to verify it exists and has valid status
    const payment = await this.getById(id, companyId);
    
    if (payment.status !== 'completed') {
      throw new Error('Only completed payments can be refunded');
    }
    
    // Process the refund via repository (which handles both payment and invoice update)
    return this.paymentsRepository.processRefund(id, companyId);
  }

  /**
   * Get all payments for a specific invoice
   */
  async getPaymentsByInvoice(invoiceId: string, companyId: string) {
    // Verify invoice exists and belongs to company
    await this.invoicesService.getInvoiceById(invoiceId, companyId);
    
    return this.paymentsRepository.findByInvoiceId(invoiceId, companyId);
  }

  /**
   * Get all payments for a specific user
   */
  async getPaymentsByUser(userId: string, companyId: string) {
    return this.paymentsRepository.findByUserId(userId, companyId);
  }

  /**
   * Get payments by status
   */
  async getPaymentsByStatus(status: 'pending' | 'completed' | 'failed' | 'refunded', companyId: string) {
    return this.paymentsRepository.findByStatus(status, companyId);
  }

  /**
   * Get total payments received within a date range
   */
  async getTotalPaymentsInPeriod(companyId: string, startDate: Date, endDate: Date) {
    return this.paymentsRepository.getTotalPaymentsInPeriod(companyId, startDate, endDate);
  }

  /**
   * Search payments with various filters
   */
  async searchPayments(
    companyId: string,
    searchParams: {
      userId?: string;
      invoiceId?: string;
      status?: string;
      method?: string;
      search?: string;
      dateFrom?: Date;
      dateTo?: Date;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      page?: number;
      pageSize?: number;
    }
  ) {
    return this.paymentsRepository.search(companyId, searchParams);
  }

  async exportPaymentsCsv(companyId: string, filters: any = {}) {
    // Remove pagination params if present
    const repoFilters = { ...filters };
    delete repoFilters.page;
    delete repoFilters.limit;
    return this.paymentsRepository.findAllForExport(companyId, repoFilters);
  }
} 