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
    res.on('finish', () => {
      const user = (req as any).user;

      if (user) {
        AuditLog.create({
          user_id: user.id,
          action,
          description: `${req.method} ${req.originalUrl} - Status: ${res.statusCode}`,
          ip_address: req.ip || req.socket.remoteAddress || '',
          timestamp: new Date(),
        }).catch((err) => {
          console.error('Error creating audit log:', err);
        });
      }
    });

    next();
  };
};
