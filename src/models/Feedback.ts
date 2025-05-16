import mongoose, { Document, Schema } from 'mongoose';

export interface IFeedback extends Document {
  user_id?: mongoose.Types.ObjectId;
  content: string;
  created_at: Date;
}

const feedbackSchema = new Schema<IFeedback>({
  user_id: { 
    type: Schema.Types.ObjectId, 
    ref: 'User' 
  },
  content: { 
    type: String, 
    required: true 
  },
  created_at: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: { 
    createdAt: 'created_at',
    updatedAt: false
  }
});

// Index for performance
feedbackSchema.index({ user_id: 1 });
feedbackSchema.index({ created_at: -1 });

export default mongoose.model<IFeedback>('Feedback', feedbackSchema);