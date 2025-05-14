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

// Update shipping rates
router.put(
  '/shipping-rates',
  /*checkRole(['admin_l2']),*/
  companySettingsController.updateShippingRates
);

// Update handling fees
router.put(
  '/handling-fees',
  /*checkRole(['admin_l2']),*/
  companySettingsController.updateHandlingFees
);

// Update customs fees
router.put(
  '/customs-fees',
  /*checkRole(['admin_l2']),*/
  companySettingsController.updateCustomsFees
);

// Update tax rates
router.put(
  '/tax-rates',
  /*checkRole(['admin_l2']),*/
  companySettingsController.updateTaxRates
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

// Calculate shipping cost
router.post(
  '/calculate-shipping',
  /*checkRole(['admin_l1', 'admin_l2', 'customer']),*/
  companySettingsController.calculateShippingCost
);

export default router; 