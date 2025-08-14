import { Request, Response, NextFunction } from 'express';
import { PaymentsService } from '../services/payments-service';
import { z } from 'zod';
import { format as csvFormat } from 'fast-csv';
import { PassThrough } from 'stream';
import { ApiResponse } from '../utils/response';
import { UsersService } from '../services/users-service';
import { createPaymentSchema, batchPaymentSchema } from '../validation/payment-schemas';
import { AuditLogsService } from '../services/audit-logs-service';
import { EmailService } from '../services/email-service';
import { CompaniesService } from '../services/companies-service';
import { InvoicesService } from '../services/invoices-service';

interface AuthRequest extends Request {
  companyId?: string;
  userId?: string;
}

export class PaymentsController {
  private paymentsService: PaymentsService;
  private usersService: UsersService;
  private auditLogsService: AuditLogsService;
  private emailService: EmailService;
  private companiesService: CompaniesService;
  private invoicesService: InvoicesService;

  constructor() {
    this.paymentsService = new PaymentsService();
    this.usersService = new UsersService();
    this.auditLogsService = new AuditLogsService();
    this.emailService = new EmailService();
    this.companiesService = new CompaniesService();
    this.invoicesService = new InvoicesService();
  }

  /**
   * Get all payments for a company
   */
  getAllPayments = async (req: AuthRequest, res: Response) => {
    try {
      const companyId = req.companyId as string;
      
      // Parse search params for filtering
      const searchParams: Record<string, any> = {
        ...req.query,
      };
      
      // Convert pagination parameters
      if (searchParams.page) {
        searchParams.page = Number(searchParams.page);
      }
      if (searchParams.limit) {
        searchParams.pageSize = Number(searchParams.limit);
      }
      
      // Use searchPayments for consistent pagination and filtering
      const payments = await this.paymentsService.searchPayments(companyId, searchParams);
      return ApiResponse.success(res, payments);
    } catch (error: any) {
      console.error('Error fetching payments:', error);
      return ApiResponse.serverError(res, 'Failed to retrieve payments');
    }
  };

  /**
   * Get a specific payment by ID
   */
  getPaymentById = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const companyId = req.companyId as string;
      
      const payment = await this.paymentsService.getById(id, companyId);
      return ApiResponse.success(res, payment);
    } catch (error: any) {
      console.error('Error fetching payment:', error);
      if (error.message === 'Entity not found') {
        return ApiResponse.notFound(res, 'Payment not found');
      }
      return ApiResponse.serverError(res, 'Failed to retrieve payment');
    }
  };

  /**
   * Create a new payment
   */
  createPayment = async (req: AuthRequest, res: Response) => {
    try {
      const companyId = req.companyId as string;
      const adminUserId = req.userId as string;
      const ipAddress = req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';
      const { sendNotification = false, ...paymentData } = req.body;
      
      // Validate payment data
      try {
        createPaymentSchema.parse(paymentData);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return ApiResponse.validationError(res, error);
        }
        throw error;
      }
      
      // The meta object should be preserved as-is from the frontend
      // The service will handle metadata processing properly
      
      // Create the payment
      const payment = await this.paymentsService.createPayment(paymentData, companyId);
      
      if (payment) {
        // Create audit log for payment creation
        await this.auditLogsService.createLog({
          userId: adminUserId,
          companyId,
          action: 'payment_creation',
          entityType: 'payment',
          entityId: payment.id,
          details: {
            paymentId: payment.id,
            amount: payment.amount,
            paymentMethod: payment.paymentMethod,
            status: payment.status,
            invoiceId: payment.invoiceId,
            customerId: payment.userId,
            meta: payment.meta // Include meta information in audit logs
          },
          ipAddress,
          userAgent
        });
      }
      
      // Payment completion is now handled internally by the service
      // No need to call completePayment again here
      
      // Send notification if requested
      if (sendNotification && payment && payment.userId) {
        try {
          const user = await this.usersService.getUserById(payment.userId, companyId);
          
          if (user && 
              user.email && 
              user.notificationPreferences?.email && 
              user.notificationPreferences?.billingUpdates?.email) {
            
            // Get invoice details for the email
            const invoice = await this.invoicesService.getInvoiceById(payment.invoiceId, companyId);
            
            // Get company name
            const company = await this.companiesService.getCompanyById(companyId);
            const companyName = company ? company.name : 'Cautious Robot';
            
            // Format the payment date
            const paymentDate = payment.paymentDate ? 
              new Date(payment.paymentDate).toLocaleDateString() : 
              new Date().toLocaleDateString();
            
            // Get currency information from meta if available
            const meta = payment.meta as Record<string, any> | undefined;
            const currencyInfo = meta && meta.currency ? {
              currency: meta.currency as string,
              exchangeRate: meta.exchangeRate as number | undefined
            } : undefined;
            
            // Send payment confirmation email
            await this.emailService.sendPaymentConfirmationEmail(
              user.email,
              user.firstName,
              {
                invoiceNumber: invoice.invoiceNumber || '',
                paymentMethod: payment.paymentMethod,
                amount: payment.amount,
                paymentDate: paymentDate,
                transactionId: payment.transactionId || undefined,
                status: payment.status,
                companyName,
                invoiceId: payment.invoiceId,
                paymentId: payment.id,
                currencyInfo
              }
            );
          }
        } catch (emailError) {
          console.error('Failed to send payment notification:', emailError);
          // Don't fail the request if email sending fails
        }
      }
      
      return ApiResponse.success(res, payment, 'Payment processed successfully', 201);
    } catch (error: any) {
      console.error('Error creating payment:', error);
      return ApiResponse.serverError(res, error.message || 'Failed to create payment');
    }
  };

  /**
   * Process payments for multiple invoices at once
   */
  processBatchPayment = async (req: AuthRequest, res: Response) => {
    try {
      const companyId = req.companyId as string;
      const { sendNotification = false, payments } = req.body;
      
      // Validate payment data
      try {
        batchPaymentSchema.parse({ payments, sendNotification });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return ApiResponse.validationError(res, error);
        }
        throw error;
      }
      
      // Process payments for each payment object
      const results = [];
      const errors = [];
      
      for (const paymentData of payments) {
        try {
          const payment = await this.paymentsService.createPayment(paymentData, companyId);
          // Payment completion is now handled internally by the service
          results.push(payment);
        } catch (error: any) {
          errors.push({
            invoiceId: paymentData.invoiceId,
            error: error.message || 'Unknown error'
          });
        }
      }
      
      // Send notification if requested and any payments were successful
      if (sendNotification && results.length > 0) {
        try {
          // Process notifications for each successful payment
          for (const payment of results) {
            if (payment && payment.userId) {
              const user = await this.usersService.getUserById(payment.userId, companyId);
              
              // Only send if the user has email notifications enabled
              if (user && 
                  user.email && 
                  user.notificationPreferences?.email && 
                  user.notificationPreferences?.billingUpdates?.email) {
                
                // Get invoice details for the email
                const invoice = await this.invoicesService.getInvoiceById(payment.invoiceId, companyId);
                
                // Get company name
                const company = await this.companiesService.getCompanyById(companyId);
                const companyName = company ? company.name : 'Cautious Robot';
                
                // Format the payment date
                const paymentDate = payment.paymentDate ? 
                  new Date(payment.paymentDate).toLocaleDateString() : 
                  new Date().toLocaleDateString();
                
                // Get currency information from meta if available
                const meta = payment.meta as Record<string, any> | undefined;
                const currencyInfo = meta && meta.currency ? {
                  currency: meta.currency as string,
                  exchangeRate: meta.exchangeRate as number | undefined
                } : undefined;
                
                // Send payment confirmation email
                await this.emailService.sendPaymentConfirmationEmail(
                  user.email,
                  user.firstName,
                  {
                    invoiceNumber: invoice.invoiceNumber || '',
                    paymentMethod: payment.paymentMethod,
                    amount: payment.amount,
                    paymentDate: paymentDate,
                    transactionId: payment.transactionId || undefined,
                    status: payment.status,
                    companyName,
                    invoiceId: payment.invoiceId,
                    paymentId: payment.id,
                    currencyInfo
                  }
                );
              }
            }
          }
        } catch (emailError) {
          console.error('Failed to send batch payment notification:', emailError);
          // Don't fail the request if email sending fails
        }
      }
      
      return ApiResponse.success(res, {
        results,
        errors,
        totalProcessed: results.length,
        totalErrors: errors.length
      }, 'Batch payment processing completed', 201);
    } catch (error: any) {
      console.error('Error processing batch payment:', error);
      return ApiResponse.serverError(res, error.message || 'Failed to process batch payment');
    }
  };

  /**
   * Update an existing payment
   */
  updatePayment = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const companyId = req.companyId as string;
      const adminUserId = req.userId as string;
      const ipAddress = req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';

      // Get payment before update for audit log
      const paymentBefore = await this.paymentsService.getById(id, companyId);
      
      const payment = await this.paymentsService.updatePayment(id, req.body, companyId);
      
      if (payment && paymentBefore) {
        // Create audit log for payment update
        await this.auditLogsService.createLog({
          userId: adminUserId,
          companyId,
          action: 'payment_update',
          entityType: 'payment',
          entityId: id,
          details: {
            paymentId: id,
            previousStatus: paymentBefore.status,
            newStatus: payment.status,
            changes: Object.keys(req.body).reduce<Record<string, {from: any, to: any}>>((acc, key) => {
              const k = key as keyof typeof paymentBefore;
              if (paymentBefore[k] !== req.body[k]) {
                acc[key] = {
                  from: paymentBefore[k],
                  to: req.body[k]
                };
              }
              return acc;
            }, {})
          },
          ipAddress,
          userAgent
        });
      }
      
      return ApiResponse.success(res, payment, 'Payment updated successfully');
    } catch (error: any) {
      console.error('Error updating payment:', error);
      if (error instanceof z.ZodError) {
        return ApiResponse.validationError(res, error);
      } else if (error.message === 'Entity not found') {
        return ApiResponse.notFound(res, 'Payment not found');
      } else {
        return ApiResponse.serverError(res, error.message || 'Failed to update payment');
      }
    }
  };

  /**
   * Process a refund for a payment
   */
  refundPayment = async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const companyId = req.companyId as string;
      
      const refundedPayment = await this.paymentsService.refundPayment(id, companyId);
      return ApiResponse.success(res, refundedPayment, 'Payment refunded successfully');
    } catch (error: any) {
      console.error('Error processing refund:', error);
      if (error.message === 'Entity not found') {
        return ApiResponse.notFound(res, 'Payment not found');
      } else if (error.message === 'Only completed payments can be refunded') {
        return ApiResponse.badRequest(res, error.message);
      } else {
        return ApiResponse.serverError(res, error.message || 'Failed to process refund');
      }
    }
  };

  /**
   * Get all payments for a specific invoice
   */
  getPaymentsByInvoice = async (req: AuthRequest, res: Response) => {
    try {
      const { invoiceId } = req.params;
      const companyId = req.companyId as string;
      
      const payments = await this.paymentsService.getPaymentsByInvoice(invoiceId, companyId);
      return ApiResponse.success(res, payments);
    } catch (error: any) {
      console.error('Error fetching payments for invoice:', error);
      if (error.message === 'Entity not found') {
        return ApiResponse.notFound(res, 'Invoice not found');
      } else {
        return ApiResponse.serverError(res, error.message || 'Failed to retrieve payments');
      }
    }
  };

  /**
   * Get all payments for a specific user
   */
  getPaymentsByUser = async (req: AuthRequest, res: Response) => {
    try {
      const { userId } = req.params;
      const companyId = req.companyId as string;
      // Always use searchPayments for pagination, even if no query params
      const searchParams: Record<string, any> = {
        userId: userId,
        ...req.query,
      };
      // Convert date parameters
      if (searchParams.dateFrom) {
        searchParams.dateFrom = new Date(searchParams.dateFrom as string);
      }
      if (searchParams.dateTo) {
        searchParams.dateTo = new Date(searchParams.dateTo as string);
      }
      // Convert pagination parameters
      if (searchParams.page) {
        searchParams.page = Number(searchParams.page);
      } else {
        searchParams.page = 1;
      }
      if (searchParams.limit) {
        searchParams.pageSize = Number(searchParams.limit);
      } else {
        searchParams.pageSize = 10;
      }
      // Use the search method with filters
      const filteredPayments = await this.paymentsService.searchPayments(companyId, searchParams);
      return ApiResponse.success(res, filteredPayments);
    } catch (error: any) {
      console.error('Error fetching payments for user:', error);
      return ApiResponse.serverError(res, error.message || 'Failed to retrieve payments');
    }
  };

  /**
   * Get payments by status
   */
  getPaymentsByStatus = async (req: AuthRequest, res: Response) => {
    try {
      const { status } = req.params;
      const companyId = req.companyId as string;
      
      // Validate the status parameter
      if (!['pending', 'completed', 'failed', 'refunded'].includes(status)) {
        return ApiResponse.badRequest(res, 'Invalid status parameter');
      }
      
      const payments = await this.paymentsService.getPaymentsByStatus(
        status as 'pending' | 'completed' | 'failed' | 'refunded', 
        companyId
      );
      return ApiResponse.success(res, payments);
    } catch (error: any) {
      console.error('Error fetching payments by status:', error);
      return ApiResponse.serverError(res, error.message || 'Failed to retrieve payments');
    }
  };

  /**
   * Get total payments received within a date range
   */
  getTotalPaymentsInPeriod = async (req: AuthRequest, res: Response) => {
    try {
      const companyId = req.companyId as string;
      const { startDate, endDate } = req.query;
      
      // Validate date parameters
      if (!startDate || !endDate) {
        return ApiResponse.badRequest(res, 'Both startDate and endDate are required');
      }
      
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return ApiResponse.badRequest(res, 'Invalid date format');
      }
      
      const totalAmount = await this.paymentsService.getTotalPaymentsInPeriod(companyId, start, end);
      return ApiResponse.success(res, { totalAmount });
    } catch (error: any) {
      console.error('Error calculating total payments:', error);
      return ApiResponse.serverError(res, error.message || 'Failed to calculate total payments');
    }
  };

  /**
   * Create WiPay payment request
   */
  createWiPayRequest = async (req: AuthRequest, res: Response) => {
    try {
      const companyId = req.companyId as string;
      const userId = req.userId as string;
      const ipAddress = req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';
      
      // Validate request data using the schema
      let validatedData;
      try {
        const { wiPayRequestSchema } = require('../validation/payment-schemas');
        validatedData = wiPayRequestSchema.parse(req.body);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return ApiResponse.validationError(res, error);
        }
        throw error;
      }
      
      const paymentRequest = await this.paymentsService.createWiPayRequest(validatedData, companyId);
      
      // Create audit log for payment request creation
      await this.auditLogsService.createLog({
        userId: userId,
        companyId,
        action: 'wipay_payment_request',
        entityType: 'payment',
        entityId: paymentRequest.paymentId,
        details: {
          invoiceId: validatedData.invoiceId,
          currency: validatedData.currency,
          amount: paymentRequest.amount,
          convertedAmount: paymentRequest.convertedAmount,
          meta: paymentRequest.meta
        },
        ipAddress,
        userAgent
      });
      
      return ApiResponse.success(res, paymentRequest, 'WiPay payment request created');
    } catch (error: any) {
      console.error('Error creating WiPay payment request:', error);
      if (error instanceof z.ZodError) {
        return ApiResponse.validationError(res, error);
      } else {
        return ApiResponse.serverError(res, error.message || 'Failed to create WiPay payment request');
      }
    }
  };

  /**
   * Handle WiPay callback
   */
  handleWiPayCallback = async (req: AuthRequest, res: Response) => {
    try {
      const companyId = req.companyId as string;
      const callbackData = req.body;
      
      console.log('Received WiPay callback:', JSON.stringify(callbackData, null, 2));
      console.log('Request headers:', JSON.stringify(req.headers, null, 2));
      
      // Process callback data
      const result = await this.paymentsService.handleWiPayCallback(callbackData, companyId);
      
      if (result.success && result.payment) {
        // Create audit log for the payment update
        const payment = result.payment;
        const meta = payment.meta as Record<string, any> | undefined;
        
        // Log the transaction with detailed currency information
        await this.auditLogsService.createLog({
          userId: payment.userId || 'system',
          companyId,
          action: 'payment_processed',
          entityType: 'payment',
          entityId: payment.id,
          details: {
            paymentId: payment.id,
            amount: payment.amount,
            paymentMethod: payment.paymentMethod,
            status: payment.status,
            invoiceId: payment.invoiceId,
            transactionId: payment.transactionId,
            paymentDate: payment.paymentDate,
            // Include currency and exchange rate information
            currency: meta?.currency || 'USD',
            originalAmount: meta?.originalAmount,
            convertedAmount: meta?.convertedAmount,
            exchangeRate: meta?.exchangeRate,
            baseCurrency: meta?.baseCurrency,
            wiPayCallbackReceived: new Date().toISOString()
          },
          ipAddress: req.ip || 'unknown',
          userAgent: req.headers['user-agent'] || 'unknown'
        });
        
        // If payment was successful, send confirmation email
        if (payment.status === 'completed' && payment.userId) {
          try {
            const user = await this.usersService.getUserById(payment.userId, companyId);
            
            if (user && 
                user.email && 
                user.notificationPreferences?.email && 
                user.notificationPreferences?.billingUpdates?.email) {
              
              // Get invoice details for the email
              const invoice = await this.invoicesService.getInvoiceById(payment.invoiceId, companyId);
              
              // Get company name
              const company = await this.companiesService.getCompanyById(companyId);
              const companyName = company ? company.name : 'Cautious Robot';
              
              // Format the payment date
              const paymentDate = payment.paymentDate ? 
                new Date(payment.paymentDate).toLocaleDateString() : 
                new Date().toLocaleDateString();
              
              // Get currency information from meta if available
              const currencyInfo = meta ? {
                currency: meta.currency as string || 'USD',
                exchangeRate: meta.exchangeRate as number | undefined,
                originalAmount: meta.originalAmount as number | undefined,
                convertedAmount: meta.convertedAmount as number | undefined,
                baseCurrency: meta.baseCurrency as string || 'USD'
              } : undefined;
              
              // Send payment confirmation email
              await this.emailService.sendPaymentConfirmationEmail(
                user.email,
                user.firstName,
                {
                  invoiceNumber: invoice.invoiceNumber || '',
                  paymentMethod: payment.paymentMethod,
                  amount: payment.amount,
                  paymentDate: paymentDate,
                  transactionId: payment.transactionId || undefined,
                  status: payment.status,
                  companyName,
                  invoiceId: payment.invoiceId,
                  paymentId: payment.id,
                  currencyInfo
                }
              );
            }
          } catch (emailError) {
            console.error('Failed to send payment confirmation email:', emailError);
            // Don't fail the request if email sending fails
          }
        }
        
        return ApiResponse.success(res, result.payment, result.message);
      } else {
        console.warn('WiPay callback processing failed:', result.message);
        return ApiResponse.badRequest(res, result.message);
      }
    } catch (error: any) {
      console.error('Error processing WiPay callback:', error);
      return ApiResponse.serverError(res, error.message || 'Failed to process WiPay callback');
    }
  };

  exportPaymentsCsv = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.companyId as string;
      const filters: Record<string, any> = { ...req.query };
      const payments = await this.paymentsService.exportPaymentsCsv(companyId, filters);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="payments.csv"');
      const csvStream = csvFormat({ headers: true });
      const passThrough = new PassThrough();
      csvStream.pipe(passThrough);
      payments.forEach(payment => csvStream.write(payment));
      csvStream.end();
      passThrough.pipe(res);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete a payment (only pending/failed payments allowed)
   */
  deletePayment = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.companyId as string;
      const paymentId = req.params.id;
      
      // Get the payment to check its status
      const payment = await this.paymentsService.getById(paymentId, companyId);
      
      if (!payment) {
        return res.status(404).json({ message: 'Payment not found' });
      }
      
      // Only allow deletion of pending or failed payments
      if (payment.status !== 'pending' && payment.status !== 'failed') {
        return res.status(400).json({ 
          message: 'Only pending or failed payments can be deleted' 
        });
      }
      
      // Delete the payment
      await this.paymentsService.delete(paymentId, companyId);
      
      // Create audit log
      await this.auditLogsService.createLog({
        userId: req.userId || 'system',
        companyId,
        action: 'DELETE',
        entityType: 'Payment',
        entityId: paymentId,
        details: `Deleted ${payment.status} payment for invoice ${payment.invoiceId}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      return res.status(200).json({ 
        message: 'Payment deleted successfully',
        deletedPayment: {
          id: payment.id,
          status: payment.status,
          amount: payment.amount,
          invoiceId: payment.invoiceId
        }
      });
    } catch (error) {
      next(error);
      return;
    }
  };

  /**
   * Retry a failed payment by creating a new WiPay request
   */
  retryPayment = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.companyId as string;
      const paymentId = req.params.id;
      
      // Get the original payment to check its status and get invoice details
      const originalPayment = await this.paymentsService.getById(paymentId, companyId);
      
      if (!originalPayment) {
        return res.status(404).json({ message: 'Payment not found' });
      }
      
      // Only allow retry of pending or failed payments
      if (originalPayment.status !== 'pending' && originalPayment.status !== 'failed') {
        return res.status(400).json({ 
          message: 'Only pending or failed payments can be retried' 
        });
      }
      
      // Get the invoice to verify it's still payable
      const invoicesService = new InvoicesService();
      const invoice = await invoicesService.getInvoiceById(originalPayment.invoiceId, companyId);
      
      if (!invoice) {
        return res.status(404).json({ message: 'Associated invoice not found' });
      }
      
      if (invoice.status === 'paid') {
        return res.status(400).json({ 
          message: 'Invoice has already been paid' 
        });
      }
      
      // Extract metadata from original payment to maintain currency settings
      const originalMeta = originalPayment.meta as Record<string, any> | undefined;
      const currency = originalMeta?.currency || 'USD';
      
      // Delete the old payment record
      await this.paymentsService.delete(paymentId, companyId);
      
      // Create a new WiPay request with same parameters
      const wiPayRequest = {
        invoiceId: originalPayment.invoiceId,
        responseUrl: req.body.responseUrl || `${req.get('origin')}/customer/invoices/${originalPayment.invoiceId}`,
        origin: 'SparrowX-Retry',
        currency: currency
      };
      
      // Create new WiPay payment request
      const result = await this.paymentsService.createWiPayRequest(wiPayRequest, companyId);
      
      // Create audit log for the retry
      await this.auditLogsService.createLog({
        userId: req.userId || originalPayment.userId,
        companyId,
        action: 'RETRY',
        entityType: 'Payment',
        entityId: result.paymentId,
        details: `Retried payment for invoice ${originalPayment.invoiceId} (original payment: ${paymentId})`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      return res.status(200).json({
        message: 'Payment retry initiated successfully',
        redirectUrl: result.redirectUrl,
        newPaymentId: result.paymentId,
        originalPaymentId: paymentId,
        currency: currency,
        amount: result.amount
      });
    } catch (error) {
      next(error);
      return;
    }
  };
} 