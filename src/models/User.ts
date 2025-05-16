import mongoose, { Document, Schema } from 'mongoose';
import { 
  IFullName, 
  IContact, 
  INextOfKin, 
  IMedicalInfo, 
  IDirectorInfo, 
  ISystemAdminInfo,
  UserRole,
  UserStatus
} from '../types/models';

export interface IUser extends Document {
  full_name: IFullName;
  national_id_or_passport: string;
  birth_certificate_number?: string;
  gender: string;
  dob: Date;
  contact: IContact;
  marital_status?: string;
  occupation?: string;
  education_details?: string;
  county: string;
  sub_county: string;
  role: UserRole;
  password_hash: string;
  next_of_kin?: INextOfKin;
  guardian_for?: mongoose.Types.ObjectId[];
  medical_info?: IMedicalInfo;
  director_info?: IDirectorInfo;
  system_admin_info?: ISystemAdminInfo;
  status: UserStatus;
  created_at: Date;
  updated_at: Date;
}

const userSchema = new Schema<IUser>({
  full_name: {
    first: { type: String, required: true },
    middle: { type: String },
    last: { type: String, required: true }
  },
  national_id_or_passport: { 
    type: String, 
    required: true, 
    unique: true 
  },
  birth_certificate_number: { 
    type: String,
    sparse: true  // Only index if field exists
  },
  gender: { 
    type: String, 
    required: true,
    enum: ['male', 'female', 'other']
  },
  dob: { 
    type: Date, 
    required: true 
  },
  contact: {
    phone: { type: String, required: true },
    email: { 
      type: String, 
      required: true, 
      unique: true,
      lowercase: true,
      trim: true
    }
  },
  marital_status: { 
    type: String,
    enum: ['single', 'married', 'divorced', 'widowed', 'other']
  },
  occupation: { type: String },
  education_details: { type: String },
  county: { type: String, required: true },
  sub_county: { type: String, required: true },
  role: { 
    type: String, 
    required: true,
    enum: ['pwd', 'guardian', 'medical_officer', 'county_director', 'admin']
  },
  password_hash: { type: String, required: true },
  next_of_kin: {
    name: { type: String },
    relationship: { type: String },
    phone: { type: String }
  },
  guardian_for: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  medical_info: {
    license_number: { type: String },
    specialty: { type: String },
    county_of_practice: { type: String },
    approved_by_director: { type: Boolean, default: false }
  },
  director_info: {
    approved_medical_officers: [{ 
      type: Schema.Types.ObjectId, 
      ref: 'User' 
    }]
  },
  system_admin_info: {
    permissions: [{ type: String }]
  },
  status: { 
    type: String, 
    required: true,
    enum: ['active', 'disabled'],
    default: 'active'
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
userSchema.index({ 'contact.email': 1 });
userSchema.index({ national_id_or_passport: 1 });
userSchema.index({ role: 1 });
userSchema.index({ county: 1, role: 1 });

export default mongoose.model<IUser>('User', userSchema);