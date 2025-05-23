import express, { RequestHandler } from 'express';
import { PreAlertsController } from '../controllers/pre-alerts-controller';
// Commented out until auth is fully implemented
// import { checkJwt, checkRole } from '../middleware/auth';

const router = express.Router({ mergeParams: true }); // mergeParams allows access to companyId from parent router
const controller = new PreAlertsController();

// Apply JWT authentication to all routes
// router.use(checkJwt); NOTE: enable this when we have login and auth implemented fully

// Get all pre-alerts for a company (Admin L1+)
router.get('/', controller.getAllPreAlerts as RequestHandler);

// Get pre-alerts by user ID (access control handled in service)
router.get('/user/:userId', controller.getPreAlertsByUserId as RequestHandler);

// Get pre-alerts by status (Admin L1+)
router.get('/status/:status', controller.getPreAlertsByStatus as RequestHandler);

// Get unmatched pre-alerts (Admin L1+)
router.get('/unmatched', controller.getUnmatchedPreAlerts as RequestHandler);

// Search pre-alerts with filtering
router.get('/search', controller.searchPreAlerts as RequestHandler);

// Create new pre-alert
router.post('/', controller.createPreAlert as RequestHandler);

// Get pre-alert by ID
router.get('/:id', controller.getPreAlertById as RequestHandler);

// Update pre-alert
router.put('/:id', controller.updatePreAlert as RequestHandler);

// Cancel pre-alert
router.patch('/:id/cancel', controller.cancelPreAlert as RequestHandler);

// Delete pre-alert (Admin L2 only)
router.delete('/:id', controller.deletePreAlert as RequestHandler);

// Upload documents to a pre-alert
router.post('/:id/documents', controller.uploadDocuments as RequestHandler);

// Remove a document from a pre-alert
router.delete('/:id/documents/:index', controller.removeDocument as RequestHandler);

export default router; 