import { Request, Response, NextFunction } from 'express';
import AuditLog from '../models/AuditLog';

/**
 * Middleware to log user activities for audit purposes
 * @param action The action being performed
 */
export const auditLog = (action: string) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    // The original response.end function
    const originalEnd = res.end;
    
    // Replace the response.end function with our wrapped version
    res.end = function(chunk?: any, encoding?: string): Response {
      // Call the original end function
      originalEnd.call(this, chunk, encoding);
      
      // Only log if user is authenticated
      if (req.user) {
        try {
          // Create the audit log
          AuditLog.create({
            user_id: req.user.id,
            action,
            description: `${req.method} ${req.originalUrl} - Status: ${res.statusCode}`,
            ip_address: req.ip || req.socket.remoteAddress || '',
            timestamp: new Date()
          }).catch((err) => {
            console.error('Error creating audit log:', err);
          });
        } catch (error) {
          console.error('Error in audit log middleware:', error);
        }
      }
      
      // Return the response object
      return res;
    };
    
    next();
  };
};