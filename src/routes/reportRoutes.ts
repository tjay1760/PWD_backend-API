import express from 'express';
import { 
  getCountySummary,
  getSystemReport
} from '../controllers/reportController';
import { authenticate, authorize } from '../middleware/auth';
import { auditLog } from '../middleware/audit';
import { UserRole } from '../types/models';

const router = express.Router();

// Generate county summary report (for county director)
router.get(
  '/county-summary', 
  authenticate, 
  authorize(['county_director']), 
  auditLog('generate_county_report'),
  getCountySummary
);

// Generate system-wide report (for admin)
router.get(
  '/system', 
  authenticate, 
  authorize(['admin']), 
  auditLog('generate_system_report'),
  getSystemReport
);

export default router;