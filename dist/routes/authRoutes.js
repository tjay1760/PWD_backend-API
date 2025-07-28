"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const audit_1 = require("../middleware/audit");
const router = express_1.default.Router();
// Register a new user
router.post('/register', (0, validation_1.validate)(authController_1.registerValidation), (0, audit_1.auditLog)('user_register'), authController_1.register);
// Login
router.post('/login', (0, validation_1.validate)(authController_1.loginValidation), (0, audit_1.auditLog)('user_login'), authController_1.login);
// Refresh token
router.post('/refresh-token', authController_1.refreshToken);
// Logout
router.post('/logout', (0, audit_1.auditLog)('user_logout'), authController_1.logout);
// Reset password (send reset email)
router.post('/reset-password', (0, validation_1.validate)(authController_1.resetPasswordValidation), authController_1.resetPassword);
// Change password (for logged in user)
router.post('/change-password', auth_1.authenticate, (0, validation_1.validate)(authController_1.changePasswordValidation), (0, audit_1.auditLog)('password_change'), authController_1.changePassword);
exports.default = router;
