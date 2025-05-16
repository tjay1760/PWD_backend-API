import express from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import assessmentRoutes from './assessmentRoutes';
import uploadRoutes from './uploadRoutes';
import feedbackRoutes from './feedbackRoutes';
import reportRoutes from './reportRoutes';

const router = express.Router();

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API is running' });
});

// API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/assessments', assessmentRoutes);
router.use('/files', uploadRoutes);
router.use('/feedback', feedbackRoutes);
router.use('/reports', reportRoutes);

export default router;