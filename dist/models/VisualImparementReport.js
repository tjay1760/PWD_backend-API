"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VisualImpairmentAssessment = void 0;
const mongoose_1 = require("mongoose");
// 3. Define the Mongoose Schema, precisely matching the payload
const VisualImpairmentAssessmentSchema = new mongoose_1.Schema({
    // Flattened patient and assessment details
    facilityName: { type: String, required: true },
    assessmentDate: { type: String, required: true }, // Store as string
    patientFullName: { type: String, required: true },
    patientPhone: { type: String, required: true },
    medicalHistory: { type: String, default: '' },
    ocularHistory: { type: String, default: '' },
    distanceVisualAcuity: {
        withCorrection: {
            rightEye: { type: String, default: '' },
            leftEye: { type: String, default: '' },
            nearVisionTest: { type: String, default: '' },
        },
        withoutCorrection: {
            rightEye: { type: String, default: '' },
            leftEye: { type: String, default: '' },
            nearVisionTest: { type: String, default: '' },
        },
    },
    // Updated ophthalmicExamination to match exact keys from payload
    ophthalmicExamination: {
        rightEye: {
            Presenteyeball: { type: String, default: '' },
            Cornea: { type: String, default: '' },
            Squint: { type: String, default: '' },
            AnteriorChamber: { type: String, default: '' },
            Nystagmus: { type: String, default: '' },
            Iris: { type: String, default: '' },
            Tearing: { type: String, default: '' },
            Pupil: { type: String, default: '' },
            Lids: { type: String, default: '' },
            Conjunctiva: { type: String, default: '' },
            Lens: { type: String, default: '' },
        },
        leftEye: {
            Presenteyeball: { type: String, default: '' },
            Cornea: { type: String, default: '' },
            Squint: { type: String, default: '' },
            AnteriorChamber: { type: String, default: '' },
            Nystagmus: { type: String, default: '' },
            Iris: { type: String, default: '' },
            Tearing: { type: String, default: '' },
            Pupil: { type: String, default: '' },
            Lids: { type: String, default: '' },
            Conjunctiva: { type: String, default: '' },
            Lens: { type: String, default: '' },
        },
    },
    specializedTests: {
        humphreysVisualField: { type: String, default: '' },
        colourVision: { type: String, default: '' },
        stereopsis: { type: String, default: '' },
    },
    conclusion: {
        categoryNormal: { type: Boolean, default: false },
        categoryMildImpairment: { type: Boolean, default: false },
        categoryModerateImpairment: { type: Boolean, default: false },
        categorySevereImpairment: { type: Boolean, default: false },
        categoryBlind: { type: Boolean, default: false },
        categoryNearVisionImpairment: { type: Boolean, default: false },
        causeOfVisionImpairment: { type: String, default: '' },
        disabilityPercentage: { type: Number, min: 0, max: 100, default: 0 },
        possibleIntervention: { type: String, enum: ['yes', 'no', ''], default: '' },
        recommendation: { type: String, default: '' },
    },
    disabilityType: { type: String, enum: ['temporary', 'permanent', ''], default: '' },
}, { timestamps: true });
// 4. Create and export the Mongoose Model
exports.VisualImpairmentAssessment = (0, mongoose_1.model)('VisualImpairmentAssessment', VisualImpairmentAssessmentSchema);
