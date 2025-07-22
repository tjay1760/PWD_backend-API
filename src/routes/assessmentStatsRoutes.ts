import express from 'express';
import { 
  getMyAssessmentStats,
  getUserAssessmentStats,
  updateAssessmentStats,
  resetAssessmentStats,
  getTopPerformers
} from '../controllers/assessmentStatsController';
import { authenticate, authorize } from '../middleware/auth';
import { auditLog } from '../middleware/audit';
import { body } from 'express-validator';
import { validate } from '../middleware/validation';

const router = express.Router();

// Validation for updating stats
const updateStatsValidation = [
  body('reviewed_count').optional().isInt({ min: 0 }).withMessage('Reviewed count must be a non-negative integer'),
  body('completed_count').optional().isInt({ min: 0 }).withMessage('Completed count must be a non-negative integer')
];

// Get current user's assessment statistics
router.get(
  '/my-stats', 
  authenticate, 
  authorize(['medical_officer', 'county_director']),
  getMyAssessmentStats
);

// Get assessment statistics for a specific user (admin/director only)
router.get(
  '/user-stats/:userId', 
  authenticate, 
  authorize(['admin', 'county_director']),
  getUserAssessmentStats
);

// Update assessment statistics manually (admin only)
router.put(
  '/update-stats/:userId', 
  authenticate, 
  authorize(['admin']), 
  validate(updateStatsValidation),
  auditLog('update_assessment_stats'),
  updateAssessmentStats
);

// Reset assessment statistics (admin only)
router.post(
  '/reset-stats/:userId', 
  authenticate, 
  authorize(['admin']), 
  auditLog('reset_assessment_stats'),
  resetAssessmentStats
);

// Get top performers (admin/director only)
router.get(
  '/top-performers', 
  authenticate, 
  authorize(['admin', 'county_director']),
  getTopPerformers
);

export default router;