import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document {
  user_id: mongoose.Types.ObjectId;
  action: string;
  description: string;
  ip_address: string;
  timestamp: Date;
}

const auditLogSchema = new Schema<IAuditLog>({
  user_id: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  action: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  ip_address: { 
    type: String, 
    required: true 
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  }
});

// Indexes for performance
auditLogSchema.index({ user_id: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ timestamp: -1 });

export default mongoose.model<IAuditLog>('AuditLog', auditLogSchema);