import express from 'express';
import { 
  getCurrentUser,
  updateProfile,
  getUserById,
  registerPWD,
  getGuardianPWDs,
  approveMedicalOfficer,
  manageUser,
  assignRole,
  updateProfileValidation,
  getAllMedicalOfficers
} from '../controllers/userController';
import { authenticate, authorize, restrictToCounty } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { auditLog } from '../middleware/audit';
import { UserRole } from '../types/models';

const router = express.Router();

// Get current user profile
router.get(
  '/me', 
  authenticate, 
  getCurrentUser
);

// Update user profile
router.put(
  '/update-profile', 
  authenticate, 
  validate(updateProfileValidation), 
  auditLog('profile_update'),
  updateProfile
);

// Get user by ID
router.get(
  '/:userId', 
  authenticate, 
  getUserById
);

// Register a PWD by guardian
router.post(
  '/pwds/register', 
  authenticate, 
  authorize(['guardian']), 
  auditLog('pwd_register'),
  registerPWD
);

// Get PWDs registered by a guardian
router.get(
  '/guardians/my-pwds', 
  authenticate, 
  authorize(['guardian']),
  getGuardianPWDs
);
// Get all medical officers with 
router.get(
  '/medical-officers',
  authenticate,
  authorize(['county_director']),
  getAllMedicalOfficers
);
// Approve a medical officer (for county directors)
router.put(
  '/approve/:officerId', 
  authenticate, 
  authorize(['county_director']), 
  restrictToCounty,
  auditLog('approve_medical_officer'),
  approveMedicalOfficer
);

// Admin: Manage user (enable/disable)
router.put(
  '/manage/:userId', 
  authenticate, 
  authorize(['admin']), 
  auditLog('manage_user'),
  manageUser
);

// Admin: Assign role/permissions
router.put(
  '/assign-role/:userId', 
  authenticate, 
  authorize(['admin']), 
  auditLog('assign_role'),
  assignRole
);

export default router;