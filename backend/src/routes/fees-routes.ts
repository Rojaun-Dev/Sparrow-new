import { Router } from 'express';
import { FeesController } from '../controllers/fees-controller';
import { checkJwt, checkRole } from '../middleware/auth';

const router = Router();
const controller = new FeesController();

/**
 * @route   GET /api/companies/:companyId/fees
 * @desc    Get all fees for a company
 * @access  Private (Admin L1, Admin L2)
 */
router.get(
  '/',
  [checkJwt, checkRole(['admin_l1', 'admin_l2'])],
  controller.getAll.bind(controller)
);

/**
 * @route   GET /api/companies/:companyId/fees/active
 * @desc    Get all active fees for a company
 * @access  Private (Admin L1, Admin L2)
 */
router.get(
  '/active',
  [checkJwt, checkRole(['admin_l1', 'admin_l2'])],
  controller.getActive.bind(controller)
);

/**
 * @route   GET /api/companies/:companyId/fees/type/:type
 * @desc    Get fees by type
 * @access  Private (Admin L1, Admin L2)
 */
router.get(
  '/type/:type',
  [checkJwt, checkRole(['admin_l1', 'admin_l2'])],
  controller.getByType.bind(controller)
);

/**
 * @route   GET /api/companies/:companyId/fees/:id
 * @desc    Get fee by ID
 * @access  Private (Admin L1, Admin L2)
 */
router.get(
  '/:id',
  [checkJwt, checkRole(['admin_l1', 'admin_l2'])],
  controller.getById.bind(controller)
);

/**
 * @route   POST /api/companies/:companyId/fees
 * @desc    Create a new fee
 * @access  Private (Admin L2 only)
 */
router.post(
  '/',
  [checkJwt, checkRole(['admin_l2'])],
  controller.create.bind(controller)
);

/**
 * @route   PUT /api/companies/:companyId/fees/:id
 * @desc    Update a fee
 * @access  Private (Admin L2 only)
 */
router.put(
  '/:id',
  [checkJwt, checkRole(['admin_l2'])],
  controller.update.bind(controller)
);

/**
 * @route   PATCH /api/companies/:companyId/fees/:id/deactivate
 * @desc    Deactivate a fee
 * @access  Private (Admin L2 only)
 */
router.patch(
  '/:id/deactivate',
  [checkJwt, checkRole(['admin_l2'])],
  controller.deactivate.bind(controller)
);

/**
 * @route   PATCH /api/companies/:companyId/fees/:id/activate
 * @desc    Activate a fee
 * @access  Private (Admin L2 only)
 */
router.patch(
  '/:id/activate',
  [checkJwt, checkRole(['admin_l2'])],
  controller.activate.bind(controller)
);

/**
 * @route   DELETE /api/companies/:companyId/fees/:id
 * @desc    Delete a fee
 * @access  Private (Admin L2 only)
 */
router.delete(
  '/:id',
  [checkJwt, checkRole(['admin_l2'])],
  controller.delete.bind(controller)
);

export default router; 