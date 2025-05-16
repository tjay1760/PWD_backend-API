import mongoose, { Document, Schema } from 'mongoose';
import { TokenType } from '../types/models';

export interface IAuthToken extends Document {
  user_id: mongoose.Types.ObjectId;
  token: string;
  type: TokenType;
  expires_at: Date;
  created_at: Date;
}

const authTokenSchema = new Schema<IAuthToken>({
  user_id: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  token: { 
    type: String, 
    required: true,
    unique: true
  },
  type: { 
    type: String, 
    required: true,
    enum: ['access', 'refresh']
  },
  expires_at: { 
    type: Date, 
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

// Indexes for performance and expiration checks
authTokenSchema.index({ token: 1 });
authTokenSchema.index({ user_id: 1, type: 1 });
authTokenSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 }); // Auto-delete expired tokens

export default mongoose.model<IAuthToken>('AuthToken', authTokenSchema);