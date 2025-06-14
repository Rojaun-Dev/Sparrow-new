import express from 'express';
import { CompanySettingsController } from '../controllers/company-settings-controller';
// import { checkJwt, checkRole } from '../middleware/auth';

const router = express.Router({ mergeParams: true });
const companySettingsController = new CompanySettingsController();

// Apply JWT authentication middleware to all settings routes
// router.use(checkJwt); NOTE: enable this and checkRole when we have login and auth implemented fully

// Get all company settings
router.get(
  '/',
  /*checkRole(['admin_l1', 'admin_l2']),*/
  companySettingsController.getCompanySettings
);

// Get pickup locations
router.get(
  '/pickup-locations',
  /*checkRole(['admin_l1', 'admin_l2', 'customer']),*/
  companySettingsController.getPickupLocations
);

// Update all company settings
router.put(
  '/',
  /*checkRole(['admin_l2']),*/ // Only highest level admins can update all settings at once
  companySettingsController.updateCompanySettings
);

// Get payment settings
router.get(
  '/payment',
  /*checkRole(['admin_l1', 'admin_l2', 'customer']),*/
  companySettingsController.getPaymentSettings
);

// Update payment settings
router.put(
  '/payment',
  /*checkRole(['admin_l2']),*/
  companySettingsController.updatePaymentSettings
);

// Update notification settings
router.put(
  '/notifications',
  /*checkRole(['admin_l2']),*/
  companySettingsController.updateNotificationSettings
);

// Update theme settings
router.put(
  '/theme',
  /*checkRole(['admin_l2']),*/
  companySettingsController.updateThemeSettings
);

export default router; 