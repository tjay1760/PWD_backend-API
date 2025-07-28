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
        res.on('finish', () => {
            const user = req.user;
            if (user) {
                AuditLog_1.default.create({
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
exports.auditLog = auditLog;
