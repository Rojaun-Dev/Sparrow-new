import express from 'express';
import { BillingController } from '../controllers/billing-controller';
import { checkJwt, checkRole } from '../middleware/auth';

const router = express.Router();
const controller = new BillingController();

// Apply JWT middleware to all routes
router.use(checkJwt);

// Calculate fees for a package
router.get('/packages/:packageId/fees', controller.calculatePackageFees);

// Preview invoice calculation without creating one (Admin L1+)
router.post('/invoices/preview', checkRole(['admin_l1', 'admin_l2']), controller.previewInvoice);

// Generate invoice for specific packages (Admin L1+)
router.post('/invoices/generate', checkRole(['admin_l1', 'admin_l2']), controller.generateInvoice);

// Generate invoice for all unbilled packages of a user (Admin L1+)
router.post('/users/:userId/generate-invoice', checkRole(['admin_l1', 'admin_l2']), controller.generateInvoiceForUser);

export default router; 