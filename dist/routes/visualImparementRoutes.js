"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const visualImparementReportController_1 = require("../controllers/visualImparementReportController");
const router = (0, express_1.Router)();
// Route to create a new assessment
router.post('/', visualImparementReportController_1.createVisualImpairmentAssessment);
// Route to get all assessments
router.get('/', visualImparementReportController_1.getAllVisualImpairmentAssessments);
// Route to get a single assessment by ID
router.get('/:id', visualImparementReportController_1.getVisualImpairmentAssessmentById);
exports.default = router;
