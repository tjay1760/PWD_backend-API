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

  getAllAssessmentsByCounty,
  getPendingApprovals

  updateFormDataValidation

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
   (req, res, next) => {
    console.log(`User ${req.user?.id} accessing assessment status`);
    next();
  },
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

router.get(
  '/pending-approvals',
  authenticate,
  authorize(['medical_approver']),
  getPendingApprovals
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
  authorize(['medical_approver']), 
  validate(reviewAssessmentValidation), 
  auditLog('review_assessment'),
  reviewAssessment
);




// Update assessment form data during review
router.put(
  '/update-form/:assessmentId', 
  authenticate, 
  authorize(['medical_officer']), 
  validate(updateFormDataValidation), 
  auditLog('update_assessment_form'),
  updateAssessmentFormData
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