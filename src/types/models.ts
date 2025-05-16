// User role types
export type UserRole = 'pwd' | 'guardian' | 'medical_officer' | 'county_director' | 'admin';

// User status
export type UserStatus = 'active' | 'disabled';

// Assessment status types
export type AssessmentStatus = 
  'not_booked' | 
  'pending_review' | 
  'mo_review' | 
  'director_review' | 
  'approved' | 
  'rejected';

// Form types
export type FormType = 'MOH-276A' | 'MOH-276B' | 'MOH-276C' | 'MOH-276D' | 'MOH-276E' | 'MOH-276F' | 'MOH-276G';

// Token types
export type TokenType = 'access' | 'refresh';

// Upload related types
export type UploadRelatedType = 'assessment' | 'form' | 'other';

// User interfaces
export interface IFullName {
  first: string;
  middle?: string;
  last: string;
}

export interface IContact {
  phone: string;
  email: string;
}

export interface INextOfKin {
  name: string;
  relationship: string;
  phone: string;
}

export interface IMedicalInfo {
  license_number: string;
  specialty: string;
  county_of_practice: string;
  approved_by_director: boolean;
}

export interface IDirectorInfo {
  approved_medical_officers: string[];
}

export interface ISystemAdminInfo {
  permissions: string[];
}

// Medical Officer Entry interface
export interface IMedicalOfficerEntry {
  officer_id: string;
  form_data: Record<string, any>;
  uploaded_reports: string[];
  comments: string;
  digital_signature: boolean;
  submitted_at: Date;
  reviewed: boolean;
  review_comments?: string;
  approved?: boolean;
}

// Director Review interface
export interface IDirectorReview {
  director_id: string;
  comments: string;
  approved: boolean;
  signed_at: Date;
}

// Upload Related interface
export interface IUploadRelated {
  type: UploadRelatedType;
  id: string;
}