import express from 'express';
import { getCustomerStatistics, getAdminStatistics, getSuperAdminStatistics } from '../controllers/statistics-controller';
import { checkJwt, checkRole } from '../middleware/auth';

const router = express.Router();

/**
 * Routes for statistics
 */

// Get customer statistics
router.get(
  '/customer',
  checkJwt,
  checkRole(['customer']),
  getCustomerStatistics
);

// Get admin statistics
router.get(
  '/admin',
  checkJwt,
  checkRole(['admin_l1', 'admin_l2']),
  getAdminStatistics
);

// Get super admin statistics
router.get(
  '/superadmin',
  checkJwt,
  checkRole(['super_admin']),
  getSuperAdminStatistics
);

// Get customer statistics for a specific user (admin only)
router.get(
  '/customer/:userId',
  checkJwt,
  checkRole(['admin_l1', 'admin_l2']),
  (req, res, next) => {
    (req as any).userId = req.params.userId;
    next();
  },
  getCustomerStatistics
);

export default router; 