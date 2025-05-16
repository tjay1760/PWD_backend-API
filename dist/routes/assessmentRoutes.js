"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const assessmentController_1 = require("../controllers/assessmentController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const audit_1 = require("../middleware/audit");
const router = express_1.default.Router();
// Book a medical assessment
router.post('/book', auth_1.authenticate, (0, auth_1.authorize)(['pwd', 'guardian']), (0, validation_1.validate)(assessmentController_1.bookAssessmentValidation), (0, audit_1.auditLog)('book_assessment'), assessmentController_1.bookAssessment);
// View assessment status for a PWD
router.get('/status/:pwdId', auth_1.authenticate, auth_1.restrictToCounty, assessmentController_1.getAssessmentStatus);
// View assessments assigned to a medical officer
router.get('/assigned', auth_1.authenticate, (0, auth_1.authorize)(['medical_officer']), assessmentController_1.getAssignedAssessments);
// Submit assessment by medical officer
router.post('/submit/:assessmentId', auth_1.authenticate, (0, auth_1.authorize)(['medical_officer']), (0, validation_1.validate)(assessmentController_1.submitAssessmentValidation), (0, audit_1.auditLog)('submit_assessment'), assessmentController_1.submitAssessment);
// Review assessment by medical officer
router.put('/review/:assessmentId', auth_1.authenticate, (0, auth_1.authorize)(['medical_officer']), (0, validation_1.validate)(assessmentController_1.reviewAssessmentValidation), (0, audit_1.auditLog)('review_assessment'), assessmentController_1.reviewAssessment);
// Finalize assessment by county director
router.put('/finalize/:assessmentId', auth_1.authenticate, (0, auth_1.authorize)(['county_director']), auth_1.restrictToCounty, (0, audit_1.auditLog)('finalize_assessment'), assessmentController_1.finalizeAssessment);
// Get assessment report
router.get('/report/:assessmentId', auth_1.authenticate, assessmentController_1.getAssessmentReport);
// Get county assessments (for county director)
router.get('/county', auth_1.authenticate, (0, auth_1.authorize)(['county_director']), assessmentController_1.getCountyAssessments);
exports.default = router;
