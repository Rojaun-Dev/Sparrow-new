import express from 'express';
import { 
  getAllCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
  getCompanyStatistics
} from '../controllers/companies-controller';
import { CompanyInvitationsController } from '../controllers/company-invitations-controller';
import { PreAlertsController } from '../controllers/pre-alerts-controller';
import { checkJwt, checkRole } from '../middleware/auth';
// import { checkJwt, checkRole } from '../middleware/auth';

const router = express.Router();
const companyInvitationsController = new CompanyInvitationsController();
const preAlertsController = new PreAlertsController();

// Apply JWT authentication to all routes
// router.use(checkJwt); NOTE: enable this and checkRole when we have login and auth implemented fully

// Get all companies (super admin only)
router.get('/', /*checkRole('super_admin'),*/ getAllCompanies);

// Get a company by ID
router.get('/:id', /*checkRole(['admin_l2', 'super_admin']),*/ getCompanyById);

// Create a new company (super admin only)
router.post('/', /*checkRole('super_admin'),*/ createCompany);

// Update a company by ID
router.put('/:id', /*checkRole(['admin_l2', 'super_admin']),*/ updateCompany);

// Delete a company by ID (super admin only)
router.delete('/:id', /*checkRole('super_admin'),*/ deleteCompany);

// Get company statistics
router.get('/:id/statistics', /*checkRole(['admin_l2', 'super_admin']),*/ getCompanyStatistics);

// Company invitation routes (superadmin only)
router.post(
  '/invite',
  checkJwt,
  checkRole(['super_admin']),
  companyInvitationsController.sendInvitation.bind(companyInvitationsController)
);

// Public routes for company registration from invitation
router.get(
  '/verify-invitation/:token',
  companyInvitationsController.verifyInvitation.bind(companyInvitationsController)
);

router.post(
  '/register/:token',
  companyInvitationsController.registerFromInvitation.bind(companyInvitationsController)
);

// Get pre-alerts by package ID
router.get('/:companyId/packages/:packageId/prealerts', (req, res, next) => preAlertsController.getPreAlertsByPackageId(req as any, res, next));

// Get current company for authenticated customer
router.get('/me', /*checkRole(['customer']),*/ (req, res) => {
  const companyId = req.companyId;
  if (!companyId) {
    return res.status(401).json({ success: false, message: 'No companyId in request' });
  }
  return getCompanyById({ ...req, params: { id: companyId } }, res);
});

// Get current company for authenticated admin
router.get('/admin/me', /*checkRole(['admin_l1', 'admin_l2']),*/ (req, res) => {
  const companyId = req.companyId;
  if (!companyId) {
    return res.status(401).json({ success: false, message: 'No companyId in request' });
  }
  return getCompanyById({ ...req, params: { id: companyId } }, res);
});

export default router; 