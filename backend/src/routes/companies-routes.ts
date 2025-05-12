import express from 'express';
import { CompaniesController } from '../controllers/companies-controller';
// import { checkJwt, checkRole } from '../middleware/auth';

const router = express.Router();
const controller = new CompaniesController();

// Apply JWT authentication to all routes
// router.use(checkJwt); NOTE: enable this and checkRole when we have login and auth implemented fully

// Get all companies (super admin only)
router.get('/', /*checkRole('super_admin'),*/ controller.getAllCompanies);

// Get a company by ID
router.get('/:id', /*checkRole(['admin_l2', 'super_admin']),*/ controller.getCompanyById);

// Create a new company (super admin only)
router.post('/', /*checkRole('super_admin'),*/ controller.createCompany);

// Update a company by ID
router.put('/:id', /*checkRole(['admin_l2', 'super_admin']),*/ controller.updateCompany);

// Delete a company by ID (super admin only)
router.delete('/:id', /*checkRole('super_admin'),*/  controller.deleteCompany);

export default router; 