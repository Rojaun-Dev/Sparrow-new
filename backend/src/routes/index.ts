import express from 'express';
import companiesRoutes from './companies-routes';
import usersRoutes from './users-routes';
import packagesRoutes from './packages-routes';
import preAlertsRoutes from './pre-alerts-routes';
import invoicesRoutes from './invoices-routes';
import paymentsRoutes from './payments-routes';
import companySettingsRoutes from './company-settings-routes';
import feesRoutes from './fees-routes';
import billingRoutes from './billing-routes';
import authRoutes from './auth-routes';
import statisticsRoutes from './statistics-routes';
import superadminRoutes from './superadmin-routes';
import adminRoutes from './admin-routes';
import { extractCompanyId } from '../middleware/auth';

const router = express.Router();

// Apply company ID extraction middleware to all routes
router.use(extractCompanyId);

// Auth routes - not scoped to company
router.use('/auth', authRoutes);

// Statistics routes - not scoped to company, handled inside the controller
router.use('/statistics', statisticsRoutes);

// Superadmin routes - not scoped to company, superadmin specific
router.use('/superadmin', superadminRoutes);

// Company routes
router.use('/companies', companiesRoutes);

// User routes - scoped to company
router.use('/companies/:companyId/users', usersRoutes);

// Package routes - scoped to company
router.use('/companies/:companyId/packages', packagesRoutes);

// Pre-alert routes - scoped to company
router.use('/companies/:companyId/prealerts', preAlertsRoutes);

// Invoice routes - scoped to company
router.use('/companies/:companyId/invoices', invoicesRoutes);

// Payment routes - scoped to company
router.use('/companies/:companyId/payments', paymentsRoutes);

// Company settings routes - scoped to company
router.use('/companies/:companyId/settings', companySettingsRoutes);

// Direct access to company settings (for supporting the frontend implementation)
router.use('/company-settings', companySettingsRoutes);

// Fees routes - scoped to company
router.use('/companies/:companyId/fees', feesRoutes);

// Billing routes - scoped to company
router.use('/companies/:companyId/billing', billingRoutes);

// Admin routes - not scoped to company, admin specific
router.use('/admin', adminRoutes);

// Additional routes will be added here as they are implemented:
// router.use('/companies/:companyId/settings', settingsRoutes);

export default router; 