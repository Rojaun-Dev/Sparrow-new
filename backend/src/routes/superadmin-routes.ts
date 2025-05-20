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

const router = express.Router();
const usersController = new UsersController();
const auditLogsController = new AuditLogsController();

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

// Audit logs routes
router.get('/audit-logs', auditLogsController.getAllLogs);

// System statistics
router.get('/statistics', usersController.getSystemStatistics);

export default router; 