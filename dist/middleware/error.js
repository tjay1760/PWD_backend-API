"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupUnhandledRejectionHandler = exports.AppError = exports.notFoundHandler = exports.errorHandler = void 0;
const logger_1 = require("../utils/logger");
/**
 * Custom error handler middleware
 */
const errorHandler = (err, req, res, next) => {
    // Default status code and message
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    // Log error details
    logger_1.logger.error({
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
exports.errorHandler = errorHandler;
/**
 * Middleware to handle 404 errors
 */
const notFoundHandler = (req, res, next) => {
    return res.status(404).json({
        status: 'error',
        message: `Route ${req.originalUrl} not found`
    });
};
exports.notFoundHandler = notFoundHandler;
/**
 * Custom error class for API errors
 */
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        // Maintain proper stack trace for where our error was thrown
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
/**
 * Global promise rejection handler
 */
const setupUnhandledRejectionHandler = () => {
    process.on('unhandledRejection', (reason) => {
        logger_1.logger.error('Unhandled Rejection:', reason);
        // In a production environment, you might want to gracefully restart the server
        if (process.env.NODE_ENV === 'production') {
            // Implement graceful shutdown logic here
            logger_1.logger.error('Server will continue running, but might be in an unstable state');
        }
    });
};
exports.setupUnhandledRejectionHandler = setupUnhandledRejectionHandler;
