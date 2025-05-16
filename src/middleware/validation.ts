import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain, ValidationError } from 'express-validator';

/**
 * Middleware to validate request input
 * @param validations Array of validation chains
 */
export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Execute all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    // Check for validation errors
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    // Format validation errors
    const formattedErrors = errors.array().map((error: ValidationError) => {
      if ('param' in error) {
        return {
          field: error.param,
          message: error.msg
        };
      }
      return {
        field: 'unknown',
        message: error.msg
      };
    });

    return res.status(400).json({ 
      message: 'Validation failed', 
      errors: formattedErrors 
    });
  };
};