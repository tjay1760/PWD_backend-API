import { Request, Response } from 'express';
import { body } from 'express-validator';
import Feedback from '../models/Feedback';
import { AppError } from '../middleware/error';

// Validation rules
export const submitFeedbackValidation = [
  body('content').notEmpty().withMessage('Feedback content is required')
];

/**
 * Submit feedback
 * @route POST /api/feedback
 */
export const submitFeedback = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { content } = req.body;
    const userId = req.user?.id;

    // Create feedback object
    const feedbackData: any = {
      content
    };

    // Add user ID if authenticated
    if (userId) {
      feedbackData.user_id = userId;
    }

    // Save feedback
    const feedback = await Feedback.create(feedbackData);

    return res.status(201).json({
      message: 'Feedback submitted successfully',
      feedbackId: feedback._id
    });
  } catch (error) {
    console.error('Submit feedback error:', error);
    return res.status(500).json({ message: 'Server error during feedback submission' });
  }
};

/**
 * Get all feedback (admin only)
 * @route GET /api/feedback
 */
export const getAllFeedback = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userRole = req.user?.role;

    if (userRole !== 'admin') {
      return res.status(403).json({ message: 'Only administrators can access all feedback' });
    }

    // Get pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Get feedback with user details if available
    const feedback = await Feedback.find()
      .populate('user_id', 'full_name role')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await Feedback.countDocuments();

    // Format feedback data
    const formattedFeedback = feedback.map(item => ({
      id: item._id,
      content: item.content,
      submittedBy: item.user_id 
        ? {
            id: item.user_id,
            name: `${(item.user_id as any).full_name.first} ${(item.user_id as any).full_name.last}`,
            role: (item.user_id as any).role
          }
        : 'Anonymous',
      createdAt: item.created_at
    }));

    return res.status(200).json({
      feedback: formattedFeedback,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get all feedback error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};