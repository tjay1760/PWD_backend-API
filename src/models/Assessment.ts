// src/models/Assessment.ts (Updated)
import mongoose, { Document, Schema } from 'mongoose';
import { AssessmentStatus, IMedicalOfficerEntry, IDirectorReview } from '../types/models'; // Removed FormType import

export interface IAssessment extends Document {
  pwd_id: mongoose.Types.ObjectId;
  requested_by: mongoose.Types.ObjectId;
  county: string;
  hospital: string;
  assessment_date: Date;
  assessment_category: string; // NEW: To store "Initial Evaluation", "Follow-up", etc.
  assigned_medical_officer?: mongoose.Types.ObjectId;
  status: AssessmentStatus;
  medical_officer_entries: IMedicalOfficerEntry[];
  director_review?: IDirectorReview;
  created_at: Date;
  updated_at: Date;
}

const assessmentSchema = new Schema<IAssessment>({
  pwd_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requested_by: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  county: {
    type: String,
    required: true
  },
  hospital: {
    type: String,
    required: true
  },
  assessment_date: {
    type: Date,
    required: true
  },
  assessment_category: { // NEW SCHEMA FIELD
    type: String,
    required: true // This will store "Initial Evaluation", "Follow-up", etc.
  },
  assigned_medical_officer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  status: {
    type: String,
    required: true,
    enum: ['not_booked', 'pending_review', 'mo_review', 'director_review', 'approved', 'rejected'],
    default: 'pending_review'
  },
  // 'form_type' is now removed from the model entirely as per the errors,
  // with 'assessment_category' serving the purpose of the booking's assessment type.
  medical_officer_entries: [{
    officer_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    form_data: {
      type: Schema.Types.Mixed,
      required: true
    },
    uploaded_reports: [{ type: String }],
    comments: { type: String },
    digital_signature: { type: Boolean, default: false },
    submitted_at: { type: Date, default: Date.now },
    reviewed: { type: Boolean, default: false },
    review_comments: { type: String },
    approved: { type: Boolean }
  }],
  director_review: {
    director_id: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    comments: { type: String },
    approved: { type: Boolean },
    signed_at: { type: Date }
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

// Indexes for performance
assessmentSchema.index({ pwd_id: 1 });
assessmentSchema.index({ status: 1 });
assessmentSchema.index({ county: 1 });
assessmentSchema.index({ hospital: 1 });
assessmentSchema.index({ assessment_date: 1 });
assessmentSchema.index({ 'medical_officer_entries.officer_id': 1 });
assessmentSchema.index({ 'director_review.director_id': 1 });

export default mongoose.model<IAssessment>('Assessment', assessmentSchema);