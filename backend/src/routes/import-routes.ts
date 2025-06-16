import { Router } from 'express';
import { ImportController } from '../controllers/import-controller';
import { checkJwt } from '../middleware/auth';

const router = Router();
const importController = new ImportController();

// All routes require authentication
router.use(checkJwt);

// Import packages from CSV content in request body (with optional user assignment)
router.post('/users/:userId/packages/import', importController.importPackages as any);

// Import packages from CSV content without user assignment
router.post('/packages/import', importController.importPackages as any);

// Import packages from uploaded file (with optional user assignment)
router.post('/users/:userId/packages/import/file', importController.importPackagesFromFile as any);

// Import packages from uploaded file without user assignment
router.post('/packages/import/file', importController.importPackagesFromFile as any);

export default router; 