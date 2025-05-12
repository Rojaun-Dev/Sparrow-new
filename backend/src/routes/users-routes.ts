import express from 'express';
import { UsersController } from '../controllers/users-controller';
// import { checkJwt, checkRole } from '../middleware/auth';

const router = express.Router({ mergeParams: true }); // mergeParams allows access to companyId from parent router
const controller = new UsersController();

// Apply JWT authentication to all routes
// router.use(checkJwt); NOTE: enable this and checkRole when we have login and auth implemented fully

// Get all users for a company (Admin L1+)
router.get('/', /*checkRole(['admin_l1', 'admin_l2']),*/ controller.getAllUsers);

// Get users by role (Admin L1+)
router.get('/role/:role', /*checkRole(['admin_l1', 'admin_l2']),*/ controller.getUsersByRole);

// Get a user by ID 
// Note: Customers can only access their own profile, controlled within service layer
router.get('/:id', controller.getUserById);

// Create a new user (Admin L2 only)
router.post('/', /*checkRole('admin_l2'),*/ controller.createUser);

// Update a user
// Note: Customers can only update their own profile, controlled within service layer
router.put('/:id', controller.updateUser);

// Deactivate a user (Admin L2 only)
router.delete('/:id', /*checkRole('admin_l2'),*/ controller.deactivateUser);

// Reactivate a user (Admin L2 only)
router.post('/:id/reactivate', /*checkRole('admin_l2'),*/ controller.reactivateUser);

export default router; 