"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVisualImpairmentAssessmentById = exports.getAllVisualImpairmentAssessments = exports.createVisualImpairmentAssessment = void 0;
const VisualImparementReport_1 = require("../models/VisualImparementReport");
// Create a new Visual Impairment Assessment
const createVisualImpairmentAssessment = async (req, res) => {
    try {
        const assessmentData = req.body; // Type assertion for incoming data
        const newAssessment = new VisualImparementReport_1.VisualImpairmentAssessment(assessmentData);
        const savedAssessment = await newAssessment.save();
        res.status(201).json(savedAssessment);
    }
    catch (error) {
        console.error('Error creating visual impairment assessment:', error);
        if (error.name === 'ValidationError') {
            // Mongoose validation error
            res.status(400).json({ message: 'Validation Error', details: error.errors });
        }
        else {
            res.status(500).json({ message: 'Failed to create visual impairment assessment', error: error.message });
        }
    }
};
exports.createVisualImpairmentAssessment = createVisualImpairmentAssessment;
// Get all Visual Impairment Assessments
const getAllVisualImpairmentAssessments = async (req, res) => {
    try {
        const assessments = await VisualImparementReport_1.VisualImpairmentAssessment.find();
        res.status(200).json(assessments);
    }
    catch (error) {
        console.error('Error fetching visual impairment assessments:', error);
        res.status(500).json({ message: 'Failed to retrieve visual impairment assessments', error: error.message });
    }
};
exports.getAllVisualImpairmentAssessments = getAllVisualImpairmentAssessments;
// Get a single Visual Impairment Assessment by ID
const getVisualImpairmentAssessmentById = async (req, res) => {
    try {
        const { id } = req.params;
        const assessment = await VisualImparementReport_1.VisualImpairmentAssessment.findById(id);
        if (!assessment) {
            res.status(404).json({ message: 'Visual impairment assessment not found' });
            return;
        }
        res.status(200).json(assessment);
    }
    catch (error) {
        console.error('Error fetching visual impairment assessment by ID:', error);
        res.status(500).json({ message: 'Failed to retrieve visual impairment assessment', error: error.message });
    }
};
exports.getVisualImpairmentAssessmentById = getVisualImpairmentAssessmentById;
