import { Schema, model, Document } from 'mongoose';

// 1. Define TypeScript Interfaces for nested objects and the main document
// Removed IPatientDetails and IAssessmentDetails interfaces as they are now top-level

interface IDistanceVisualAcuityCorrection {
  rightEye: string;
  leftEye: string;
  nearVisionTest: string;
}

interface IDistanceVisualAcuity {
  withCorrection: IDistanceVisualAcuityCorrection;
  withoutCorrection: IDistanceVisualAcuityCorrection;
}

// Updated IOphthalmicExaminationEye to match the exact keys from the payload
interface IOphthalmicExaminationEye {
  Presenteyeball: string;
  Cornea: string;
  Squint: string;
  AnteriorChamber: string; // This was empty in payload, assuming it can be sent
  Nystagmus: string;       // This was empty in payload, assuming it can be sent
  Iris: string;            // This was empty in payload, assuming it can be sent
  Tearing: string;         // This was empty in payload, assuming it can be sent
  Pupil: string;           // This was empty in payload, assuming it can be sent
  Lids: string;            // This was empty in payload, assuming it can be sent
  Conjunctiva: string;
  Lens: string;
}

interface IOphthalmicExamination {
  rightEye: IOphthalmicExaminationEye;
  leftEye: IOphthalmicExaminationEye;
}

interface ISpecializedTests {
  humphreysVisualField: string;
  colourVision: string;
  stereopsis: string;
}

interface IConclusion {
  categoryNormal: boolean;
  categoryMildImpairment: boolean;
  categoryModerateImpairment: boolean;
  categorySevereImpairment: boolean;
  categoryBlind: boolean;
  categoryNearVisionImpairment: boolean;
  causeOfVisionImpairment: string;
  disabilityPercentage: number; // Storing as number, assuming frontend sends "5" which can be parsed
  possibleIntervention: 'yes' | 'no' | '';
  recommendation: string;
}

// 2. Define the main TypeScript Interface for the document, reflecting the payload's top-level structure
export interface IVisualImpairmentAssessment extends Document {
  facilityName: string;
  assessmentDate: string;
  patientFullName: string;
  patientPhone: string;
  medicalHistory: string;
  ocularHistory: string;
  distanceVisualAcuity: IDistanceVisualAcuity;
  ophthalmicExamination: IOphthalmicExamination;
  specializedTests: ISpecializedTests;
  conclusion: IConclusion;
  disabilityType: 'temporary' | 'permanent' | '';
  createdAt?: Date;
  updatedAt?: Date;
}

// 3. Define the Mongoose Schema, precisely matching the payload
const VisualImpairmentAssessmentSchema: Schema = new Schema(
  {
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
  },
  { timestamps: true }
);

// 4. Create and export the Mongoose Model
export const VisualImpairmentAssessment = model<IVisualImpairmentAssessment>('VisualImpairmentAssessment', VisualImpairmentAssessmentSchema);