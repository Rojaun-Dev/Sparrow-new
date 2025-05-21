import express from 'express';
import { checkJwt, checkRole } from '../middleware/auth';
import { UsersController } from '../controllers/users-controller';
import { 
  getAllCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
  getCompanyStatistics
} from '../controllers/companies-controller';
import { AuditLogsController } from '../controllers/audit-logs-controller';
import { PackagesController } from '../controllers/packages-controller';
import { CompanyInvitationsController } from '../controllers/company-invitations-controller';

const router = express.Router();
const usersController = new UsersController();
const auditLogsController = new AuditLogsController();
const packagesController = new PackagesController();
const companyInvitationsController = new CompanyInvitationsController();

// Apply JWT authentication to all routes
router.use(checkJwt);

// Only super admins can access these routes
router.use(checkRole('super_admin'));

// User management routes
router.get('/users', usersController.getAllUsersAcrossCompanies);
router.post('/users', usersController.createAdminUser);
router.get('/users/:id', usersController.getUserById);
router.put('/users/:id', usersController.updateUser);
router.delete('/users/:id', usersController.deactivateUser);
router.post('/users/:id/reactivate', usersController.reactivateUser);
router.get('/users/:id/activity', auditLogsController.getUserActivity);

// Company management routes
router.get('/companies', getAllCompanies);
router.post('/companies', createCompany);
router.get('/companies/:id', getCompanyById);
router.put('/companies/:id', updateCompany);
router.delete('/companies/:id', deleteCompany);
router.get('/companies/:id/statistics', getCompanyStatistics);

// Company users routes
router.get('/companies/:id/users', usersController.getCompanyUsers);

// Company packages routes
router.get('/companies/:id/packages', packagesController.getCompanyPackages);

// Company invitations routes
router.get('/invitations', companyInvitationsController.listInvitations);
router.post('/invitations', companyInvitationsController.sendInvitation);
router.post('/invitations/:id/resend', companyInvitationsController.resendInvitation);
router.post('/invitations/:id/revoke', companyInvitationsController.revokeInvitation);

// Audit logs routes
router.get('/audit-logs', auditLogsController.getAllLogs);

// System statistics
router.get('/statistics', usersController.getSystemStatistics);

export default router; 