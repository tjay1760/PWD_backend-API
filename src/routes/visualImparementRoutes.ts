import { Router } from "express";
import { createVisualImpairmentAssessment, getAllVisualImpairmentAssessments,getVisualImpairmentAssessmentById } from "../controllers/visualImparementReportController"; 

const router = Router();
// Route to create a new assessment
router.post('/', createVisualImpairmentAssessment);

// Route to get all assessments
router.get('/', getAllVisualImpairmentAssessments);

// Route to get a single assessment by ID
router.get('/:id', getVisualImpairmentAssessmentById);


export default router;