import express from 'express';
import { InvoicesController } from '../controllers/invoices-controller';
import { checkJwt, checkRole } from '../middleware/auth';

const router = express.Router({ mergeParams: true }); // mergeParams allows access to companyId from parent router
const controller = new InvoicesController();

// Apply JWT authentication to all routes
router.use(checkJwt);

// Search invoices with filtering (accessible to all authenticated users)
router.get('/search', controller.searchInvoices);

// Get invoices by status (Admin L1+)
router.get('/status/:status', checkRole(['admin_l1', 'admin_l2']), controller.getInvoicesByStatus);

// Get invoices by user ID (access control handled at service level)
router.get('/user/:userId', controller.getInvoicesByUserId);

// Get all invoices (Admin L1+)
router.get('/', checkRole(['admin_l1', 'admin_l2']), controller.getAllInvoices);

// Get invoice by ID (access control handled at service level for customers)
router.get('/:id', controller.getInvoiceById);

// Create new invoice (Admin L1+)
router.post('/', checkRole(['admin_l1', 'admin_l2']), controller.createInvoice);

// Update invoice (Admin L1+)
router.put('/:id', checkRole(['admin_l1', 'admin_l2']), controller.updateInvoice);

// Finalize invoice (Admin L1+)
router.post('/:id/finalize', checkRole(['admin_l1', 'admin_l2']), controller.finalizeInvoice);

// Cancel invoice (Admin L1+)
router.post('/:id/cancel', checkRole(['admin_l1', 'admin_l2']), controller.cancelInvoice);

// Delete invoice (Admin L2 only)
router.delete('/:id', checkRole('admin_l2'), controller.deleteInvoice);

export default router; 