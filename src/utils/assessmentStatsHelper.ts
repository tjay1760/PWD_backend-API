import User from '../models/User';
import Assessment from '../models/Assessment';
import { logger } from './logger';

/**
 * Increment reviewed count for a medical officer
 */
export const incrementReviewedCount = async (officerId: string): Promise<void> => {
  try {
    await User.findByIdAndUpdate(
      officerId,
      {
        $inc: { 'assessment_stats.reviewed_count': 1 },
        $set: { 'assessment_stats.last_activity': new Date() }
      },
      { upsert: false }
    );
    
    logger.info(`Incremented reviewed count for officer: ${officerId}`);
  } catch (error) {
    logger.error(`Error incrementing reviewed count for officer ${officerId}:`, error);
  }
};

/**
 * Increment completed count for a county director
 */
export const incrementCompletedCount = async (directorId: string): Promise<void> => {
  try {
    await User.findByIdAndUpdate(
      directorId,
      {
        $inc: { 'assessment_stats.completed_count': 1 },
        $set: { 'assessment_stats.last_activity': new Date() }
      },
      { upsert: false }
    );
    
    logger.info(`Incremented completed count for director: ${directorId}`);
  } catch (error) {
    logger.error(`Error incrementing completed count for director ${directorId}:`, error);
  }
};

/**
 * Recalculate assessment statistics for a user
 */
export const recalculateUserStats = async (userId: string): Promise<void> => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    let reviewedCount = 0;
    let completedCount = 0;

    if (user.role === 'medical_officer') {
      // Count reviewed assessments
      const reviewedAssessments = await Assessment.find({
        'medical_officer_entries': {
          $elemMatch: {
            'officer_id': userId,
            'reviewed': true
          }
        }
      });
      reviewedCount = reviewedAssessments.length;
    }

    if (user.role === 'county_director') {
      // Count completed assessments (approved by this director)
      const completedAssessments = await Assessment.find({
        'director_review.director_id': userId,
        'status': 'approved'
      });
      completedCount = completedAssessments.length;
    }

    // Update user stats
    await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          'assessment_stats.reviewed_count': reviewedCount,
          'assessment_stats.completed_count': completedCount,
          'assessment_stats.last_activity': new Date()
        }
      }
    );

    logger.info(`Recalculated stats for user ${userId}: reviewed=${reviewedCount}, completed=${completedCount}`);
  } catch (error) {
    logger.error(`Error recalculating stats for user ${userId}:`, error);
  }
};

/**
 * Initialize assessment stats for existing users
 */
export const initializeAssessmentStats = async (): Promise<void> => {
  try {
    // Find users without assessment_stats
    const usersWithoutStats = await User.find({
      $or: [
        { assessment_stats: { $exists: false } },
        { assessment_stats: null }
      ],
      role: { $in: ['medical_officer', 'county_director'] }
    });

    logger.info(`Found ${usersWithoutStats.length} users without assessment stats`);

    // Initialize stats for each user
    for (const user of usersWithoutStats) {
      await User.findByIdAndUpdate(
        user._id,
        {
          $set: {
            'assessment_stats.reviewed_count': 0,
            'assessment_stats.completed_count': 0,
            'assessment_stats.last_activity': new Date()
          }
        }
      );
    }

    logger.info(`Initialized assessment stats for ${usersWithoutStats.length} users`);
  } catch (error) {
    logger.error('Error initializing assessment stats:', error);
  }
};

/**
 * Batch recalculate stats for all users
 */
export const batchRecalculateStats = async (): Promise<void> => {
  try {
    const users = await User.find({
      role: { $in: ['medical_officer', 'county_director'] }
    }).select('_id role');

    logger.info(`Starting batch recalculation for ${users.length} users`);

    for (const user of users) {
      await recalculateUserStats(user._id.toString());
    }

    logger.info('Batch recalculation completed');
  } catch (error) {
    logger.error('Error in batch recalculation:', error);
  }
};