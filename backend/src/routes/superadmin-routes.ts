import express from 'express';
import { checkJwt, checkRole } from '../middleware/auth';
import { UsersController } from '../controllers/users-controller';

const router = express.Router();
const usersController = new UsersController();

// Apply JWT authentication to all routes
router.use(checkJwt);

// Only super admins can access these routes
router.use(checkRole('super_admin'));

// Get all users across all companies
router.get('/users', usersController.getAllUsersAcrossCompanies);

// Create a new admin user for any company
router.post('/users', usersController.createAdminUser);

// Get system-wide statistics
router.get('/statistics', usersController.getSystemStatistics);

export default router; 