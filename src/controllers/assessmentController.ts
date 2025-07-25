// src/controllers/assessmentController.ts (FIXED)
import { Request, Response } from 'express';
import { body, param } from 'express-validator';
import mongoose from 'mongoose';
import Assessment from '../models/Assessment';
import User, { IUser } from '../models/User'; // Import IUser interface from your User model
import { AppError } from '../middleware/error';
import { AssessmentStatus } from '../types/models';
import { auditLog } from '../middleware/audit'; // Assuming auditLog here takes a string

// Validation rules
export const bookAssessmentValidation = [
  body('pwdId').notEmpty().withMessage('PWD ID is required'),
  body('county').notEmpty().withMessage('County is required'),
  body('hospital').notEmpty().withMessage('Hospital is required'),
  body('assessmentDate').isISO8601().withMessage('Assessment date is required and must be a valid ISO 8601 date string'),
  body('assessmentType').notEmpty().withMessage('Assessment type is required')
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
    const { pwdId, county, hospital, assessmentDate, assessmentType } = req.body;
    const requesterId = req.user?.id;
    const requesterRole = req.user?.role;

    if (!requesterId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (requesterRole !== 'pwd' && requesterRole !== 'guardian') {
      return res.status(403).json({ message: 'Only PWDs or guardians can book assessments' });
    }

    if (!mongoose.Types.ObjectId.isValid(pwdId)) {
      return res.status(400).json({ message: 'Invalid PWD ID' });
    }

    // Fetch the PWD and cast it to IUser for full type safety
    const pwd = await User.findById(pwdId) as IUser;
    if (!pwd) {
      return res.status(404).json({ message: 'PWD not found' });
    }

    if (pwd.role !== 'pwd') {
      return res.status(400).json({ message: 'User is not registered as a PWD' });
    }

    // Authorization check for guardian:
    // Fetch the guardian's full user document to access contact.phone
    if (requesterRole === 'guardian') {
        const guardian = await User.findById(requesterId) as IUser;
        if (!guardian) { // This should ideally not happen if requesterId is valid
            return res.status(401).json({ message: 'Guardian profile not found.' });
        }

        // Check if guardian is authorized for this PWD:
        // 1. Is the PWD's ID in the guardian's 'guardian_for' array?
        const isGuardianForPwd = pwd.guardian_for?.includes(new mongoose.Types.ObjectId(pwdId));

        // 2. Does the guardian's contact phone match the PWD's next_of_kin phone?
        const isNextOfKinMatch = pwd.next_of_kin?.phone && guardian.contact.phone &&
                                 pwd.next_of_kin.phone === guardian.contact.phone;

        if (!isGuardianForPwd && !isNextOfKinMatch) {
            return res.status(403).json({ message: 'You are not authorized to book for this PWD' });
        }
    }


    const assessment = await Assessment.create({
        pwd_id: pwdId,
        requested_by: requesterId,
        county: county,
        hospital: hospital,
        assessment_date: new Date(assessmentDate),
        assessment_category: assessmentType,
        status: 'pending_review',
        medical_officer_entries: [],
        assigned_medical_officer: null
    });

    await auditLog(`User ${requesterId} (${requesterRole}) booked assessment ${assessment._id} for PWD ${pwdId} (${assessmentType}) in ${county} at ${hospital} on ${new Date(assessmentDate).toDateString()}`);

    return res.status(201).json({
        message: 'Assessment booked successfully',
        assessment: {
            id: assessment._id,
            pwdId: assessment.pwd_id,
            county: assessment.county,
            hospital: assessment.hospital,
            assessmentDate: assessment.assessment_date,
            assessmentType: assessment.assessment_category,
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
    console.log("********getting assessment status");
    const { pwdId } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!mongoose.Types.ObjectId.isValid(pwdId)) {
      return res.status(400).json({ message: 'Invalid PWD ID' });
    }

    // Corrected authorization logic:
    // If the user is a guardian, fetch their full user document to check guardian_for
    // and next_of_kin phone if needed.
    if (userRole === 'guardian') {
        const guardian = await User.findById(userId) as IUser;
        if (!guardian || !guardian.guardian_for?.includes(new mongoose.Types.ObjectId(pwdId))) {
            // Also, consider if they are authorized by next_of_kin phone if that's a valid auth method
            const pwd = await User.findById(pwdId) as IUser; // Fetch PWD to check their next_of_kin
            if (!pwd || !pwd.next_of_kin?.phone || pwd.next_of_kin.phone !== guardian.contact.phone) {
                return res.status(403).json({ message: 'Not authorized to view this PWD\'s assessments' });
            }
        }
    } else if (
        userRole !== 'admin' &&
        userRole !== 'county_director' &&
        userRole !== 'medical_officer' &&
        userId !== pwdId // PWD can view their own
    ) {
        return res.status(403).json({ message: 'Not authorized to view this PWD\'s assessments' });
    }


    const assessments = await Assessment.find({ pwd_id: pwdId })
      .sort({ created_at: -1 })
      .populate('pwd_id', 'full_name')
      .populate('requested_by', 'full_name role');

    const formattedAssessments = assessments.map(assessment => ({
      id: assessment._id,
      status: assessment.status,
      county: assessment.county,
      hospital: assessment.hospital,
      assessmentDate: assessment.assessment_date,
      requesterId: assessment.requested_by,
      assignedMedicalOfficer: assessment.assigned_medical_officer,
      assessmentCategory: assessment.assessment_category,
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
export const getAllAssesments=async (req:Request,res:Response)=>{
  try{
const officerRole = req.user?.role;
console.log("getting assesments")
const assesments = await Assessment.find()
  } catch (error){
 
  }

}

// Get all assessments by county director filter by county
export const getAllAssessmentsByCounty = async (req: Request, res: Response): Promise<Response> => {
  try {
    const officerRole = req.user?.role;
    const county = req.user?.county;

    if (!officerRole || !county) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (officerRole !== 'county_director') {
      return res.status(403).json({ message: 'Only county directors can access county assessments' });
    }

    const assessments = await Assessment.find({ county })
      .populate('pwd_id', 'full_name gender dob county sub_county')
      .sort({ created_at: 1 });

    const formatted = assessments.map((assessment) => {
      const pwd = assessment.pwd_id as any;
      return {
        id: assessment._id,
        pwdId: pwd._id,
        pwdName: `${pwd.full_name.first} ${pwd.full_name.middle ? pwd.full_name.middle + ' ' : ''}${pwd.full_name.last}`,
        pwdGender: pwd.gender,
        pwdAge: calculateAge(pwd.dob),
        pwdCounty: pwd.county,
        pwdSubCounty: pwd.sub_county,
        county: assessment.county,
        hospital: assessment.hospital,
        assessmentDate: assessment.assessment_date,
        assessmentCategory: assessment.assessment_category,
        status: assessment.status,
        createdAt: assessment.created_at,
      };
    });

    return res.status(200).json({ assessments: formatted });
  } catch (error) {
    console.error('Get all assessments by county error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get all Assesments pending approval by medical approver
export const getPendingApprovals = async (req: Request, res: Response): Promise<Response> => {
  try {
    const officerRole = req.user?.role;
    const officerId = req.user?.id;

    if (!officerRole || !officerId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (officerRole !== 'medical_approver') {
      return res.status(403).json({ message: 'Only medical approvers can access pending approvals' });
    }

    const assessments = await Assessment.find({ status: 'pending_approval' })
      .populate('pwd_id', 'full_name gender dob county sub_county')
      .sort({ created_at: 1 });

    const formatted = assessments.map((assessment) => {
      const pwd = assessment.pwd_id as any;
      return {
        id: assessment._id,
        pwdId: pwd._id,
        pwdName: `${pwd.full_name.first} ${pwd.full_name.middle ? pwd.full_name.middle + ' ' : ''}${pwd.full_name.last}`,
        pwdGender: pwd.gender,
        pwdAge: calculateAge(pwd.dob),
        pwdCounty: pwd.county,
        pwdSubCounty: pwd.sub_county,
        county: assessment.county,
        hospital: assessment.hospital,
        assessmentDate: assessment.assessment_date,
        assessmentCategory: assessment.assessment_category,
        formData: assessment.medical_officer_entries[0]?.form_data || {},
        status: assessment.status,
        createdAt: assessment.created_at,
      };
    });

    return res.status(200).json({ assessments: formatted });
  } catch (error) {
    console.error('Get pending approvals error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};


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

    const officer = await User.findById(officerId);
    if (!officer || !officer.medical_info) {
      return res.status(404).json({ message: 'Medical officer profile not found' });
    }

    const specialty = officer.medical_info.specialty;

    const assessments = await Assessment.find(
      {status: "pending_review",
        assessment_category: specialty,
      }
    )
      .populate('pwd_id', 'full_name gender dob county sub_county')
      .sort({ created_at: 1 });

const formattedAssessments = assessments.map(assessment => {
      const pwd = assessment.pwd_id as any;
      return {
        id: assessment._id,
        pwdId: pwd._id,
        pwdName: `${pwd.full_name.first} ${pwd.full_name.middle ? pwd.full_name.middle + ' ' : ''}${pwd.full_name.last}`,
        pwdGender: pwd.gender,
        pwdAge: calculateAge(pwd.dob),
        pwdCounty: pwd.county,
        pwdSubCounty: pwd.sub_county,
        county: assessment.county,
        hospital: assessment.hospital,
        assessmentDate: assessment.assessment_date,
        assessmentCategory: assessment.assessment_category,
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

    if (!mongoose.Types.ObjectId.isValid(assessmentId)) {
      return res.status(400).json({ message: 'Invalid assessment ID' });
    }

    const officer = await User.findById(officerId);
    if (!officer || !officer.medical_info) {
      return res.status(404).json({ message: 'Medical officer profile not found' });
    }

    if (!officer.medical_info.approved_by_director) {
      return res.status(403).json({
        message: 'Your account has not been approved by a county director yet'
      });
    }

    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    if (assessment.status !== 'pending_review') {
      return res.status(400).json({
        message: `Cannot submit assessment with status: ${assessment.status}`
      });
    }

    const entry = {
      officer_id: officerId,
      form_data: formData,
      uploaded_reports: uploadedReports || [],
      comments: comments || '',
      digital_signature: digitalSignature,
      submitted_at: new Date(),
      reviewed: false
    };

    assessment.medical_officer_entries.push(entry);
    assessment.status = 'pending_approval';
    await assessment.save();

    await auditLog(`Medical officer ${officerId} submitted assessment ${assessment._id} for PWD ${assessment.pwd_id}`);

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

    const { approved, comments, formData } = req.body;

    const officerId = req.user?.id;
    const officerRole = req.user?.role;

    if (!officerId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (officerRole !== 'medical_approver') {
      return res.status(403).json({ message: 'Only medical approvers can review assessments' });
    }

    if (!mongoose.Types.ObjectId.isValid(assessmentId)) {
      return res.status(400).json({ message: 'Invalid assessment ID' });
    }

    const officer = await User.findById(officerId);
    if (!officer || !officer.medical_info) {
      return res.status(404).json({ message: 'Medical officer profile not found' });
    }

    // if (!officer.medical_info.approved_by_director) {
    //   return res.status(403).json({
    //     message: 'Your account has not been approved by a county director yet'
    //   });
    // }

    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    if (assessment.status !== 'pending_approval') {
      return res.status(400).json({
        message: `Cannot review assessment with status: ${assessment.status}`
      });
    }

    // const entryIndex = assessment.medical_officer_entries.findIndex(
    //   entry => entry.officer_id.toString() === officerId && !entry.reviewed
    // );

    // if (entryIndex === -1) {
    //   return res.status(404).json({ message: 'No eligible entry found for review' });
    // }

    assessment.medical_officer_entries[0].reviewed = true;
    assessment.medical_officer_entries[0].review_comments = comments;
    assessment.medical_officer_entries[0].approved = approved;
    assessment.medical_officer_entries[0].form_data = formData || {};


    assessment.status = 'director_review';
    await assessment.save();

    await auditLog(`Medical officer ${officerId} reviewed assessment ${assessment._id} for PWD ${assessment.pwd_id} (Approved: ${approved})`);


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

    // Update medical officer's reviewed count
    await User.findByIdAndUpdate(
      officerId,
      {
        $inc: { 'assessment_stats.reviewed_count': 1 },
        $set: { 'assessment_stats.last_activity': new Date() }
      }
    );

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
    return res.status(500).json({ message: 'Server error' });
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
    const { approved, comments, finalized } = req.body;
    const directorId = req.user?.id;
    const directorRole = req.user?.role;

    if (!directorId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (directorRole !== 'county_director') {
      return res.status(403).json({ message: 'Only county directors can finalize assessments' });
    }

    if (!mongoose.Types.ObjectId.isValid(assessmentId)) {
      return res.status(400).json({ message: 'Invalid assessment ID' });
    }

    const assessment = await Assessment.findById(assessmentId)
      .populate('pwd_id', 'county');

    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    if (assessment.status !== 'director_review') {
      return res.status(400).json({
        message: `Cannot finalize assessment with status: ${assessment.status}`
      });
    }

    const pwdCounty = (assessment.pwd_id as any).county;
    if (pwdCounty !== req.user?.county) {
      return res.status(403).json({
        message: 'You can only finalize assessments for PWDs in your county'
      });
    }

    assessment.director_review = {
      director_id: directorId,
      comments: comments || '',
      approved,
      signed_at: new Date()
    };

    assessment.status = approved ? 'approved' : 'rejected';
    await assessment.save();

    await auditLog(`Director ${directorId} ${approved ? 'approved' : 'rejected'} assessment ${assessment._id} for PWD ${assessment.pwd_id}`);


    // Update director's completed count if approved
    if (approved) {
      await User.findByIdAndUpdate(
        directorId,
        {
          $inc: { 'assessment_stats.completed_count': 1 },
          $set: { 'assessment_stats.last_activity': new Date() }
        }
      );
    }

    return res.status(200).json({
      message: `Assessment ${approved ? 'approved' : 'rejected'} successfully`,
      assessmentId: assessment._id,
      status: assessment.status
    });
  } catch (error) {
    console.error('Finalize assessment error:', error);
    return res.status(500).json({ message: 'Server error' });
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

    if (!mongoose.Types.ObjectId.isValid(assessmentId)) {
      return res.status(400).json({ message: 'Invalid assessment ID' });
    }

    const assessment = await Assessment.findById(assessmentId)
      .populate('pwd_id', 'full_name gender dob county sub_county')
      .populate('requested_by', 'full_name')
      .populate('medical_officer_entries.officer_id', 'full_name medical_info.specialty')
      .populate('director_review.director_id', 'full_name')
      .populate('assigned_medical_officer', 'full_name medical_info.specialty');

    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    if (userRole !== 'admin') {
      const pwdId = assessment.pwd_id._id.toString();

      if (userId === pwdId) {
        // Allowed
      }
      else if (userRole === 'guardian') {
        const guardian = await User.findById(userId);
        if (!guardian || !guardian.guardian_for?.map(id => id.toString()).includes(pwdId)) {
          return res.status(403).json({ message: 'Not authorized to view this assessment' });
        }
      }
      else if (userRole === 'county_director') {
        if (req.user?.county !== (assessment.pwd_id as any).county) {
          return res.status(403).json({ message: 'Not authorized to view this assessment' });
        }
      }
      else if (userRole === 'medical_officer') {
        const isContributor = assessment.medical_officer_entries.some(
          entry => entry.officer_id.toString() === userId
        );
        const isAssigned = assessment.assigned_medical_officer?.toString() === userId;

        if (!isContributor && !isAssigned) {
          return res.status(403).json({ message: 'Not authorized to view this assessment' });
        }
      }
      else {
        return res.status(403).json({ message: 'Not authorized to view this assessment' });
      }
    }

    if (assessment.status !== 'approved' && userRole !== 'admin' && userRole !== 'county_director') {
      return res.status(400).json({
        message: 'Report is not available. Assessment is not yet approved.'
      });
    }

    const pwd = assessment.pwd_id as any;
    const assignedOfficer = assessment.assigned_medical_officer as any;

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
      assessmentCategory: assessment.assessment_category,
      requestedBy: `${(assessment.requested_by as any).full_name.first} ${(assessment.requested_by as any).full_name.last}`,
      requestedAt: assessment.created_at,
      status: assessment.status,
      bookedCounty: assessment.county,
      bookedHospital: assessment.hospital,
      bookedAssessmentDate: assessment.assessment_date,
      assignedOfficer: assignedOfficer ? {
          id: assignedOfficer._id,
          fullName: `${assignedOfficer.full_name.first} ${assignedOfficer.full_name.middle ? assignedOfficer.full_name.middle + ' ' : ''}${assignedOfficer.full_name.last}`,
          specialty: assignedOfficer.medical_info?.specialty || 'N/A'
      } : null,
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

    const { status, fromDate, toDate } = req.query;

    const query: any = {};

    query.county = county;

    if (status && ['not_booked', 'pending_review', 'mo_review', 'director_review', 'approved', 'rejected'].includes(status as string)) {
      query.status = status;
    }

    if (fromDate || toDate) {
      query.assessment_date = {};
      if (fromDate) {
        query.assessment_date.$gte = new Date(fromDate as string);
      }
      if (toDate) {
        query.assessment_date.$lte = new Date(toDate as string);
      }
    }

    const assessments = await Assessment.find(query)
      .populate('pwd_id', 'full_name gender dob')
      .populate('requested_by', 'full_name role')
      .populate('assigned_medical_officer', 'full_name')
      .sort({ created_at: -1 });

    const formattedAssessments = assessments.map(assessment => {
      const pwd = assessment.pwd_id as any;
      const assignedOfficer = assessment.assigned_medical_officer as any;

      return {
        id: assessment._id,
        pwdName: `${pwd.full_name.first} ${pwd.full_name.middle ? pwd.full_name.middle + ' ' : ''}${pwd.full_name.last}`,
        pwdGender: pwd.gender,
        pwdAge: calculateAge(pwd.dob),
        bookedCounty: assessment.county,
        bookedHospital: assessment.hospital,
        bookedAssessmentDate: assessment.assessment_date,
        assessmentCategory: assessment.assessment_category,
        status: assessment.status,
        needsDirectorReview: assessment.status === 'director_review',
        hasOfficerEntries: assessment.medical_officer_entries.length > 0,
        requestedBy: `${(assessment.requested_by as any).full_name.first} ${(assessment.requested_by as any).full_name.last}`,
        assignedMedicalOfficer: assignedOfficer ? `${assignedOfficer.full_name.first} ${assignedOfficer.full_name.last}` : 'Not Assigned',
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