"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllFeedback = exports.submitFeedback = exports.submitFeedbackValidation = void 0;
const express_validator_1 = require("express-validator");
const Feedback_1 = __importDefault(require("../models/Feedback"));
// Validation rules
exports.submitFeedbackValidation = [
    (0, express_validator_1.body)('content').notEmpty().withMessage('Feedback content is required')
];
/**
 * Submit feedback
 * @route POST /api/feedback
 */
const submitFeedback = async (req, res) => {
    try {
        const { content } = req.body;
        const userId = req.user?.id;
        // Create feedback object
        const feedbackData = {
            content
        };
        // Add user ID if authenticated
        if (userId) {
            feedbackData.user_id = userId;
        }
        // Save feedback
        const feedback = await Feedback_1.default.create(feedbackData);
        return res.status(201).json({
            message: 'Feedback submitted successfully',
            feedbackId: feedback._id
        });
    }
    catch (error) {
        console.error('Submit feedback error:', error);
        return res.status(500).json({ message: 'Server error during feedback submission' });
    }
};
exports.submitFeedback = submitFeedback;
/**
 * Get all feedback (admin only)
 * @route GET /api/feedback
 */
const getAllFeedback = async (req, res) => {
    try {
        const userRole = req.user?.role;
        if (userRole !== 'admin') {
            return res.status(403).json({ message: 'Only administrators can access all feedback' });
        }
        // Get pagination parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        // Get feedback with user details if available
        const feedback = await Feedback_1.default.find()
            .populate('user_id', 'full_name role')
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(limit);
        // Get total count for pagination
        const total = await Feedback_1.default.countDocuments();
        // Format feedback data
        const formattedFeedback = feedback.map(item => ({
            id: item._id,
            content: item.content,
            submittedBy: item.user_id
                ? {
                    id: item.user_id,
                    name: `${item.user_id.full_name.first} ${item.user_id.full_name.last}`,
                    role: item.user_id.role
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
    }
    catch (error) {
        console.error('Get all feedback error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.getAllFeedback = getAllFeedback;
