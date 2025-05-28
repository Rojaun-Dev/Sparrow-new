import express from 'express';
import { checkJwt, checkRole } from '../middleware/auth';
import { UsersController } from '../controllers/users-controller';
import { PackagesController } from '../controllers/packages-controller';

const router = express.Router();
const usersController = new UsersController();
const packagesController = new PackagesController();

// Apply JWT authentication to all routes
router.use(checkJwt);

// Only admins (and optionally super_admins) can access these routes
router.use(checkRole(['admin_l1', 'admin_l2']));

// Company users routes
router.get('/companies/:id/users', usersController.getCompanyUsers);
// Deactivate and reactivate user (soft delete/reactivate)
router.delete('/users/:id', usersController.deactivateUser);
router.post('/users/:id/reactivate', usersController.reactivateUser);
// (Add more endpoints as needed, e.g., get user by id, update user, deactivate user, etc.)

// Company packages routes
router.get('/companies/:id/packages', packagesController.getCompanyPackages);

export default router; 