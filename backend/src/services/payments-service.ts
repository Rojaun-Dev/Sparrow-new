import { BaseService } from './base-service';
import { PaymentsRepository } from '../repositories/payments-repository';
import { payments } from '../db/schema/payments';
import { InvoicesService } from './invoices-service';
import { z } from 'zod';
import { CompanySettingsService } from './company-settings-service';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

// Define validation schema for payment creation
const createPaymentSchema = z.object({
  invoiceId: z.string().uuid(),
  userId: z.string().uuid(),
  amount: z.number().positive(),
  paymentMethod: z.enum(['credit_card', 'bank_transfer', 'cash', 'check', 'online']),
  transactionId: z.string().optional(),
  paymentDate: z.date().optional(),
  notes: z.string().optional(),
});

// Define validation schema for payment update
const updatePaymentSchema = z.object({
  amount: z.number().positive().optional(),
  paymentMethod: z.enum(['credit_card', 'bank_transfer', 'cash', 'check', 'online']).optional(),
  status: z.enum(['pending', 'completed', 'failed', 'refunded']).optional(),
  transactionId: z.string().optional(),
  paymentDate: z.date().optional(),
  notes: z.string().optional(),
});

// Define validation schema for WiPay request
const wiPayRequestSchema = z.object({
  invoiceId: z.string().uuid(),
  responseUrl: z.string().url(),
  origin: z.string(),
});

export class PaymentsService extends BaseService<typeof payments> {
  private invoicesService: InvoicesService;
  private paymentsRepository: PaymentsRepository;
  private companySettingsService: CompanySettingsService;

  constructor() {
    const repository = new PaymentsRepository();
    super(repository);
    this.paymentsRepository = repository;
    this.invoicesService = new InvoicesService();
    this.companySettingsService = new CompanySettingsService();
  }

  /**
   * Create a new payment with validation
   */
  async createPayment(data: any, companyId: string) {
    // Validate payment data
    const validatedData = createPaymentSchema.parse(data);
    
    // Check if the invoice exists and belongs to the given company
    const invoiceData = await this.invoicesService.getInvoiceById(validatedData.invoiceId, companyId);
    
    // The invoice object may include both invoice properties and items
    const invoice = invoiceData as any;
    
    // Verify that the invoice is in a valid state for payment
    if (!invoice || invoice.status !== 'issued' && invoice.status !== 'overdue') {
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
    const invoiceData = await this.invoicesService.getInvoiceById(payment.invoiceId, companyId);
    const invoice = invoiceData as any;
    
    // Calculate total paid for this invoice
    const allPayments = await this.paymentsRepository.findByInvoiceId(payment.invoiceId, companyId);
    const completedPayments = allPayments.filter(p => p.status === 'completed');
    const totalPaid = completedPayments.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);
    
    // Check if invoice is fully paid
    if (invoice && totalPaid >= parseFloat(invoice.totalAmount?.toString() || '0')) {
      // Update invoice status to paid
      await this.invoicesService.updateInvoice(payment.invoiceId, {
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

  /**
   * Creates a payment request to WiPay
   */
  async createWiPayRequest(data: any, companyId: string) {
    // Validate data
    const validatedData = wiPayRequestSchema.parse(data);
    
    // Get WiPay settings
    const paymentSettings = await this.companySettingsService.getPaymentSettings(companyId);
    
    if (!paymentSettings.wipay || !paymentSettings.wipay.enabled) {
      throw new Error('WiPay is not enabled for this company');
    }
    
    if (!paymentSettings.wipay.accountNumber) {
      throw new Error('WiPay account number is not configured');
    }
    
    // Get invoice details
    const invoice = await this.invoicesService.getInvoiceById(validatedData.invoiceId, companyId);
    
    if (!invoice) {
      throw new Error('Invoice not found');
    }
    if (typeof invoice.status !== 'string') {
      throw new Error('Invoice status is missing or invalid');
    }
    if (typeof invoice.userId !== 'string') {
      throw new Error('Invoice userId is missing or invalid');
    }
    if (invoice.totalAmount === undefined || invoice.totalAmount === null || isNaN(Number(invoice.totalAmount))) {
      throw new Error('Invoice totalAmount is missing or invalid');
    }
    
    if (invoice.status !== 'issued' && invoice.status !== 'overdue') {
      throw new Error('Cannot process payment for an invoice that is not issued or overdue');
    }
    
    // Create temporary payment record in pending state
    const payment = await this.paymentsRepository.create({
      invoiceId: validatedData.invoiceId,
      userId: invoice.userId,
      amount: invoice.totalAmount,
      paymentMethod: 'online',
      status: 'pending',
      paymentDate: new Date(),
      notes: 'WiPay payment initiated',
    }, companyId);
    
    if (!payment) {
      throw new Error('Failed to create payment record');
    }
    
    // Prepare WiPay request
    const total = Number(invoice.totalAmount);
    if (isNaN(total)) {
      throw new Error('Invoice totalAmount is not a valid number');
    }
    
    // Generate a short order ID (must be between 1-17 characters)
    // Use a short prefix and the first 8 chars of the payment ID
    const shortOrderId = `px${payment.id.substring(0, 8)}`;
    
    // Store the mapping between short order ID and actual IDs for later reference
    await this.update(payment.id, {
      notes: `WiPay payment initiated. Short order ID: ${shortOrderId}, Invoice ID: ${validatedData.invoiceId}`,
    }, companyId);
    
    const wiPayParams = {
      account_number: paymentSettings.wipay.accountNumber,
      avs: 0, // Address Verification Service disabled
      country_code: paymentSettings.wipay.countryCode || 'TT',
      currency: paymentSettings.wipay.currency || 'TTD',
      environment: paymentSettings.wipay.environment || 'sandbox',
      fee_structure: paymentSettings.wipay.feeStructure || 'customer_pay',
      method: 'credit_card',
      order_id: shortOrderId,
      origin: validatedData.origin,
      response_url: validatedData.responseUrl,
      total: total.toFixed(2),
    };
    
    try {
      // Determine API URL based on country_code
      const countryCode = paymentSettings.wipay.countryCode?.toLowerCase() || 'tt';
      const apiUrl = `https://${countryCode}.wipayfinancial.com/plugins/payments/request`;
      
      // Make request to WiPay
      const response = await axios.post(apiUrl, wiPayParams, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      // Update payment record with transaction details
      await this.update(payment.id, {
        transactionId: response.data.transaction_id || null,
        notes: `${payment.notes}\nTransaction ID: ${response.data.transaction_id || 'Not provided'}`,
      }, companyId);
      
      return {
        paymentId: payment.id,
        redirectUrl: response.data.url,
        transactionId: response.data.transaction_id,
      };
    } catch (error: any) {
      console.error('WiPay payment request failed:', error);
      
      // Update payment record to failed state
      await this.update(payment.id, {
        status: 'failed',
        notes: `WiPay payment request failed: ${error.message || 'Unknown error'}`,
      }, companyId);
      
      throw new Error(`WiPay payment request failed: ${error.message || 'Unknown error'}`);
    }
  }
  
  /**
   * Handle WiPay callback after payment is processed
   */
  async handleWiPayCallback(callbackData: any, companyId: string) {
    // Extract order_id from callback data
    const orderId = callbackData.order_id;
    
    if (!orderId) {
      throw new Error('Invalid order ID in callback');
    }
    
    // Find payment by the short order ID in the notes field
    const payments = await this.paymentsRepository.findAll(companyId);
    const payment = payments.find(p => p.notes && p.notes.includes(`Short order ID: ${orderId}`));
    
    if (!payment) {
      throw new Error('Payment not found for the given order ID');
    }
    
    // Process based on status
    if (callbackData.status === 'success' || callbackData.status === 'completed') {
      // Update payment to completed status
      await this.completePayment(payment.id, companyId);
      
      return {
        success: true,
        payment: await this.getById(payment.id, companyId),
        message: 'Payment completed successfully',
      };
    } else {
      // Update payment to failed status
      await this.update(payment.id, {
        status: 'failed',
        notes: `${payment.notes}\nWiPay payment failed. Status: ${callbackData.status}, Message: ${callbackData.message || 'No message provided'}`,
      }, companyId);
      
      return {
        success: false,
        payment: await this.getById(payment.id, companyId),
        message: callbackData.message || 'Payment processing failed',
      };
    }
  }

  async exportPaymentsCsv(companyId: string, filters: any = {}) {
    // Remove pagination params if present
    const repoFilters = { ...filters };
    delete repoFilters.page;
    delete repoFilters.limit;
    return this.paymentsRepository.findAllForExport(companyId, repoFilters);
  }
} 