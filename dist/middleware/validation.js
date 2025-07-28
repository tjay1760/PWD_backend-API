"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const express_validator_1 = require("express-validator");
/**
 * Middleware to validate request input
 * @param validations Array of validation chains
 */
const validate = (validations) => {
    return async (req, res, next) => {
        // Execute all validations
        await Promise.all(validations.map(validation => validation.run(req)));
        // Check for validation errors
        const errors = (0, express_validator_1.validationResult)(req);
        if (errors.isEmpty()) {
            return next();
        }
        // Format validation errors
        const formattedErrors = errors.array().map((error) => {
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
exports.validate = validate;
