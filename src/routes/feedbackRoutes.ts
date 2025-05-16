import express from 'express';
import { 
  submitFeedback,
  getAllFeedback,
  submitFeedbackValidation
} from '../controllers/feedbackController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { UserRole } from '../types/models';

const router = express.Router();

// Submit feedback
router.post(
  '/', 
  validate(submitFeedbackValidation), 
  submitFeedback
);

// Get all feedback (admin only)
router.get(
  '/', 
  authenticate, 
  authorize(['admin']),
  getAllFeedback
);

export default router;