import express from 'express';
import { 
  uploadFile,
  getFile,
  deleteFile,
  getRelatedFiles
} from '../controllers/uploadController';
import { authenticate } from '../middleware/auth';
import { auditLog } from '../middleware/audit';

const router = express.Router();

// Upload a file
router.post(
  '/upload', 
  authenticate, 
  auditLog('file_upload'),
  uploadFile
);

// Get file by ID
router.get(
  '/:fileId', 
  authenticate, 
  getFile
);

// Delete file
router.delete(
  '/:fileId', 
  authenticate, 
  auditLog('file_delete'),
  deleteFile
);

// Get files related to an entity
router.get(
  '/related/:type/:id', 
  authenticate, 
  getRelatedFiles
);

export default router;