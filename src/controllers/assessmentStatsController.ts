import { Request, Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/User';
import Assessment from '../models/Assessment';
import { AppError } from '../middleware/error';

/**
 * Get assessment statistics for current user
 * @route GET /api/assessments/my-stats
 */
export const getMyAssessmentStats = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Find user with assessment stats
    const user = await User.findById(userId).select('assessment_stats role full_name');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Initialize stats if they don't exist
    const stats = user.assessment_stats || {
      reviewed_count: 0,
      completed_count: 0,
      last_activity: new Date()
    };

    // Get additional statistics based on role
    let additionalStats = {};

    if (userRole === 'medical_officer') {
      // Get assessments submitted by this officer
      const submittedAssessments = await Assessment.find({
        'medical_officer_entries.officer_id': userId
      });

      const pendingReviews = submittedAssessments.filter(
        assessment => assessment.status === 'mo_review'
      ).length;

      const approvedAssessments = submittedAssessments.filter(
        assessment => assessment.status === 'approved'
      ).length;

      additionalStats = {
        submitted_assessments: submittedAssessments.length,
        pending_reviews: pendingReviews,
        approved_assessments: approvedAssessments
      };
    }

    if (userRole === 'county_director') {
      // Get assessments in director's county
      const pwdsInCounty = await User.find({ 
        role: 'pwd', 
        county: req.user?.county 
      }).select('_id');
      
      const pwdIds = pwdsInCounty.map(pwd => pwd._id);
      
      const countyAssessments = await Assessment.find({
        pwd_id: { $in: pwdIds }
      });

      const pendingDirectorReview = countyAssessments.filter(
        assessment => assessment.status === 'director_review'
      ).length;

      const totalApproved = countyAssessments.filter(
        assessment => assessment.status === 'approved'
      ).length;

      additionalStats = {
        total_county_assessments: countyAssessments.length,
        pending_director_review: pendingDirectorReview,
        total_approved: totalApproved
      };
    }

    return res.status(200).json({
      user: {
        id: user._id,
        name: `${user.full_name.first} ${user.full_name.last}`,
        role: user.role
      },
      assessment_stats: {
        reviewed_count: stats.reviewed_count,
        completed_count: stats.completed_count,
        last_activity: stats.last_activity,
        ...additionalStats
      }
    });
  } catch (error) {
    console.error('Get assessment stats error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get assessment statistics for a specific user (admin/director only)
 * @route GET /api/assessments/user-stats/:userId
 */
export const getUserAssessmentStats = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { userId } = req.params;
    const requesterId = req.user?.id;
    const requesterRole = req.user?.role;

    if (!requesterId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Only admin and county directors can view other users' stats
    if (requesterRole !== 'admin' && requesterRole !== 'county_director') {
      return res.status(403).json({ 
        message: 'Only administrators and county directors can view user statistics' 
      });
    }

    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Find target user
    const user = await User.findById(userId).select('assessment_stats role full_name county');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // County directors can only view stats for users in their county
    if (requesterRole === 'county_director' && user.county !== req.user?.county) {
      return res.status(403).json({ 
        message: 'You can only view statistics for users in your county' 
      });
    }

    // Initialize stats if they don't exist
    const stats = user.assessment_stats || {
      reviewed_count: 0,
      completed_count: 0,
      last_activity: new Date()
    };

    return res.status(200).json({
      user: {
        id: user._id,
        name: `${user.full_name.first} ${user.full_name.last}`,
        role: user.role,
        county: user.county
      },
      assessment_stats: stats
    });
  } catch (error) {
    console.error('Get user assessment stats error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Update assessment statistics manually (admin only)
 * @route PUT /api/assessments/update-stats/:userId
 */
export const updateAssessmentStats = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { userId } = req.params;
    const { reviewed_count, completed_count } = req.body;
    const requesterId = req.user?.id;
    const requesterRole = req.user?.role;

    if (!requesterId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Only admin can manually update stats
    if (requesterRole !== 'admin') {
      return res.status(403).json({ 
        message: 'Only administrators can manually update assessment statistics' 
      });
    }

    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Validate input
    if (reviewed_count !== undefined && (typeof reviewed_count !== 'number' || reviewed_count < 0)) {
      return res.status(400).json({ message: 'Reviewed count must be a non-negative number' });
    }

    if (completed_count !== undefined && (typeof completed_count !== 'number' || completed_count < 0)) {
      return res.status(400).json({ message: 'Completed count must be a non-negative number' });
    }

    // Build update object
    const updateData: any = {
      'assessment_stats.last_activity': new Date()
    };

    if (reviewed_count !== undefined) {
      updateData['assessment_stats.reviewed_count'] = reviewed_count;
    }

    if (completed_count !== undefined) {
      updateData['assessment_stats.completed_count'] = completed_count;
    }

    // Update user stats
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('assessment_stats role full_name');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({
      message: 'Assessment statistics updated successfully',
      user: {
        id: user._id,
        name: `${user.full_name.first} ${user.full_name.last}`,
        role: user.role
      },
      assessment_stats: user.assessment_stats
    });
  } catch (error) {
    console.error('Update assessment stats error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Reset assessment statistics (admin only)
 * @route POST /api/assessments/reset-stats/:userId
 */
export const resetAssessmentStats = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { userId } = req.params;
    const requesterId = req.user?.id;
    const requesterRole = req.user?.role;

    if (!requesterId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Only admin can reset stats
    if (requesterRole !== 'admin') {
      return res.status(403).json({ 
        message: 'Only administrators can reset assessment statistics' 
      });
    }

    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Reset user stats
    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          'assessment_stats.reviewed_count': 0,
          'assessment_stats.completed_count': 0,
          'assessment_stats.last_activity': new Date()
        }
      },
      { new: true, runValidators: true }
    ).select('assessment_stats role full_name');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({
      message: 'Assessment statistics reset successfully',
      user: {
        id: user._id,
        name: `${user.full_name.first} ${user.full_name.last}`,
        role: user.role
      },
      assessment_stats: user.assessment_stats
    });
  } catch (error) {
    console.error('Reset assessment stats error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get top performers (admin/director only)
 * @route GET /api/assessments/top-performers
 */
export const getTopPerformers = async (req: Request, res: Response): Promise<Response> => {
  try {
    const requesterId = req.user?.id;
    const requesterRole = req.user?.role;
    const requesterCounty = req.user?.county;

    if (!requesterId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Only admin and county directors can view top performers
    if (requesterRole !== 'admin' && requesterRole !== 'county_director') {
      return res.status(403).json({ 
        message: 'Only administrators and county directors can view top performers' 
      });
    }

    const { role, limit = 10 } = req.query;
    const limitNum = parseInt(limit as string, 10);

    // Build query
    const query: any = {
      $or: [
        { 'assessment_stats.reviewed_count': { $gt: 0 } },
        { 'assessment_stats.completed_count': { $gt: 0 } }
      ]
    };

    // Filter by role if specified
    if (role && ['medical_officer', 'county_director'].includes(role as string)) {
      query.role = role;
    }

    // County directors can only see users in their county
    if (requesterRole === 'county_director') {
      query.county = requesterCounty;
    }

    // Get top performers
    const topPerformers = await User.find(query)
      .select('full_name role county assessment_stats')
      .sort({
        'assessment_stats.completed_count': -1,
        'assessment_stats.reviewed_count': -1
      })
      .limit(limitNum);

    // Format response
    const formattedPerformers = topPerformers.map(user => ({
      id: user._id,
      name: `${user.full_name.first} ${user.full_name.last}`,
      role: user.role,
      county: user.county,
      stats: user.assessment_stats || {
        reviewed_count: 0,
        completed_count: 0,
        last_activity: new Date()
      }
    }));

    return res.status(200).json({
      top_performers: formattedPerformers,
      total: formattedPerformers.length,
      filters: {
        role: role || 'all',
        county: requesterRole === 'county_director' ? requesterCounty : 'all'
      }
    });
  } catch (error) {
    console.error('Get top performers error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};