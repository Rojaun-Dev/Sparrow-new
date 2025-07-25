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
import { CompanyAssetsController } from '../controllers/company-assets-controller';
import { Request, Response, NextFunction } from 'express';
// import { checkJwt, checkRole } from '../middleware/auth';

const router = express.Router();
const companyInvitationsController = new CompanyInvitationsController();
const preAlertsController = new PreAlertsController();
const companyAssetsController = new CompanyAssetsController();

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

// Public routes for company registration from invitation moved to main router (index.ts)
// to avoid JWT authentication middleware

// Get pre-alerts by package ID
router.get('/:companyId/packages/:packageId/prealerts', (req, res, next) => preAlertsController.getPreAlertsByPackageId(req as any, res, next));

// Get current company for authenticated customer
router.get('/me', /*checkRole(['customer']),*/ (req: any, res) => {
  const companyId = req.companyId;
  if (!companyId) {
    return res.status(401).json({ success: false, message: 'No companyId in request' });
  }
  return getCompanyById({ ...req, params: { id: companyId } } as any, res);
});

// Get current company for authenticated admin
router.get('/admin/me', /*checkRole(['admin_l1', 'admin_l2']),*/ (req: any, res) => {
  const companyId = req.companyId;
  if (!companyId) {
    return res.status(401).json({ success: false, message: 'No companyId in request' });
  }
  return getCompanyById({ ...req, params: { id: companyId } } as any, res);
});

// Middleware to set req.companyId from params for asset routes
function setCompanyIdFromParams(req: Request, _: Response, next: NextFunction) {
  if ((req.params as any).companyId) {
    (req as any).companyId = req.params.companyId;
  }
  next();
}

// Company assets (branding) endpoints
router.get('/:companyId/assets', setCompanyIdFromParams, checkJwt, (req: Request, res: Response, next: NextFunction) => companyAssetsController.listAssets(req as any, res, next));
router.post('/:companyId/assets', setCompanyIdFromParams, checkJwt, checkRole('admin_l2'), (req: Request, res: Response, next: NextFunction) => companyAssetsController.createAsset(req as any, res, next));
router.put('/:companyId/assets/:id', setCompanyIdFromParams, checkJwt, checkRole('admin_l2'), (req: Request, res: Response, next: NextFunction) => companyAssetsController.updateAsset(req as any, res, next));
router.delete('/:companyId/assets/:id', setCompanyIdFromParams, checkJwt, checkRole('admin_l2'), (req: Request, res: Response, next: NextFunction) => companyAssetsController.deleteAsset(req as any, res, next));

export default router; 