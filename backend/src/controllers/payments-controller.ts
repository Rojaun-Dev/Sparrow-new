import { Request, Response, NextFunction } from 'express';
import { PaymentsService } from '../services/payments-service';
import { z } from 'zod';
import { format as csvFormat } from 'fast-csv';
import { PassThrough } from 'stream';
import { ApiResponse } from '../utils/response';
import { UsersService } from '../services/users-service';
import { createPaymentSchema, batchPaymentSchema } from '../validation/payment-schemas';

interface AuthRequest extends Request {
  companyId?: string;
}

export class PaymentsController {
  private paymentsService: PaymentsService;
  private usersService: UsersService;

  constructor() {
    this.paymentsService = new PaymentsService();
    this.usersService = new UsersService();
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
      
      // Create the payment
      const payment = await this.paymentsService.createPayment(paymentData, companyId);
      
      // If payment status is completed, update the invoice
      if (payment && payment.status === 'completed') {
        await this.paymentsService.completePayment(payment.id, companyId);
      }
      
      // Send notification if requested
      if (sendNotification && payment && payment.userId) {
        try {
          const user = await this.usersService.getUserById(payment.userId, companyId);
          
          if (user && 
              user.email && 
              user.notificationPreferences?.email && 
              user.notificationPreferences?.paymentConfirmations?.email) {
            
            // Send payment confirmation email
            // (You'll need to create this method in EmailService)
            // await this.emailService.sendPaymentConfirmationEmail(...);
          }
        } catch (emailError) {
          console.error('Failed to send payment notification:', emailError);
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
          if (payment && payment.status === 'completed') {
            await this.paymentsService.completePayment(payment.id, companyId);
          }
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
          // You may want to send notifications here
        } catch (emailError) {
          console.error('Failed to send batch payment notification:', emailError);
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
      
      const payment = await this.paymentsService.updatePayment(id, req.body, companyId);
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
} 