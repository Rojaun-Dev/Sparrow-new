import express from 'express';
import { PreAlertsController } from '../controllers/pre-alerts-controller';
// Commented out until auth is fully implemented
// import { checkJwt, checkRole } from '../middleware/auth';

const router = express.Router({ mergeParams: true }); // mergeParams allows access to companyId from parent router
const controller = new PreAlertsController();

// Apply JWT authentication to all routes
// router.use(checkJwt); NOTE: enable this when we have login and auth implemented fully

// Get all pre-alerts for a company (Admin L1+)
router.get('/', controller.getAllPreAlerts);

// Get pre-alerts by user ID (access control handled in service)
router.get('/user/:userId', controller.getPreAlertsByUserId);

// Get pre-alerts by status (Admin L1+)
router.get('/status/:status', controller.getPreAlertsByStatus);

// Get unmatched pre-alerts (Admin L1+)
router.get('/unmatched', controller.getUnmatchedPreAlerts);

// Search pre-alerts with filtering
router.get('/search', controller.searchPreAlerts);

// Create new pre-alert
router.post('/', controller.createPreAlert);

// Get pre-alert by ID
router.get('/:id', controller.getPreAlertById);

// Update pre-alert
router.put('/:id', controller.updatePreAlert);

// Cancel pre-alert
router.patch('/:id/cancel', controller.cancelPreAlert);

// Delete pre-alert (Admin L2 only)
router.delete('/:id', controller.deletePreAlert);

// Upload documents to a pre-alert
router.post('/:id/documents', controller.uploadDocuments);

// Remove a document from a pre-alert
router.delete('/:id/documents/:index', controller.removeDocument);

export default router; 