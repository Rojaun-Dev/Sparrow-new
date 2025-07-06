import { BaseService } from './base-service';
import { PaymentsRepository } from '../repositories/payments-repository';
import { payments } from '../db/schema/payments';
import { InvoicesService } from './invoices-service';
import { z } from 'zod';
import { CompanySettingsService } from './company-settings-service';
import { PackagesService } from './packages-service';
import axios from 'axios';
// Import removed as it's not used

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
  meta: z.record(z.any()).optional(), // Add meta field as optional record
});

// Define validation schema for WiPay request
const wiPayRequestSchema = z.object({
  invoiceId: z.string().uuid(),
  responseUrl: z.string().url(),
  origin: z.string(),
  currency: z.enum(['USD', 'JMD']).optional().default('USD'),
});

export class PaymentsService extends BaseService<typeof payments> {
  private invoicesService: InvoicesService;
  private paymentsRepository: PaymentsRepository;
  private companySettingsService: CompanySettingsService;
  private packagesService: PackagesService;

  constructor() {
    const repository = new PaymentsRepository();
    super(repository);
    this.paymentsRepository = repository;
    this.invoicesService = new InvoicesService();
    this.companySettingsService = new CompanySettingsService();
    this.packagesService = new PackagesService();
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
    
    if (!payment) {
      console.error(`Payment ${id} not found`);
      throw new Error('Payment not found');
    }
    
    console.log(`CompletePayment called for payment ${id}, current status: ${payment.status}, paymentDate: ${payment.paymentDate}`);
    
    // Create a current date for the payment if needed
    const currentDate = new Date();
    
    // Update payment status to completed if not already
    if (payment.status !== 'completed') {
      // Ensure we have a valid payment date
      const paymentDate = payment.paymentDate instanceof Date 
        ? payment.paymentDate 
        : (payment.paymentDate ? new Date(payment.paymentDate) : currentDate);
      
      // Check if the payment date is valid (not Dec 31 1969 or Jan 1 1970)
      const validPaymentDate = paymentDate.getFullYear() < 1971 ? currentDate : paymentDate;
      
      console.log(`Setting payment date to: ${validPaymentDate.toISOString()}`);
      
      const updatedPayment = await this.update(id, {
        status: 'completed',
        paymentDate: validPaymentDate
      }, companyId);
      
      console.log(`Payment updated: ${JSON.stringify({
        id: updatedPayment.id,
        status: updatedPayment.status,
        paymentDate: updatedPayment.paymentDate instanceof Date 
          ? updatedPayment.paymentDate.toISOString() 
          : new Date(updatedPayment.paymentDate).toISOString()
      })}`);
    }
    
    // Get the invoice
    const invoiceData = await this.invoicesService.getInvoiceById(payment.invoiceId, companyId);
    const invoice = invoiceData as any;
    
    if (!invoice) {
      console.error(`Invoice not found for payment ${id}`);
      return payment;
    }
    
    // Get company settings for currency conversion
    const companySettings = await this.companySettingsService.getCompanySettings(companyId);
    const exchangeRateSettings = companySettings && typeof companySettings === 'object' && 'exchangeRateSettings' in companySettings 
      ? companySettings.exchangeRateSettings as { baseCurrency: string; targetCurrency: string; exchangeRate: number; lastUpdated: string }
      : {
        baseCurrency: 'USD',
        targetCurrency: 'JMD',
        exchangeRate: 150,
        lastUpdated: new Date().toISOString()
      };
    
    // Calculate total paid for this invoice
    const allPayments = await this.paymentsRepository.findByInvoiceId(payment.invoiceId, companyId);
    const completedPayments = allPayments.filter(p => p.status === 'completed');
    
    // Calculate total paid considering currency conversion
    let totalPaid = 0;
    
    for (const p of completedPayments) {
      let paymentAmount = parseFloat(p.amount.toString());
      const meta = p.meta as Record<string, any> | undefined;
      
      // If payment has currency information, convert to invoice's currency if needed
      if (meta && meta.currency && meta.baseCurrency) {
        const paymentCurrency = meta.currency;
        const invoiceBaseCurrency = exchangeRateSettings.baseCurrency;
        
        // If payment currency differs from invoice currency, convert
        if (paymentCurrency !== invoiceBaseCurrency) {
          // If payment was in JMD but invoice is in USD
          if (paymentCurrency === 'JMD' && invoiceBaseCurrency === 'USD') {
            paymentAmount = paymentAmount / (meta.exchangeRate || exchangeRateSettings.exchangeRate);
            console.log(`Converting payment amount from JMD to USD for comparison: ${p.amount} JMD -> ${paymentAmount} USD`);
          } 
          // If payment was in USD but invoice is in JMD
          else if (paymentCurrency === 'USD' && invoiceBaseCurrency === 'JMD') {
            paymentAmount = paymentAmount * (meta.exchangeRate || exchangeRateSettings.exchangeRate);
            console.log(`Converting payment amount from USD to JMD for comparison: ${p.amount} USD -> ${paymentAmount} JMD`);
          }
        }
      }
      
      totalPaid += paymentAmount;
    }
    
    console.log(`Invoice ${payment.invoiceId} - Total paid: ${totalPaid}, Invoice total: ${parseFloat(invoice.totalAmount?.toString() || '0')}`);
    
    // Check if invoice is fully paid
    if (invoice && totalPaid >= parseFloat(invoice.totalAmount?.toString() || '0')) {
      // Update invoice status to paid
      await this.invoicesService.updateInvoice(payment.invoiceId, {
        status: 'paid',
      }, companyId);
      
      console.log(`Invoice ${payment.invoiceId} marked as paid`);
    } else {
      console.log(`Invoice ${payment.invoiceId} not fully paid yet. Total paid: ${totalPaid}, Required: ${invoice.totalAmount}`);
    }
    
    // Update packages associated with the invoice
    await this.packagesService.updatePackageStatusAfterPayment(payment.invoiceId, companyId);
    
    // Get the updated payment to return
    return this.getById(id, companyId);
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
    const paymentSettings = await this.companySettingsService.getPaymentSettings(companyId) as {
      wipay?: {
        enabled?: boolean;
        accountNumber?: string;
        apiKey?: string;
        environment?: 'sandbox' | 'production';
        countryCode?: string;
        currency?: string;
        feeStructure?: string;
      }
    };
    
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
    
    // Get exchange rate settings
    const companySettings = await this.companySettingsService.getCompanySettings(companyId);
    const exchangeRateSettings = companySettings && typeof companySettings === 'object' && 'exchangeRateSettings' in companySettings 
      ? companySettings.exchangeRateSettings as { baseCurrency: string; targetCurrency: string; exchangeRate: number; lastUpdated: string }
      : {
        baseCurrency: 'USD',
        targetCurrency: 'JMD',
        exchangeRate: 150, // Default exchange rate if not set
        lastUpdated: new Date().toISOString()
      };
    
    // Use the requested currency or default to USD
    const currency = validatedData.currency || paymentSettings.wipay?.currency || 'USD';
    
    // Calculate the converted amount based on currency
    let convertedAmount = Number(invoice.totalAmount);
    let originalAmount = Number(invoice.totalAmount);
    let amountToStore = originalAmount; // Default to original amount
    
    // Apply currency conversion if needed
    if (currency === 'JMD' && exchangeRateSettings.baseCurrency === 'USD') {
      // Convert from USD to JMD using the exchange rate
      convertedAmount = originalAmount * (exchangeRateSettings.exchangeRate as number);
      console.log(`Converting amount from USD to JMD: ${originalAmount} USD -> ${convertedAmount} JMD (rate: ${exchangeRateSettings.exchangeRate})`);
      // Store the JMD amount in the payment record when paying in JMD
      amountToStore = convertedAmount;
    } else if (currency === 'USD' && exchangeRateSettings.baseCurrency === 'JMD') {
      // Convert from JMD to USD using the exchange rate
      convertedAmount = originalAmount / (exchangeRateSettings.exchangeRate as number);
      console.log(`Converting amount from JMD to USD: ${originalAmount} JMD -> ${convertedAmount} USD (rate: ${exchangeRateSettings.exchangeRate})`);
      // Store the USD amount in the payment record when paying in USD
      amountToStore = convertedAmount;
    }
    
    // Format to 2 decimal places as required by WiPay
    const formattedAmount = convertedAmount.toFixed(2);
    
    // Create WiPay request payload according to documentation
    const payload: {
      account_number: string;
      total: string;
      currency: string;
      environment: 'sandbox' | 'production' | 'live';
      fee_structure: string;
      order_id: string;
      response_url: string;
      country_code: string;
      origin: string;
      method?: string;
      name?: string;
      email?: string;
      phone?: string;
      addr1?: string;
      addr2?: string;
      city?: string;
      state?: string;
      zipcode?: string;
      country?: string;
    } = {
      account_number: paymentSettings.wipay.accountNumber,
      total: formattedAmount, // Use the converted amount
      currency: currency,
      environment: paymentSettings.wipay.environment === 'production' ? 'live' : 'sandbox',
      fee_structure: paymentSettings.wipay.feeStructure || 'merchant_absorb',
      order_id: invoice.invoiceNumber || invoice.id,
      response_url: validatedData.responseUrl,
      country_code: 'JM', // Always use JM as specified
      origin: validatedData.origin || 'SparrowX',
      method: 'credit_card' // Required according to documentation
    };
    
    // Prepare metadata for the payment
    const meta = {
      currency: currency,
      originalAmount: originalAmount,
      convertedAmount: Number(formattedAmount),
      exchangeRate: exchangeRateSettings.exchangeRate as number,
      baseCurrency: exchangeRateSettings.baseCurrency as string,
      wiPayRequestPayload: payload,
      paymentCreatedAt: new Date().toISOString()
    };
    
    // Create a pending payment record
    const payment = await this.paymentsRepository.create({
      invoiceId: invoice.id,
      userId: invoice.userId,
      amount: amountToStore, // Store the amount in the currency being used for payment
      paymentMethod: 'online',
      status: 'pending',
      meta: meta
    }, companyId);
    
    if (!payment) {
      throw new Error('Failed to create payment record');
    }
    
    // Make API request to WiPay
    try {
      // Use the correct endpoint based on country_code
      const wiPayUrl = 'https://jm.wipayfinancial.com/plugins/payments/request';
      
      // Add headers according to documentation
      const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      };
      
      console.log(`Making WiPay API request to: ${wiPayUrl}`);
      console.log('Payload:', JSON.stringify(payload, null, 2));
      console.log(`Original amount: ${originalAmount} ${exchangeRateSettings.baseCurrency}, Converted amount: ${formattedAmount} ${currency}`);
      
      // Convert payload to URL encoded form data
      const formData = new URLSearchParams();
      Object.entries(payload).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });
      
      const response = await axios.post(wiPayUrl, formData.toString(), { headers });
      
      console.log('WiPay API response:', JSON.stringify(response.data, null, 2));
      
      // Check for different response formats according to documentation
      if (response.data && response.data.url) {
        // Standard format
        return {
          paymentId: payment.id,
          invoiceId: invoice.id,
          amount: amountToStore,
          convertedAmount: Number(formattedAmount),
          currency: currency,
          redirectUrl: response.data.url,
          transactionId: response.data.transaction_id || '',
          meta: meta
        };
      } else {
        console.error('Invalid WiPay response format:', response.data);
        throw new Error('Invalid response from WiPay - no redirect URL found');
      }
    } catch (error: any) {
      // Update the payment record as failed instead of deleting it
      if (payment) {
        await this.update(payment.id, {
          status: 'failed',
          meta: {
            ...meta,
            error: error.message || 'Unknown error',
            errorTimestamp: new Date().toISOString()
          }
        }, companyId);
      }
      
      // Enhanced error logging
      console.error('WiPay API error:', error);
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('WiPay error response data:', error.response.data);
        console.error('WiPay error response status:', error.response.status);
        console.error('WiPay error response headers:', error.response.headers);
        
        // According to documentation, error responses may include a message
        const errorMessage = error.response.data?.message || 'Unknown WiPay error';
        throw new Error(`WiPay payment request failed: ${errorMessage}`);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('WiPay error request:', error.request);
        throw new Error('WiPay payment request failed: No response received from server');
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('WiPay error message:', error.message);
        throw new Error(`WiPay payment request failed: ${error.message || 'Unknown error'}`);
      }
    }
  }

  /**
   * Handle callback from WiPay payment gateway
   */
  async handleWiPayCallback(callbackData: any, companyId: string) {
    // Validate callback data
    if (!callbackData) {
      return { success: false, message: 'No callback data provided' };
    }
    
    console.log('WiPay callback data received:', JSON.stringify(callbackData, null, 2));
    
    // Extract reference from callback data - could be in different fields depending on WiPay version
    const paymentId = callbackData.reference || callbackData.order_id || callbackData.payment_id;
    
    if (!paymentId) {
      return { success: false, message: 'Missing payment reference in callback data' };
    }
    
    // Get the payment by ID
    try {
      const payment = await this.getById(paymentId, companyId);
      
      if (!payment) {
        return { success: false, message: 'Payment not found' };
      }
      
      // Verify payment is in pending state
      if (payment.status !== 'pending') {
        return { success: false, message: 'Payment is not in pending state' };
      }
      
      // Extract transaction ID from callback data
      const transactionId = callbackData.transaction_id || callbackData.id || '';
      
      // Determine payment status from callback data - explicitly handle failed status
      const isSuccess = 
        callbackData.status === 'success' || 
        callbackData.status === 'completed' || 
        callbackData.status === 'approved';
      
      const isFailed = 
        callbackData.status === 'failed' || 
        callbackData.status === 'cancelled' || 
        callbackData.status === 'rejected' ||
        callbackData.status === 'error';
      
      // Default to failed if not explicitly successful
      const finalStatus = isSuccess ? 'completed' : 'failed';
      
      // Try to use timestamp from callback if available, otherwise use current time
      let paymentDate = new Date(); // Default to current time
      
      try {
        // Check for timestamp in various possible formats
        if (callbackData.timestamp) {
          const parsedDate = new Date(callbackData.timestamp);
          if (!isNaN(parsedDate.getTime()) && parsedDate.getFullYear() > 1971) {
            paymentDate = parsedDate;
            console.log(`Using timestamp from callback: ${callbackData.timestamp} -> ${paymentDate.toISOString()}`);
          }
        } else if (callbackData.date) {
          const parsedDate = new Date(callbackData.date);
          if (!isNaN(parsedDate.getTime()) && parsedDate.getFullYear() > 1971) {
            paymentDate = parsedDate;
            console.log(`Using date from callback: ${callbackData.date} -> ${paymentDate.toISOString()}`);
          }
        } else if (callbackData.payment_date) {
          const parsedDate = new Date(callbackData.payment_date);
          if (!isNaN(parsedDate.getTime()) && parsedDate.getFullYear() > 1971) {
            paymentDate = parsedDate;
            console.log(`Using payment_date from callback: ${callbackData.payment_date} -> ${paymentDate.toISOString()}`);
          }
        }
      } catch (e) {
        console.error('Error parsing date from callback:', e);
        // Keep using default current time
      }
      
      console.log('Final payment date to be used:', paymentDate.toISOString());
      
      // Get existing metadata
      const meta = payment.meta || {};
      
      // Add callback data to meta
      const updatedMeta = {
        ...meta,
        wiPayCallback: callbackData,
        transactionTimestamp: paymentDate.toISOString(),
        paymentProcessedAt: isSuccess ? paymentDate.toISOString() : null,
        paymentStatus: finalStatus,
        // Ensure currency information is preserved
        currency: meta.currency || 'USD',
        originalAmount: meta.originalAmount,
        convertedAmount: meta.convertedAmount,
        exchangeRate: meta.exchangeRate,
        baseCurrency: meta.baseCurrency
      };
      
      console.log('Updating payment with status:', finalStatus);
      
      // Prepare update data with explicit date handling
      const updateData: Record<string, any> = {
        transactionId: transactionId,
        status: finalStatus,
        meta: updatedMeta
      };
      
      // Always set payment date regardless of success/failure status
      // This ensures we record when the payment attempt was made/completed
      updateData.paymentDate = paymentDate;
      
      console.log('Update data:', JSON.stringify(updateData, (key, value) => {
        if (value instanceof Date) {
          return `Date(${value.toISOString()})`;
        }
        return value;
      }, 2));
      
      // Update the payment
      const updatedPayment = await this.update(paymentId, updateData, companyId);
      
      console.log('Payment after update:', JSON.stringify(updatedPayment, (key, value) => {
        if (key === 'paymentDate' && value) {
          return `Date(${new Date(value).toISOString()})`;
        }
        return value;
      }, 2));
      
      // If payment is completed, update the invoice
      if (isSuccess) {
        await this.completePayment(payment.id, companyId);
      }
      
      return {
        success: true,
        message: `Payment ${isSuccess ? 'completed' : 'failed'}`,
        payment: updatedPayment
      };
    } catch (error: any) {
      console.error('Error handling WiPay callback:', error);
      return { 
        success: false, 
        message: `Payment not found or error processing callback: ${error.message || 'Unknown error'}` 
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