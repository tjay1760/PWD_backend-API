import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface AppError extends Error {
  statusCode: number;
  isOperational: boolean;
}

/**
 * Custom error handler middleware
 */
export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): Response => {
  // Default status code and message
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  // Log error details
  logger.error({
    message: `${statusCode} - ${message}`,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    stack: err.stack
  });
  
  // Determine if this is an operational error that should be exposed to client
  const isOperational = err.isOperational !== undefined ? err.isOperational : false;
  
  // Only send error details in development
  const errorResponse = {
    status: 'error',
    message,
    ...(process.env.NODE_ENV === 'development' && !isOperational && { 
      stack: err.stack,
      details: err
    })
  };
  
  return res.status(statusCode).json(errorResponse);
};

/**
 * Middleware to handle 404 errors
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): Response => {
  return res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`
  });
};

/**
 * Custom error class for API errors
 */
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    
    // Maintain proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global promise rejection handler
 */
export const setupUnhandledRejectionHandler = (): void => {
  process.on('unhandledRejection', (reason: Error | any) => {
    logger.error('Unhandled Rejection:', reason);
    
    // In a production environment, you might want to gracefully restart the server
    if (process.env.NODE_ENV === 'production') {
      // Implement graceful shutdown logic here
      logger.error('Server will continue running, but might be in an unstable state');
    }
  });
};