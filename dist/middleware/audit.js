"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLog = void 0;
const AuditLog_1 = __importDefault(require("../models/AuditLog"));
/**
 * Middleware to log user activities for audit purposes
 * @param action The action being performed
 */
const auditLog = (action) => {
    return async (req, res, next) => {
        // The original response.end function
        const originalEnd = res.end;
        // Replace the response.end function with our wrapped version
        res.end = function (chunk, encoding) {
            // Call the original end function
            originalEnd.call(this, chunk, encoding);
            // Only log if user is authenticated
            if (req.user) {
                try {
                    // Create the audit log
                    AuditLog_1.default.create({
                        user_id: req.user.id,
                        action,
                        description: `${req.method} ${req.originalUrl} - Status: ${res.statusCode}`,
                        ip_address: req.ip || req.socket.remoteAddress || '',
                        timestamp: new Date()
                    }).catch((err) => {
                        console.error('Error creating audit log:', err);
                    });
                }
                catch (error) {
                    console.error('Error in audit log middleware:', error);
                }
            }
            // Return the response object
            return res;
        };
        next();
    };
};
exports.auditLog = auditLog;
