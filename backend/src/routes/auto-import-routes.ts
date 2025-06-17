import express from 'express';
import { AutoImportController } from '../controllers/auto-import-controller';

const router = express.Router({ mergeParams: true });
const autoImportController = new AutoImportController();

// Start Magaya auto import
router.post('/magaya', autoImportController.startMagayaImport);

// Get import status by ID
router.get('/:id', autoImportController.getImportStatus);

// Get latest import status
router.get('/status/latest', autoImportController.getLatestImportStatus);

// Update cron job settings
router.put('/cron-settings', autoImportController.updateCronSettings);

export default router; 