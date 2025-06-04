import express from 'express';
import { PackagesController } from '../controllers/packages-controller';
// import { checkJwt, checkRole } from '../middleware/auth';

const router = express.Router({ mergeParams: true }); // mergeParams allows access to companyId from parent router
const controller = new PackagesController();

// Apply JWT authentication to all routes
// router.use(checkJwt); NOTE: enable this and checkRole when we have login and auth implemented fully

// Search packages with filtering (accessible to all authenticated users)
router.get('/search', controller.searchPackages);

// Get packages by status (Admin L1+)
router.get('/status/:status', /*checkRole(['admin_l1', 'admin_l2']),*/ controller.getPackagesByStatus);

// Get packages by user ID (access control handled at service level)
router.get('/user/:userId', controller.getPackagesByUserId);

// Get all packages (Admin L1+)
router.get('/', /*checkRole(['admin_l1', 'admin_l2']),*/ controller.getAllPackages);

// Get packages as CSV
router.get('/export-csv', controller.exportPackagesCsv);

// Get package by ID (access control handled at service level for customers)
router.get('/:id', controller.getPackageById);

// Create new package (Admin L1+)
router.post('/', /*checkRole(['admin_l1', 'admin_l2']),*/ controller.createPackage);

// Update package (Admin L1+)
router.put('/:id', /*checkRole(['admin_l1', 'admin_l2']),*/ controller.updatePackage);

// Delete package (Admin L2 only)
router.delete('/:id', /*checkRole('admin_l2'),*/ controller.deletePackage);

// Get packages by invoice ID
router.get(
  '/by-invoice/:invoiceId',
  // authMiddleware,
  // validateCompanyAccess,
  controller.getPackagesByInvoiceId
);

// Update package status (Admin L1+)
router.put('/:id/status', /*checkRole(['admin_l1', 'admin_l2']),*/ controller.updatePackageStatus);

// Match a pre-alert to a package (Admin L1+)
router.post('/:packageId/match-prealert', /*checkRole(['admin_l1', 'admin_l2']),*/ controller.matchPreAlertToPackage);

// Get unbilled packages for a user
router.get('/users/:userId/unbilled-packages', controller.getUnbilledPackagesByUser);

export default router; 