"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userController_1 = require("../controllers/userController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const audit_1 = require("../middleware/audit");
const router = express_1.default.Router();
// Get current user profile
router.get('/me', auth_1.authenticate, userController_1.getCurrentUser);
// Update user profile
router.put('/update-profile', auth_1.authenticate, (0, validation_1.validate)(userController_1.updateProfileValidation), (0, audit_1.auditLog)('profile_update'), userController_1.updateProfile);
// Get user by ID
router.get('/:userId', auth_1.authenticate, auth_1.restrictToCounty, userController_1.getUserById);
// Register a PWD by guardian
router.post('/pwds/register', auth_1.authenticate, (0, auth_1.authorize)(['guardian']), (0, audit_1.auditLog)('pwd_register'), userController_1.registerPWD);
// Get PWDs registered by a guardian
router.get('/guardians/my-pwds', auth_1.authenticate, (0, auth_1.authorize)(['guardian']), userController_1.getGuardianPWDs);
// Approve a medical officer (for county directors)
router.put('/approve/:officerId', auth_1.authenticate, (0, auth_1.authorize)(['county_director']), auth_1.restrictToCounty, (0, audit_1.auditLog)('approve_medical_officer'), userController_1.approveMedicalOfficer);
// Admin: Manage user (enable/disable)
router.put('/manage/:userId', auth_1.authenticate, (0, auth_1.authorize)(['admin']), (0, audit_1.auditLog)('manage_user'), userController_1.manageUser);
// Admin: Assign role/permissions
router.put('/assign-role/:userId', auth_1.authenticate, (0, auth_1.authorize)(['admin']), (0, audit_1.auditLog)('assign_role'), userController_1.assignRole);
exports.default = router;
