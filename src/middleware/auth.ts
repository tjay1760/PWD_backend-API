import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { UserRole } from '../types/models';
import User from '../models/User';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: UserRole;
        county?: string;
      };
    }
  }
}

/**
 * Middleware to authenticate user using JWT
 */
export const authenticate = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void | Response> => {
  try {
    // Get token from Authorization header
   
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Authentication token missing' });
    }

    // Verify token
    const decoded = verifyAccessToken(token);
    
    // Check if user still exists and is active
    const user = await User.findById(decoded.id).select('-password_hash');
   
    if (!user || user.status !== 'active') {
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    // Set user info in request object
    req.user = {
      id: decoded.id,
      role: decoded.role,
      county: decoded.county
    };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

/**
 * Middleware to restrict access based on user roles
 * @param roles Array of allowed roles
 */
export const authorize = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): Response | void => {
    console.log('--- Authorize middleware ---');
    console.log('Required roles:', roles);
    console.log('User:', req.user);

    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      console.warn(`Unauthorized access attempt by user ${req.user.id} with role ${req.user.role}`);
      return res.status(403).json({ 
        message: 'You do not have permission to access this resource' 
      });
    }
    next();
  };
};


/**
 * Middleware to restrict access to users in the same county
 * Used for county directors and medical officers
 */
export const restrictToCounty = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void | Response> => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Admin can access all counties
    if (req.user.role === 'admin') {
      return next();
    }

    // Get the target user or resource county
    let targetCounty: string | undefined;
    
    // If resource has a user_id or pwd_id parameter, get that user's county
    if (req.params.userId || req.params.pwdId) {
      const paramId = req.params.userId || req.params.pwdId;
      const targetUser = await User.findById(paramId).select('county');
      if (!targetUser) {
        return res.status(404).json({ message: 'Target user not found' });
      }
      targetCounty = targetUser.county;
    }
    // If checking an assessment, get the PWD's county
    else if (req.params.assessmentId) {
      // Logic to get assessment's county would go here
      // This is a placeholder
      targetCounty = req.user.county;
    }
    
    // If county doesn't match and not a system-wide role, deny access
    if (
      targetCounty && 
      req.user.county !== targetCounty && 
      !['admin', 'county_director'].includes(req.user.role)
    ) {
      return res.status(403).json({ 
        message: 'You do not have permission to access resources from another county' 
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};