import express from 'express';
import { PreAlertsController } from '../controllers/pre-alerts-controller';
import { checkJwt, checkRole } from '../middleware/auth';

const router = express.Router({ mergeParams: true }); // mergeParams allows access to companyId from parent router
const controller = new PreAlertsController();

// Apply JWT authentication to all routes
router.use(checkJwt);

// Search pre-alerts with filtering (accessible to all authenticated users)
router.get('/search', controller.searchPreAlerts);

// Get unmatched pre-alerts (Admin L1+)
router.get('/unmatched', checkRole(['admin_l1', 'admin_l2']), controller.getUnmatchedPreAlerts);

// Get pre-alerts by status (Admin L1+)
router.get('/status/:status', checkRole(['admin_l1', 'admin_l2']), controller.getPreAlertsByStatus);

// Get pre-alerts by user ID (access control handled at service level)
router.get('/user/:userId', controller.getPreAlertsByUserId);

// Get all pre-alerts (Admin L1+)
router.get('/', checkRole(['admin_l1', 'admin_l2']), controller.getAllPreAlerts);

// Get pre-alert by ID (access control handled at service level for customers)
router.get('/:id', controller.getPreAlertById);

// Create new pre-alert (accessible to all authenticated users)
router.post('/', controller.createPreAlert);

// Update pre-alert (Admin L1+ or owner)
router.put('/:id', controller.updatePreAlert);

// Cancel pre-alert (Admin L1+ or owner)
router.post('/:id/cancel', controller.cancelPreAlert);

// Delete pre-alert (Admin L2 only)
router.delete('/:id', checkRole('admin_l2'), controller.deletePreAlert);

export default router; 