import { Request, Response } from 'express';
import { body } from 'express-validator';
import User from '../models/User';
import { 
  generateAccessToken,
  generateRefreshToken, 
  saveToken,
  verifyRefreshToken, 
  revokeToken
} from '../utils/jwt';
import { hashPassword, comparePassword } from '../utils/password';
import { AppError } from '../middleware/error';
import { UserRole } from '../types/models';
import { auditLog } from '../middleware/audit';

// Validation rules
export const registerValidation = [
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('nationalId').notEmpty().withMessage('National ID or passport is required'),
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('gender').isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
  body('dob').isISO8601().withMessage('Valid date of birth is required'),
  body('county').notEmpty().withMessage('County is required'),
  body('subCounty').notEmpty().withMessage('Sub-county is required'),
  body('role')
    .isIn(['pwd', 'guardian', 'medical_officer', 'county_director', 'admin'])
    .withMessage('Invalid role')
];

export const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

export const resetPasswordValidation = [
  body('email').isEmail().withMessage('Valid email is required')
];

export const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
];

/**
 * Register a new user
 * @route POST /api/auth/register
 */
export const register = async (req: Request, res: Response): Promise<Response> => {
  try {
    const {
      firstName,
      middleName,
      lastName,
      email,
      nationalId,
      birthCertificateNumber,
      gender,
      dob,
      phone,
      maritalStatus,
      occupation,
      educationDetails,
      county,
      subCounty,
      role,
      password,
      nextOfKin,
      medicalLicenceNumber,
      speciality,
      countyOfPractice,
      medicalFacility,
      directorInfo
    } = req.body;
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { 'contact.email': email },
        { national_id_or_passport: nationalId }
      ]
    });

    if (existingUser) {
      return res.status(400).json({
        message: 'User with this email or national ID already exists'
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user object based on role
    const userData: any = {
      full_name: {
        first: firstName,
        middle: middleName,
        last: lastName
      },
      national_id_or_passport: nationalId,
      birth_certificate_number: birthCertificateNumber,
      gender,
      dob: new Date(dob),
      contact: {
        email,
        phone
      },
      marital_status: maritalStatus,
      occupation,
      education_details: educationDetails,
      county,
      sub_county: subCounty,
      role,
      password_hash: passwordHash,
      status: 'active'
    };

    // Add role-specific fields
    if (role === 'pwd' || role === 'guardian') {
      userData.next_of_kin = nextOfKin;
    }

    if (role === 'medical_officer') {
      userData.medical_info = {
        license_number: medicalLicenceNumber,
        specialty: speciality,
        county_of_practice: countyOfPractice,
        approved_by_director: false
      };
    }

    if (role === 'county_director') {
      userData.director_info = {
        approved_medical_officers: []
      };
    }

    if (role === 'admin') {
      userData.system_admin_info = {
        permissions: ['manage_users', 'manage_roles', 'view_logs', 'generate_reports']
      };
    }

    // Create new user
    const user = await User.create(userData);

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token to database
    await saveToken(
      user._id.toString(), 
      refreshToken, 
      'refresh', 
      process.env.JWT_REFRESH_EXPIRATION || '7d'
    );

    // Return user data and tokens
    return res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        fullName: `${user.full_name.first} ${user.full_name.last}`,
        email: user.contact.email,
        role: user.role,
        county: user.county
      },
      tokens: {
        access: accessToken,
        refresh: refreshToken
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Server error during registration' });
  }
};

/**
 * Login a user
 * @route POST /api/auth/login
 */
export const login = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ 'contact.email': email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(401).json({ message: 'Account is disabled. Contact administrator.' });
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token to database
    await saveToken(
      user._id.toString(), 
      refreshToken, 
      'refresh', 
      process.env.JWT_REFRESH_EXPIRATION || '7d'
    );

    // Return user data and tokens
    return res.status(200).json({
      message: 'Login successful',
      user: {
        id: user._id,
        fullName: `${user.full_name.first} ${user.full_name.last}`,
        email: user.contact.email,
        role: user.role,
        county: user.county
      },
      tokens: {
        access: accessToken,
        refresh: refreshToken
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error during login' });
  }
};

/**
 * Refresh access token
 * @route POST /api/auth/refresh-token
 */
export const refreshToken = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);

    // Find user
    const user = await User.findById(payload.id);
    if (!user || user.status !== 'active') {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(user);

    return res.status(200).json({
      message: 'Token refreshed successfully',
      accessToken: newAccessToken
    });
  } catch (error) {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
};

/**
 * Logout a user by revoking refresh token
 * @route POST /api/auth/logout
 */
export const logout = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    // Revoke refresh token
    await revokeToken(refreshToken);

    return res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ message: 'Server error during logout' });
  }
};

/**
 * Reset password (send reset email)
 * @route POST /api/auth/reset-password
 */
export const resetPassword = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ 'contact.email': email });
    if (!user) {
      // Return success even if user not found for security
      return res.status(200).json({
        message: 'If your email is registered, you will receive password reset instructions'
      });
    }

    // In a real application, you would:
    // 1. Generate a password reset token
    // 2. Save it to the database with expiration
    // 3. Send an email with reset link

    // For now, just return success
    return res.status(200).json({
      message: 'If your email is registered, you will receive password reset instructions'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ message: 'Server error during password reset' });
  }
};

/**
 * Change password for logged in user
 * @route POST /api/auth/change-password
 */
export const changePassword = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isPasswordValid = await comparePassword(currentPassword, user.password_hash);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    user.password_hash = newPasswordHash;
    await user.save();

    return res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ message: 'Server error during password change' });
  }
};