import mongoose, { Document, Schema } from 'mongoose';
import { IUploadRelated } from '../types/models';

export interface IUpload extends Document {
  uploader_id: mongoose.Types.ObjectId;
  file_path: string;
  file_type: string;
  related_to: IUploadRelated;
  created_at: Date;
}

const uploadSchema = new Schema<IUpload>({
  uploader_id: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  file_path: { 
    type: String, 
    required: true 
  },
  file_type: { 
    type: String, 
    required: true 
  },
  related_to: {
    type: { 
      type: String, 
      required: true,
      enum: ['assessment', 'form', 'other']
    },
    id: { 
      type: Schema.Types.ObjectId, 
      required: true,
      refPath: 'related_to.type'
    }
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

// Indexes for performance
uploadSchema.index({ uploader_id: 1 });
uploadSchema.index({ 'related_to.type': 1, 'related_to.id': 1 });

export default mongoose.model<IUpload>('Upload', uploadSchema);