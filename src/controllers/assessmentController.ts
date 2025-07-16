import { Request, Response } from 'express';
import { body, param } from 'express-validator';
import mongoose from 'mongoose';
import Assessment from '../models/Assessment';
import User from '../models/User';
import { AppError } from '../middleware/error';
import { AssessmentStatus, FormType } from '../types/models';
import { auditLog } from '../middleware/audit';

// Validation rules
export const bookAssessmentValidation = [
  body('pwdId').notEmpty().withMessage('PWD ID is required'),
  body('formType')
    .isIn(['MOH-276A', 'MOH-276B', 'MOH-276C', 'MOH-276D', 'MOH-276E', 'MOH-276F', 'MOH-276G'])
    .withMessage('Invalid form type')
];

export const submitAssessmentValidation = [
  body('formData').isObject().withMessage('Form data is required'),
  body('comments').optional().isString(),
  body('digitalSignature').isBoolean().withMessage('Digital signature is required')
];

export const reviewAssessmentValidation = [
  body('approved').isBoolean().withMessage('Approval status is required'),
  body('comments').optional().isString(),
  body('formData').optional().isObject().withMessage('Form data must be an object'),
  body('uploadedReports').optional().isArray().withMessage('Uploaded reports must be an array')
];

export const updateFormDataValidation = [
  body('formData').isObject().withMessage('Form data is required'),
  body('comments').optional().isString()
];

/**
 * Book a medical assessment
 * @route POST /api/assessments/book
 */
export const bookAssessment = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { pwdId, formType } = req.body;
    const requesterId = req.user?.id;
    const requesterRole = req.user?.role;

    if (!requesterId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Validate roles - only PWD or guardian can book
    if (requesterRole !== 'pwd' && requesterRole !== 'guardian') {
      return res.status(403).json({ message: 'Only PWDs or guardians can book assessments' });
    }

    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(pwdId)) {
      return res.status(400).json({ message: 'Invalid PWD ID' });
    }

    // Find PWD
    const pwd = await User.findById(pwdId);
    if (!pwd) {
      return res.status(404).json({ message: 'PWD not found' });
    }

    // Check if PWD role is correct
    if (pwd.role !== 'pwd') {
      return res.status(400).json({ message: 'User is not registered as a PWD' });
    }

    // If requester is guardian, check if they're authorized for this PWD
    if (
      requesterRole === 'guardian' && 
      !pwd.next_of_kin?.phone && 
      !pwd.guardian_for?.includes(new mongoose.Types.ObjectId(pwdId))
    ) {
      return res.status(403).json({ message: 'You are not authorized to book for this PWD' });
    }

    // Create assessment
    const assessment = await Assessment.create({
      pwd_id: pwdId,
      requested_by: requesterId,
      status: 'pending_review',
      form_type: formType as FormType,
      medical_officer_entries: []
    });

    return res.status(201).json({
      message: 'Assessment booked successfully',
      assessment: {
        id: assessment._id,
        pwdId: assessment.pwd_id,
        formType: assessment.form_type,
        status: assessment.status,
        createdAt: assessment.created_at
      }
    });
  } catch (error) {
    console.error('Book assessment error:', error);
    return res.status(500).json({ message: 'Server error during assessment booking' });
  }
};

/**
 * View assessment status for a PWD
 * @route GET /api/assessments/status/:pwdId
 */
export const getAssessmentStatus = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { pwdId } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(pwdId)) {
      return res.status(400).json({ message: 'Invalid PWD ID' });
    }

    // Check authorization
    if (
      userRole !== 'admin' && 
      userRole !== 'county_director' && 
      userRole !== 'medical_officer' && 
      userId !== pwdId
    ) {
      // If guardian, check if authorized for this PWD
      if (userRole === 'guardian') {
        const guardian = await User.findById(userId);
        if (!guardian || !guardian.guardian_for?.includes(new mongoose.Types.ObjectId(pwdId))) {
          return res.status(403).json({ message: 'Not authorized to view this PWD\'s assessments' });
        }
      } else {
        return res.status(403).json({ message: 'Not authorized to view this PWD\'s assessments' });
      }
    }

    // Find all assessments for this PWD
    const assessments = await Assessment.find({ pwd_id: pwdId })
      .sort({ created_at: -1 })
      .populate('pwd_id', 'full_name')
      .populate('requested_by', 'full_name role');

    // Format assessment data
    const formattedAssessments = assessments.map(assessment => ({
      id: assessment._id,
      status: assessment.status,
      formType: assessment.form_type,
      requestedBy: {
        id: assessment.requested_by,
        name: `${(assessment.requested_by as any).full_name.first} ${(assessment.requested_by as any).full_name.last}`,
        role: (assessment.requested_by as any).role
      },
      createdAt: assessment.created_at,
      lastUpdated: assessment.updated_at,
      hasDirectorReview: !!assessment.director_review,
      isApproved: assessment.status === 'approved'
    }));

    return res.status(200).json({ assessments: formattedAssessments });
  } catch (error) {
    console.error('Get assessment status error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * View assessments assigned to a medical officer
 * @route GET /api/assessments/assigned
 */
export const getAssignedAssessments = async (req: Request, res: Response): Promise<Response> => {
  try {
    const officerId = req.user?.id;
    const officerRole = req.user?.role;
    const county = req.user?.county;

    if (!officerId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (officerRole !== 'medical_officer') {
      return res.status(403).json({ message: 'Only medical officers can access assigned assessments' });
    }

    // Get medical officer details
    const officer = await User.findById(officerId);
    if (!officer || !officer.medical_info) {
      return res.status(404).json({ message: 'Medical officer profile not found' });
    }

    // Check if officer is approved
    if (!officer.medical_info.approved_by_director) {
      return res.status(403).json({ 
        message: 'Your account has not been approved by a county director yet' 
      });
    }

    // Get the officer's specialty
    const specialty = officer.medical_info.specialty;

    // Find pending assessments in officer's county
    const assessments = await Assessment.find({
      status: 'pending_review',
      // For now, assume all officers can see all assessments in their county
      // In a real app, you would filter by form type based on the officer's specialty
    })
      .populate('pwd_id', 'full_name gender dob county sub_county')
      .sort({ created_at: 1 });

    // Format assessment data
    const formattedAssessments = assessments.map(assessment => {
      const pwd = assessment.pwd_id as any;
      return {
        id: assessment._id,
        pwdName: `${pwd.full_name.first} ${pwd.full_name.last}`,
        pwdGender: pwd.gender,
        pwdAge: calculateAge(pwd.dob),
        pwdCounty: pwd.county,
        pwdSubCounty: pwd.sub_county,
        formType: assessment.form_type,
        status: assessment.status,
        createdAt: assessment.created_at
      };
    });

    return res.status(200).json({ assessments: formattedAssessments });
  } catch (error) {
    console.error('Get assigned assessments error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Submit assessment by medical officer
 * @route POST /api/assessments/submit/:assessmentId
 */
export const submitAssessment = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { assessmentId } = req.params;
    const { formData, comments, digitalSignature, uploadedReports } = req.body;
    const officerId = req.user?.id;
    const officerRole = req.user?.role;

    if (!officerId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (officerRole !== 'medical_officer') {
      return res.status(403).json({ message: 'Only medical officers can submit assessments' });
    }

    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(assessmentId)) {
      return res.status(400).json({ message: 'Invalid assessment ID' });
    }

    // Get medical officer details
    const officer = await User.findById(officerId);
    if (!officer || !officer.medical_info) {
      return res.status(404).json({ message: 'Medical officer profile not found' });
    }

    // Check if officer is approved
    if (!officer.medical_info.approved_by_director) {
      return res.status(403).json({ 
        message: 'Your account has not been approved by a county director yet' 
      });
    }

    // Find assessment
    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    // Check assessment status
    if (assessment.status !== 'pending_review') {
      return res.status(400).json({ 
        message: `Cannot submit assessment with status: ${assessment.status}` 
      });
    }

    // Create medical officer entry
    const entry = {
      officer_id: officerId,
      form_data: formData,
      uploaded_reports: uploadedReports || [],
      comments: comments || '',
      digital_signature: digitalSignature,
      submitted_at: new Date(),
      reviewed: false
    };

    // Add entry to assessment
    assessment.medical_officer_entries.push(entry);
    assessment.status = 'mo_review';
    await assessment.save();

    return res.status(200).json({
      message: 'Assessment submitted successfully',
      assessmentId: assessment._id,
      status: assessment.status
    });
  } catch (error) {
    console.error('Submit assessment error:', error);
    return res.status(500).json({ message: 'Server error during assessment submission' });
  }
};

/**
 * Review assessment by medical officer
 * @route PUT /api/assessments/review/:assessmentId
 */
export const reviewAssessment = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { assessmentId } = req.params;
    const { approved, comments, formData, uploadedReports } = req.body;
    const officerId = req.user?.id;
    const officerRole = req.user?.role;

    if (!officerId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (officerRole !== 'medical_officer') {
      return res.status(403).json({ message: 'Only medical officers can review assessments' });
    }

    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(assessmentId)) {
      return res.status(400).json({ message: 'Invalid assessment ID' });
    }

    // Get medical officer details
    const officer = await User.findById(officerId);
    if (!officer || !officer.medical_info) {
      return res.status(404).json({ message: 'Medical officer profile not found' });
    }

    // Check if officer is approved
    if (!officer.medical_info.approved_by_director) {
      return res.status(403).json({ 
        message: 'Your account has not been approved by a county director yet' 
      });
    }

    // Find assessment
    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    // Check assessment status
    if (assessment.status !== 'mo_review') {
      return res.status(400).json({ 
        message: `Cannot review assessment with status: ${assessment.status}` 
      });
    }

    // Update entry for the medical officer to review
    const entryIndex = assessment.medical_officer_entries.findIndex(
      entry => entry.officer_id.toString() === officerId && !entry.reviewed
    );

    if (entryIndex === -1) {
      return res.status(404).json({ message: 'No eligible entry found for review' });
    }

    assessment.medical_officer_entries[entryIndex].reviewed = true;
    assessment.medical_officer_entries[entryIndex].review_comments = comments;
    assessment.medical_officer_entries[entryIndex].approved = approved;

    // Update form data if provided
    if (formData) {
      assessment.medical_officer_entries[entryIndex].form_data = {
        ...assessment.medical_officer_entries[entryIndex].form_data,
        ...formData
      };
    }

    // Update uploaded reports if provided
    if (uploadedReports) {
      assessment.medical_officer_entries[entryIndex].uploaded_reports = uploadedReports;
    }
    // Update assessment status
    assessment.status = 'director_review';
    await assessment.save();

    return res.status(200).json({
      message: 'Assessment reviewed successfully',
      assessmentId: assessment._id,
      status: assessment.status,
      approved,
      updatedFormData: formData ? true : false,
      updatedReports: uploadedReports ? true : false
    });
  } catch (error) {
    console.error('Review assessment error:', error);
    return res.status(500).json({ message: 'Server error during assessment review' });
  }
};

/**
 * Update assessment form data by medical officer
 * @route PUT /api/assessments/update-form/:assessmentId
 */
export const updateAssessmentFormData = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { assessmentId } = req.params;
    const { formData, comments } = req.body;
    const officerId = req.user?.id;
    const officerRole = req.user?.role;

    if (!officerId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (officerRole !== 'medical_officer') {
      return res.status(403).json({ message: 'Only medical officers can update form data' });
    }

    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(assessmentId)) {
      return res.status(400).json({ message: 'Invalid assessment ID' });
    }

    // Get medical officer details
    const officer = await User.findById(officerId);
    if (!officer || !officer.medical_info) {
      return res.status(404).json({ message: 'Medical officer profile not found' });
    }

    // Check if officer is approved
    if (!officer.medical_info.approved_by_director) {
      return res.status(403).json({ 
        message: 'Your account has not been approved by a county director yet' 
      });
    }

    // Find assessment
    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    // Check assessment status - allow updates for mo_review and director_review
    if (!['mo_review', 'director_review'].includes(assessment.status)) {
      return res.status(400).json({ 
        message: `Cannot update form data for assessment with status: ${assessment.status}` 
      });
    }

    // Find the officer's entry
    const entryIndex = assessment.medical_officer_entries.findIndex(
      entry => entry.officer_id.toString() === officerId
    );

    if (entryIndex === -1) {
      return res.status(404).json({ message: 'No entry found for this officer' });
    }

    // Update form data
    assessment.medical_officer_entries[entryIndex].form_data = {
      ...assessment.medical_officer_entries[entryIndex].form_data,
      ...formData
    };

    // Add update comments if provided
    if (comments) {
      assessment.medical_officer_entries[entryIndex].update_comments = comments;
    }

    // Mark as updated
    assessment.medical_officer_entries[entryIndex].last_updated = new Date();
    
    await assessment.save();

    return res.status(200).json({
      message: 'Form data updated successfully',
      assessmentId: assessment._id,
      updatedAt: assessment.medical_officer_entries[entryIndex].last_updated
    });
  } catch (error) {
    console.error('Update assessment form data error:', error);
    return res.status(500).json({ message: 'Server error during form data update' });
  }
};

/**
 * Finalize assessment by county director
 * @route PUT /api/assessments/finalize/:assessmentId
 */
export const finalizeAssessment = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { assessmentId } = req.params;
    const { approved, comments } = req.body;
    const directorId = req.user?.id;
    const directorRole = req.user?.role;

    if (!directorId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (directorRole !== 'county_director') {
      return res.status(403).json({ message: 'Only county directors can finalize assessments' });
    }

    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(assessmentId)) {
      return res.status(400).json({ message: 'Invalid assessment ID' });
    }

    // Find assessment
    const assessment = await Assessment.findById(assessmentId)
      .populate('pwd_id', 'county');
    
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    // Check assessment status
    if (assessment.status !== 'director_review') {
      return res.status(400).json({ 
        message: `Cannot finalize assessment with status: ${assessment.status}` 
      });
    }

    // Check if PWD is in director's county
    const pwdCounty = (assessment.pwd_id as any).county;
    if (pwdCounty !== req.user?.county) {
      return res.status(403).json({ 
        message: 'You can only finalize assessments for PWDs in your county' 
      });
    }

    // Add director review
    assessment.director_review = {
      director_id: directorId,
      comments: comments || '',
      approved,
      signed_at: new Date()
    };

    // Update assessment status
    assessment.status = approved ? 'approved' : 'rejected';
    await assessment.save();

    return res.status(200).json({
      message: `Assessment ${approved ? 'approved' : 'rejected'} successfully`,
      assessmentId: assessment._id,
      status: assessment.status
    });
  } catch (error) {
    console.error('Finalize assessment error:', error);
    return res.status(500).json({ message: 'Server error during assessment finalization' });
  }
};

/**
 * Get assessment report
 * @route GET /api/assessments/report/:assessmentId
 */
export const getAssessmentReport = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { assessmentId } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(assessmentId)) {
      return res.status(400).json({ message: 'Invalid assessment ID' });
    }

    // Find assessment with all details
    const assessment = await Assessment.findById(assessmentId)
      .populate('pwd_id', 'full_name gender dob county sub_county')
      .populate('requested_by', 'full_name')
      .populate('medical_officer_entries.officer_id', 'full_name medical_info.specialty')
      .populate('director_review.director_id', 'full_name');
    
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    // Check authorization
    if (userRole !== 'admin') {
      const pwdId = assessment.pwd_id._id.toString();
      
      // PWD can see their own assessment
      if (userId === pwdId) {
        // Allowed
      }
      // Guardian can see assessments for PWDs they manage
      else if (userRole === 'guardian') {
        const guardian = await User.findById(userId);
        if (!guardian || !guardian.guardian_for?.map(id => id.toString()).includes(pwdId)) {
          return res.status(403).json({ message: 'Not authorized to view this assessment' });
        }
      }
      // County director can only see assessments in their county
      else if (userRole === 'county_director') {
        if (req.user?.county !== (assessment.pwd_id as any).county) {
          return res.status(403).json({ message: 'Not authorized to view this assessment' });
        }
      }
      // Medical officer can only see assessments they contributed to
      else if (userRole === 'medical_officer') {
        const officerEntries = assessment.medical_officer_entries.filter(
          entry => entry.officer_id.toString() === userId
        );
        if (officerEntries.length === 0) {
          return res.status(403).json({ message: 'Not authorized to view this assessment' });
        }
      }
      else {
        return res.status(403).json({ message: 'Not authorized to view this assessment' });
      }
    }

    // Check if assessment is approved
    if (assessment.status !== 'approved' && userRole !== 'admin' && userRole !== 'county_director') {
      return res.status(400).json({ 
        message: 'Report is not available. Assessment is not yet approved.' 
      });
    }

    // Format data for report
    const pwd = assessment.pwd_id as any;
    const reportData = {
      assessmentId: assessment._id,
      pwdInfo: {
        id: pwd._id,
        fullName: `${pwd.full_name.first} ${pwd.full_name.middle ? pwd.full_name.middle + ' ' : ''}${pwd.full_name.last}`,
        gender: pwd.gender,
        age: calculateAge(pwd.dob),
        county: pwd.county,
        subCounty: pwd.sub_county
      },
      formType: assessment.form_type,
      requestedBy: `${(assessment.requested_by as any).full_name.first} ${(assessment.requested_by as any).full_name.last}`,
      requestedAt: assessment.created_at,
      status: assessment.status,
      medicalAssessment: assessment.medical_officer_entries.map(entry => ({
        officerName: `${(entry.officer_id as any).full_name.first} ${(entry.officer_id as any).full_name.last}`,
        specialty: (entry.officer_id as any).medical_info.specialty,
        formData: entry.form_data,
        comments: entry.comments,
        submittedAt: entry.submitted_at,
        approved: entry.approved
      })),
      directorReview: assessment.director_review ? {
        directorName: `${(assessment.director_review.director_id as any).full_name.first} ${(assessment.director_review.director_id as any).full_name.last}`,
        comments: assessment.director_review.comments,
        approved: assessment.director_review.approved,
        signedAt: assessment.director_review.signed_at
      } : null
    };

    return res.status(200).json({ report: reportData });
  } catch (error) {
    console.error('Get assessment report error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get county assessments (for county director)
 * @route GET /api/assessments/county
 */
export const getCountyAssessments = async (req: Request, res: Response): Promise<Response> => {
  try {
    const directorId = req.user?.id;
    const directorRole = req.user?.role;
    const county = req.user?.county;

    if (!directorId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (directorRole !== 'county_director') {
      return res.status(403).json({ message: 'Only county directors can access county assessments' });
    }

    // Get filter parameters
    const { status, fromDate, toDate } = req.query;
    
    // Build query
    const query: any = {};
    
    // For county director, show only assessments from their county
    // We'll need to first find all PWDs in the county
    const pwdsInCounty = await User.find({ role: 'pwd', county }).select('_id');
    const pwdIds = pwdsInCounty.map(pwd => pwd._id);
    
    query.pwd_id = { $in: pwdIds };
    
    // Add status filter if provided
    if (status && ['not_booked', 'pending_review', 'mo_review', 'director_review', 'approved', 'rejected'].includes(status as string)) {
      query.status = status;
    }
    
    // Add date filter if provided
    if (fromDate || toDate) {
      query.created_at = {};
      if (fromDate) {
        query.created_at.$gte = new Date(fromDate as string);
      }
      if (toDate) {
        query.created_at.$lte = new Date(toDate as string);
      }
    }
    
    // Get assessments
    const assessments = await Assessment.find(query)
      .populate('pwd_id', 'full_name gender dob')
      .sort({ created_at: -1 });
    
    // Format assessment data
    const formattedAssessments = assessments.map(assessment => {
      const pwd = assessment.pwd_id as any;
      return {
        id: assessment._id,
        pwdName: `${pwd.full_name.first} ${pwd.full_name.last}`,
        pwdGender: pwd.gender,
        pwdAge: calculateAge(pwd.dob),
        formType: assessment.form_type,
        status: assessment.status,
        needsDirectorReview: assessment.status === 'director_review',
        hasOfficerEntries: assessment.medical_officer_entries.length > 0,
        createdAt: assessment.created_at
      };
    });
    
    return res.status(200).json({ 
      county, 
      total: formattedAssessments.length,
      assessments: formattedAssessments 
    });
  } catch (error) {
    console.error('Get county assessments error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Helper function to calculate age from date of birth
function calculateAge(dob: Date): number {
  const today = new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}