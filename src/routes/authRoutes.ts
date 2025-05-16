import express from 'express';
import { 
  register, 
  login, 
  refreshToken, 
  logout, 
  resetPassword, 
  changePassword,
  registerValidation,
  loginValidation,
  resetPasswordValidation,
  changePasswordValidation
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { auditLog } from '../middleware/audit';

const router = express.Router();

// Register a new user
router.post(
  '/register', 
  validate(registerValidation), 
  auditLog('user_register'),
  register
);

// Login
router.post(
  '/login', 
  validate(loginValidation), 
  auditLog('user_login'),
  login
);

// Refresh token
router.post('/refresh-token', refreshToken);

// Logout
router.post(
  '/logout', 
  auditLog('user_logout'),
  logout
);

// Reset password (send reset email)
router.post(
  '/reset-password', 
  validate(resetPasswordValidation), 
  resetPassword
);

// Change password (for logged in user)
router.post(
  '/change-password', 
  authenticate, 
  validate(changePasswordValidation), 
  auditLog('password_change'),
  changePassword
);

export default router;