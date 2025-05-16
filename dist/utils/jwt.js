"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.revokeToken = exports.verifyRefreshToken = exports.verifyAccessToken = exports.saveToken = exports.generateRefreshToken = exports.generateAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const AuthToken_1 = __importDefault(require("../models/AuthToken"));
// Secret keys
const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here';
const REFRESH_TOKEN_SECRET = `${ACCESS_TOKEN_SECRET}_refresh`;
// Token expiration
const ACCESS_TOKEN_EXPIRATION = process.env.JWT_ACCESS_EXPIRATION || '15m';
const REFRESH_TOKEN_EXPIRATION = process.env.JWT_REFRESH_EXPIRATION || '7d';
// Generate tokens
const generateAccessToken = (user) => {
    return jsonwebtoken_1.default.sign({
        id: user._id,
        role: user.role,
        county: user.county
    }, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRATION });
};
exports.generateAccessToken = generateAccessToken;
const generateRefreshToken = (user) => {
    return jsonwebtoken_1.default.sign({ id: user._id }, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRATION });
};
exports.generateRefreshToken = generateRefreshToken;
// Save token to database
const saveToken = async (userId, token, type, expiresIn) => {
    // Calculate expiration date
    const expiresInMs = ms(expiresIn);
    const expiresAt = new Date(Date.now() + expiresInMs);
    // Create new token document
    await AuthToken_1.default.create({
        user_id: userId,
        token,
        type,
        expires_at: expiresAt
    });
};
exports.saveToken = saveToken;
// Verify tokens
const verifyAccessToken = (token) => {
    try {
        return jsonwebtoken_1.default.verify(token, ACCESS_TOKEN_SECRET);
    }
    catch (error) {
        throw new Error('Invalid access token');
    }
};
exports.verifyAccessToken = verifyAccessToken;
const verifyRefreshToken = (token) => {
    try {
        return jsonwebtoken_1.default.verify(token, REFRESH_TOKEN_SECRET);
    }
    catch (error) {
        throw new Error('Invalid refresh token');
    }
};
exports.verifyRefreshToken = verifyRefreshToken;
// Revoke token
const revokeToken = async (token) => {
    await AuthToken_1.default.deleteOne({ token });
};
exports.revokeToken = revokeToken;
// Helper function to convert time strings like '15m', '1h', '7d' to milliseconds
function ms(val) {
    const regex = /^(\d+)([smhdw])$/;
    const match = val.match(regex);
    if (!match)
        return 0;
    const num = parseInt(match[1], 10);
    const type = match[2];
    switch (type) {
        case 's': return num * 1000;
        case 'm': return num * 1000 * 60;
        case 'h': return num * 1000 * 60 * 60;
        case 'd': return num * 1000 * 60 * 60 * 24;
        case 'w': return num * 1000 * 60 * 60 * 24 * 7;
        default: return 0;
    }
}
