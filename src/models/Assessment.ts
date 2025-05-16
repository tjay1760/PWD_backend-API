import mongoose, { Document, Schema } from 'mongoose';
import { AssessmentStatus, FormType, IMedicalOfficerEntry, IDirectorReview } from '../types/models';

export interface IAssessment extends Document {
  pwd_id: mongoose.Types.ObjectId;
  requested_by: mongoose.Types.ObjectId;
  status: AssessmentStatus;
  form_type: FormType;
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
  status: { 
    type: String, 
    required: true,
    enum: ['not_booked', 'pending_review', 'mo_review', 'director_review', 'approved', 'rejected'],
    default: 'not_booked'
  },
  form_type: { 
    type: String, 
    required: true,
    enum: ['MOH-276A', 'MOH-276B', 'MOH-276C', 'MOH-276D', 'MOH-276E', 'MOH-276F', 'MOH-276G']
  },
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
assessmentSchema.index({ 'medical_officer_entries.officer_id': 1 });
assessmentSchema.index({ 'director_review.director_id': 1 });

export default mongoose.model<IAssessment>('Assessment', assessmentSchema);