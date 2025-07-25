import express from 'express';
import companiesRoutes from './companies-routes';
import usersRoutes from './users-routes';
import authRoutes from './auth-routes';
import adminRoutes from './admin-routes';
import superadminRoutes from './superadmin-routes';
import companySettingsRoutes from './company-settings-routes';
import preAlertsRoutes from './pre-alerts-routes';
import packagesRoutes from './packages-routes';
import feesRoutes from './fees-routes';
import statisticsRoutes from './statistics-routes';
import invoicesRoutes from './invoices-routes';
import paymentsRoutes from './payments-routes';
import billingRoutes from './billing-routes';
import importRoutes from './import-routes';
import autoImportRoutes from './auto-import-routes';
import { dutyFeesRoutes } from './duty-fees-routes';
import { extractCompanyId, checkJwt } from '../middleware/auth';
import { CompanySettingsController } from '../controllers/company-settings-controller';
import { CompanyAssetsController } from '../controllers/company-assets-controller';
import { AutoImportController } from '../controllers/auto-import-controller';

// Extended request interface with company ID
interface AuthRequest extends express.Request {
  companyId?: string;
  userId?: string;
  userRole?: string;
}

const router = express.Router();
const companySettingsController = new CompanySettingsController();
const companyAssetsController = new CompanyAssetsController();

// Apply company ID extraction middleware to all routes
router.use(extractCompanyId);

// Public endpoints - no authentication required
// Auth routes - not scoped to company
router.use('/auth', authRoutes);

// Public endpoint to get company by subdomain (for login page branding)
router.get('/companies/by-subdomain/:subdomain', companySettingsController.getCompanyBySubdomain);

// Public endpoint to validate API key and get company info (for iframe integration)
router.get('/company-by-api-key', companySettingsController.getCompanyByApiKey);

// Public endpoint for company assets - no auth required (for login/register page branding)
router.get('/companies/:companyId/public-assets', (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Set company ID from params
  (req as any).companyId = req.params.companyId;
  return companyAssetsController.listPublicAssets(req as any, res, next);
});

// Import company invitations controller for public routes
import { CompanyInvitationsController } from '../controllers/company-invitations-controller';
const companyInvitationsController = new CompanyInvitationsController();

// Public company invitation routes - no authentication required
router.get('/companies/verify-invitation/:token', companyInvitationsController.verifyInvitation.bind(companyInvitationsController));
router.post('/companies/register/:token', companyInvitationsController.registerFromInvitation.bind(companyInvitationsController));

// Apply JWT authentication middleware to all other routes
// JWT middleware check is applied directly to these routes
const protectedRoutes = express.Router();
router.use(protectedRoutes);
protectedRoutes.use(checkJwt);

// Statistics routes - not scoped to company, handled inside the controller
protectedRoutes.use('/statistics', statisticsRoutes);

// Superadmin routes - not scoped to company, superadmin specific
protectedRoutes.use('/superadmin', superadminRoutes);

// Company routes
protectedRoutes.use('/companies', companiesRoutes);

// User routes - scoped to company
protectedRoutes.use('/companies/:companyId/users', usersRoutes);

// Package routes - scoped to company
protectedRoutes.use('/companies/:companyId/packages', packagesRoutes);

// Pre-alert routes - scoped to company
protectedRoutes.use('/companies/:companyId/prealerts', preAlertsRoutes);

// Invoice routes - scoped to company
protectedRoutes.use('/companies/:companyId/invoices', invoicesRoutes);

// Payment routes - scoped to company
protectedRoutes.use('/companies/:companyId/payments', paymentsRoutes);

// Company settings routes - scoped to company
protectedRoutes.use('/companies/:companyId/settings', companySettingsRoutes);

// Direct access to company settings (for supporting the frontend implementation)
protectedRoutes.use('/company-settings', companySettingsRoutes);

// Fees routes - scoped to company
protectedRoutes.use('/companies/:companyId/fees', feesRoutes);

// Duty fees routes - scoped to company
protectedRoutes.use('/companies/:companyId/duty-fees', dutyFeesRoutes);

// Billing routes - scoped to company
protectedRoutes.use('/companies/:companyId/billing', billingRoutes);

// Import routes - scoped to company
protectedRoutes.use('/companies/:companyId/import', importRoutes);

// Auto Import routes - scoped to company
protectedRoutes.use('/companies/:companyId/auto-import', autoImportRoutes);

// Admin routes - not scoped to company, admin specific
protectedRoutes.use('/admin', adminRoutes);

// Auto-import routes
router.get('/auto-import/status', checkJwt, (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Forward to controller
  const controller = new AutoImportController();
  return controller.getLatestImportStatus(req as AuthRequest, res, next);
});

export default router; 