import express from 'express';
import { PaymentsController } from '../controllers/payments-controller';
// import { checkJwt, checkRole } from '../middleware/auth';

const router = express.Router({ mergeParams: true });
const paymentsController = new PaymentsController();

// Apply JWT authentication middleware to all payment routes
// router.use(checkJwt); NOTE: enable this and checkRole when we have login and auth implemented fully

// Get all payments for a company
router.get(
  '/',
  /*checkRole(['admin_l1', 'admin_l2']),*/
  paymentsController.getAllPayments
);

// Create a new payment
router.post(
  '/',
  /*checkRole(['admin_l1', 'admin_l2']),*/
  paymentsController.createPayment
);

// Process batch payments for multiple invoices
router.post(
  '/batch',
  /*checkRole(['admin_l1', 'admin_l2']),*/
  paymentsController.processBatchPayment
);

// Create WiPay payment request
router.post(
  '/wipay/request',
  /*checkRole(['admin_l1', 'admin_l2', 'customer']),*/
  paymentsController.createWiPayRequest
);

// Handle WiPay callback
router.post(
  '/wipay/callback',
  paymentsController.handleWiPayCallback
);

// Get payment by ID
router.get(
  '/:id',
  /*checkRole(['admin_l1', 'admin_l2', 'customer']),*/
  paymentsController.getPaymentById
);

// Update payment
router.put(
  '/:id',
  /*checkRole(['admin_l1', 'admin_l2']),*/
  paymentsController.updatePayment
);

// Delete payment (only pending/failed payments)
router.delete(
  '/:id',
  /*checkRole(['admin_l1', 'admin_l2', 'customer']),*/
  paymentsController.deletePayment
);

// Retry a failed payment
router.post(
  '/:id/retry',
  /*checkRole(['admin_l1', 'admin_l2', 'customer']),*/
  paymentsController.retryPayment
);

// Process a refund
router.post(
  '/:id/refund',
  /*checkRole(['admin_l2']),*/ // Only highest level admins can process refunds
  paymentsController.refundPayment
);

// Get payments by invoice
router.get(
  '/invoice/:invoiceId',
  /*checkRole(['admin_l1', 'admin_l2', 'customer']),*/
  paymentsController.getPaymentsByInvoice
);

// Get payments by user
router.get(
  '/user/:userId',
  /*checkRole(['admin_l1', 'admin_l2']),*/
  paymentsController.getPaymentsByUser
);

// Get payments by status
router.get(
  '/status/:status',
  /*checkRole(['admin_l1', 'admin_l2']),*/
  paymentsController.getPaymentsByStatus
);

// Get total payments in date range
router.get(
  '/analytics/total',
  /*checkRole(['admin_l2']),*/
  paymentsController.getTotalPaymentsInPeriod
);

// Export payments as CSV
router.get('/export-csv', paymentsController.exportPaymentsCsv);

export default router; 