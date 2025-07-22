import express from 'express';
import { DutyFeesController } from '../controllers/duty-fees-controller';
// import { checkJwt, checkRole } from '../middleware/auth';

const router = express.Router({ mergeParams: true }); 
const controller = new DutyFeesController();

// Apply JWT authentication to all routes
// router.use(checkJwt); NOTE: enable this and checkRole when we have login and auth implemented fully

// Get all duty fees for the company (Admin L1+)
router.get('/', /*checkRole(['admin_l1', 'admin_l2']),*/ controller.getAllDutyFees);

// Get duty fees for a specific package (Admin L1+)
router.get('/package/:packageId', /*checkRole(['admin_l1', 'admin_l2']),*/ controller.getDutyFeesByPackageId);

// Get duty fees grouped by currency for a specific package (Admin L1+)
router.get('/package/:packageId/grouped', /*checkRole(['admin_l1', 'admin_l2']),*/ controller.getPackageFeesGroupedByCurrency);

// Get total duty fees for a specific package in a currency (Admin L1+)
router.get('/package/:packageId/total', /*checkRole(['admin_l1', 'admin_l2']),*/ controller.getPackageFeeTotal);

// Create a new duty fee (Admin L1+)
router.post('/', /*checkRole(['admin_l1', 'admin_l2']),*/ controller.createDutyFee);

// Get specific duty fee by ID (Admin L1+)
router.get('/:id', /*checkRole(['admin_l1', 'admin_l2']),*/ controller.getDutyFeeById);

// Update a duty fee (Admin L1+)
router.put('/:id', /*checkRole(['admin_l1', 'admin_l2']),*/ controller.updateDutyFee);

// Delete a duty fee (Admin L1+)
router.delete('/:id', /*checkRole(['admin_l1', 'admin_l2']),*/ controller.deleteDutyFee);

export { router as dutyFeesRoutes };