import express from 'express';
import { 
  bookAssessment,
  getAssessmentStatus,
  getAssignedAssessments,
  submitAssessment,
  reviewAssessment,
  finalizeAssessment,
  getAssessmentReport,
  getCountyAssessments,
  bookAssessmentValidation,
  submitAssessmentValidation,
  reviewAssessmentValidation,
  getAllAssessmentsByCounty
} from '../controllers/assessmentController';
import { authenticate, authorize, restrictToCounty } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { auditLog } from '../middleware/audit';
import { UserRole } from '../types/models';

const router = express.Router();

// Book a medical assessment
router.post(
  '/book', 
  authenticate, 
  authorize(['pwd', 'guardian']), 
  validate(bookAssessmentValidation), 
  auditLog('book_assessment'),
  bookAssessment
);

// View assessment status for a PWD
router.get(
  '/status/:pwdId', 
  authenticate, 
  restrictToCounty,
  getAssessmentStatus
);

// View assessments assigned to a medical officer
router.get(
  '/assigned', 
  authenticate, 
  authorize(['medical_officer', 'county_director']),
  getAssignedAssessments
);
// Get all assessments by county (for county director)
router.get(
  '/county',
  authenticate,
  authorize(['county_director']),
  getAllAssessmentsByCounty
);

// Submit assessment by medical officer
router.post(
  '/submit/:assessmentId', 
  authenticate, 
  authorize(['medical_officer']), 
  validate(submitAssessmentValidation), 
  auditLog('submit_assessment'),
  submitAssessment
);

// Review assessment by medical officer
router.put(
  '/review/:assessmentId', 
  authenticate, 
  authorize(['medical_officer']), 
  validate(reviewAssessmentValidation), 
  auditLog('review_assessment'),
  reviewAssessment
);

// Finalize assessment by county director
router.put(
  '/finalize/:assessmentId', 
  authenticate, 
  authorize(['county_director']), 
  restrictToCounty,
  auditLog('finalize_assessment'),
  finalizeAssessment
);

// Get assessment report
router.get(
  '/report/:assessmentId', 
  authenticate, 
  getAssessmentReport
);

// Get county assessments (for county director)
router.get(
  '/county', 
  authenticate, 
  authorize(['county_director']),
  getCountyAssessments
);

export default router;