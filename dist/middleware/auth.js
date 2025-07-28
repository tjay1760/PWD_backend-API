"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.restrictToCounty = exports.authorize = exports.authenticate = void 0;
const jwt_1 = require("../utils/jwt");
const User_1 = __importDefault(require("../models/User"));
/**
 * Middleware to authenticate user using JWT
 */
const authenticate = async (req, res, next) => {
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
        const decoded = (0, jwt_1.verifyAccessToken)(token);
        // Check if user still exists and is active
        const user = await User_1.default.findById(decoded.id).select('-password_hash');
        if (!user || user.status !== 'active') {
            return res.status(401).json({ message: 'User not found or inactive' });
        }
        // Set user info in request object
        req.user = {
            id: decoded.id,
            role: decoded.role,
            county: decoded.county
        };
        console.log(`User ${req.user.id} authenticated with role ${req.user.role}`);
        next();
    }
    catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};
exports.authenticate = authenticate;
/**
 * Middleware to restrict access based on user roles
 * @param roles Array of allowed roles
 */
const authorize = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        if (!roles.includes(req.user.role)) {
            console.warn(`Unauthorized access attempt by user ${req.user.id} with role ${req.user.role}`);
            return res.status(403).json({
                message: 'You do not have permission to access this resource'
            });
        }
        console.log(`User ${req.user.id} with role ${req.user.role} authorized for this route`);
        next();
    };
};
exports.authorize = authorize;
/**
 * Middleware to restrict access to users in the same county
 * Used for county directors and medical officers
 */
const restrictToCounty = async (req, res, next) => {
    try {
        console.log(`Checking county access for user ${req.user?.id}`);
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        // Admin can access all counties
        if (req.user.role === 'admin') {
            return next();
        }
        // Get the target user or resource county
        let targetCounty;
        // If resource has a user_id or pwd_id parameter, get that user's county
        if (req.params.userId || req.params.pwdId) {
            const paramId = req.params.userId || req.params.pwdId;
            const targetUser = await User_1.default.findById(paramId).select('county');
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
        if (targetCounty &&
            req.user.county !== targetCounty &&
            !['admin', 'county_director'].includes(req.user.role)) {
            return res.status(403).json({
                message: 'You do not have permission to access resources from another county'
            });
        }
        next();
    }
    catch (error) {
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.restrictToCounty = restrictToCounty;
