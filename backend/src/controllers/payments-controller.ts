import { Request, Response } from 'express';
import { PaymentsService } from '../services/payments-service';
import { z } from 'zod';

interface AuthRequest extends Request {
  companyId?: string;
}

export class PaymentsController {
  private paymentsService: PaymentsService;

  constructor() {
    this.paymentsService = new PaymentsService();
  }

  /**
   * Get all payments for a company
   */
  getAllPayments = async (req: AuthRequest, res: Response) => {
    try {
      const companyId = req.companyId as string;
      const payments = await this.paymentsService.getAll(companyId);
      return res.json(payments);
    } catch (error: any) {
      console.error('Error fetching payments:', error);
      return res.status(500).json({ error: 'Failed to retrieve payments' });
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
      return res.json(payment);
    } catch (error: any) {
      console.error('Error fetching payment:', error);
      return res.status(404).json({ error: 'Payment not found' });
    }
  };

  /**
   * Create a new payment
   */
  createPayment = async (req: AuthRequest, res: Response) => {
    try {
      const companyId = req.companyId as string;
      const payment = await this.paymentsService.createPayment(req.body, companyId);
      return res.status(201).json(payment);
    } catch (error: any) {
      console.error('Error creating payment:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid payment data', details: error.errors });
      } else {
        return res.status(500).json({ error: 'Failed to create payment', message: error.message });
      }
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
      return res.json(payment);
    } catch (error: any) {
      console.error('Error updating payment:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid payment data', details: error.errors });
      } else if (error.message === 'Entity not found') {
        return res.status(404).json({ error: 'Payment not found' });
      } else {
        return res.status(500).json({ error: 'Failed to update payment', message: error.message });
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
      return res.json(refundedPayment);
    } catch (error: any) {
      console.error('Error processing refund:', error);
      if (error.message === 'Entity not found') {
        return res.status(404).json({ error: 'Payment not found' });
      } else if (error.message === 'Only completed payments can be refunded') {
        return res.status(400).json({ error: error.message });
      } else {
        return res.status(500).json({ error: 'Failed to process refund', message: error.message });
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
      return res.json(payments);
    } catch (error: any) {
      console.error('Error fetching payments for invoice:', error);
      if (error.message === 'Entity not found') {
        return res.status(404).json({ error: 'Invoice not found' });
      } else {
        return res.status(500).json({ error: 'Failed to retrieve payments', message: error.message });
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
      
      const payments = await this.paymentsService.getPaymentsByUser(userId, companyId);
      return res.json(payments);
    } catch (error: any) {
      console.error('Error fetching payments for user:', error);
      return res.status(500).json({ error: 'Failed to retrieve payments', message: error.message });
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
        return res.status(400).json({ error: 'Invalid status parameter' });
      }
      
      const payments = await this.paymentsService.getPaymentsByStatus(
        status as 'pending' | 'completed' | 'failed' | 'refunded', 
        companyId
      );
      return res.json(payments);
    } catch (error: any) {
      console.error('Error fetching payments by status:', error);
      return res.status(500).json({ error: 'Failed to retrieve payments', message: error.message });
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
        return res.status(400).json({ error: 'Both startDate and endDate are required' });
      }
      
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ error: 'Invalid date format' });
      }
      
      const totalAmount = await this.paymentsService.getTotalPaymentsInPeriod(companyId, start, end);
      return res.json({ totalAmount });
    } catch (error: any) {
      console.error('Error calculating total payments:', error);
      return res.status(500).json({ error: 'Failed to calculate total payments', message: error.message });
    }
  };
} 