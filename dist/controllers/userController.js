"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignRole = exports.manageUser = exports.approveMedicalOfficer = exports.getGuardianPWDs = exports.registerPWD = exports.getUserById = exports.updateProfile = exports.getCurrentUser = exports.updateProfileValidation = void 0;
const express_validator_1 = require("express-validator");
const mongoose_1 = __importDefault(require("mongoose"));
const User_1 = __importDefault(require("../models/User"));
const password_1 = require("../utils/password");
// Validation rules
exports.updateProfileValidation = [
    (0, express_validator_1.body)('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
    (0, express_validator_1.body)('lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
    (0, express_validator_1.body)('phone').optional().notEmpty().withMessage('Phone cannot be empty'),
    (0, express_validator_1.body)('maritalStatus').optional().isIn(['single', 'married', 'divorced', 'widowed', 'other']).withMessage('Invalid marital status'),
    (0, express_validator_1.body)('occupation').optional(),
    (0, express_validator_1.body)('educationDetails').optional(),
    (0, express_validator_1.body)('nextOfKin').optional().isObject().withMessage('Next of kin must be an object')
];
/**
 * Get current user profile
 * @route GET /api/users/me
 */
const getCurrentUser = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        // Find user excluding password hash
        const user = await User_1.default.findById(userId).select('-password_hash');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        return res.status(200).json({
            user: {
                id: user._id,
                fullName: `${user.full_name.first} ${user.full_name.middle ? user.full_name.middle + ' ' : ''}${user.full_name.last}`,
                email: user.contact.email,
                phone: user.contact.phone,
                nationalId: user.national_id_or_passport,
                gender: user.gender,
                dob: user.dob,
                maritalStatus: user.marital_status,
                occupation: user.occupation,
                educationDetails: user.education_details,
                county: user.county,
                subCounty: user.sub_county,
                role: user.role,
                nextOfKin: user.next_of_kin,
                guardianFor: user.guardian_for,
                medicalInfo: user.medical_info,
                directorInfo: user.director_info,
                status: user.status,
                createdAt: user.created_at
            }
        });
    }
    catch (error) {
        console.error('Get current user error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.getCurrentUser = getCurrentUser;
/**
 * Update user profile
 * @route PUT /api/users/update-profile
 */
const updateProfile = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        // Find user
        const user = await User_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const { firstName, middleName, lastName, phone, maritalStatus, occupation, educationDetails, nextOfKin } = req.body;
        // Update user fields if provided
        if (firstName)
            user.full_name.first = firstName;
        if (middleName !== undefined)
            user.full_name.middle = middleName;
        if (lastName)
            user.full_name.last = lastName;
        if (phone)
            user.contact.phone = phone;
        if (maritalStatus)
            user.marital_status = maritalStatus;
        if (occupation !== undefined)
            user.occupation = occupation;
        if (educationDetails !== undefined)
            user.education_details = educationDetails;
        // Update next of kin if provided
        if (nextOfKin && (user.role === 'pwd' || user.role === 'guardian')) {
            user.next_of_kin = {
                name: nextOfKin.name || user.next_of_kin?.name || '',
                relationship: nextOfKin.relationship || user.next_of_kin?.relationship || '',
                phone: nextOfKin.phone || user.next_of_kin?.phone || ''
            };
        }
        // Update medical info if provided and user is a medical officer
        if (user.role === 'medical_officer' && req.body.medicalInfo) {
            const { specialty } = req.body.medicalInfo;
            if (specialty)
                user.medical_info.specialty = specialty;
        }
        // Save updated user
        await user.save();
        return res.status(200).json({
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                fullName: `${user.full_name.first} ${user.full_name.middle ? user.full_name.middle + ' ' : ''}${user.full_name.last}`,
                email: user.contact.email,
                phone: user.contact.phone,
                role: user.role,
                maritalStatus: user.marital_status,
                occupation: user.occupation,
                educationDetails: user.education_details,
                nextOfKin: user.next_of_kin,
                medicalInfo: user.medical_info
            }
        });
    }
    catch (error) {
        console.error('Update profile error:', error);
        return res.status(500).json({ message: 'Server error during profile update' });
    }
};
exports.updateProfile = updateProfile;
/**
 * Get user by ID
 * @route GET /api/users/:userId
 */
const getUserById = async (req, res) => {
    try {
        const { userId } = req.params;
        // Validate MongoDB ID
        if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }
        // Find user excluding password hash
        const user = await User_1.default.findById(userId).select('-password_hash');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Restrict sensitive information based on role
        const userResponse = {
            id: user._id,
            fullName: `${user.full_name.first} ${user.full_name.middle ? user.full_name.middle + ' ' : ''}${user.full_name.last}`,
            gender: user.gender,
            county: user.county,
            subCounty: user.sub_county,
            role: user.role,
            status: user.status
        };
        // Add role-specific fields
        if (req.user?.role === 'admin' ||
            req.user?.role === 'county_director' ||
            req.user?.id === userId) {
            Object.assign(userResponse, {
                email: user.contact.email,
                phone: user.contact.phone,
                nationalId: user.national_id_or_passport,
                dob: user.dob,
                maritalStatus: user.marital_status,
                occupation: user.occupation,
                educationDetails: user.education_details,
                createdAt: user.created_at
            });
            if (user.role === 'pwd' || user.role === 'guardian') {
                Object.assign(userResponse, {
                    nextOfKin: user.next_of_kin
                });
            }
            if (user.role === 'medical_officer') {
                Object.assign(userResponse, {
                    medicalInfo: user.medical_info
                });
            }
        }
        return res.status(200).json({ user: userResponse });
    }
    catch (error) {
        console.error('Get user by ID error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.getUserById = getUserById;
/**
 * Register a PWD by guardian
 * @route POST /api/pwds/register
 */
const registerPWD = async (req, res) => {
    try {
        const guardianId = req.user?.id;
        const guardianRole = req.user?.role;
        if (!guardianId) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        if (guardianRole !== 'guardian') {
            return res.status(403).json({ message: 'Only guardians can register PWDs' });
        }
        const guardian = await User_1.default.findById(guardianId);
        if (!guardian) {
            return res.status(404).json({ message: 'Guardian not found' });
        }
        const { firstName, middleName, lastName, birthCertificateNumber, gender, dob, educationDetails, disability } = req.body;
        // Create a temporary password for the PWD
        const temporaryPassword = Math.random().toString(36).slice(-8);
        const passwordHash = await (0, password_1.hashPassword)(temporaryPassword);
        // Create PWD user
        const pwdUser = await User_1.default.create({
            full_name: {
                first: firstName,
                middle: middleName,
                last: lastName
            },
            birth_certificate_number: birthCertificateNumber,
            gender,
            dob: new Date(dob),
            contact: {
                email: `pwd_${Date.now()}@placeholder.com`, // Placeholder email
                phone: guardian.contact.phone // Use guardian's phone
            },
            education_details: educationDetails,
            county: guardian.county,
            sub_county: guardian.sub_county,
            role: 'pwd',
            password_hash: passwordHash,
            next_of_kin: {
                name: `${guardian.full_name.first} ${guardian.full_name.last}`,
                relationship: 'Guardian',
                phone: guardian.contact.phone
            },
            status: 'active'
        });
        // Update guardian to link to the PWD
        await User_1.default.findByIdAndUpdate(guardianId, {
            $push: { guardian_for: pwdUser._id }
        });
        return res.status(201).json({
            message: 'PWD registered successfully',
            pwd: {
                id: pwdUser._id,
                fullName: `${pwdUser.full_name.first} ${pwdUser.full_name.last}`,
                birthCertificateNumber: pwdUser.birth_certificate_number,
                gender: pwdUser.gender,
                dob: pwdUser.dob
            },
            temporaryPassword
        });
    }
    catch (error) {
        console.error('Register PWD error:', error);
        return res.status(500).json({ message: 'Server error during PWD registration' });
    }
};
exports.registerPWD = registerPWD;
/**
 * Get PWDs registered by a guardian
 * @route GET /api/guardians/my-pwds
 */
const getGuardianPWDs = async (req, res) => {
    try {
        const guardianId = req.user?.id;
        const guardianRole = req.user?.role;
        if (!guardianId) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        if (guardianRole !== 'guardian') {
            return res.status(403).json({ message: 'Only guardians can access this endpoint' });
        }
        // Find guardian with populated PWD references
        const guardian = await User_1.default.findById(guardianId).populate('guardian_for');
        if (!guardian) {
            return res.status(404).json({ message: 'Guardian not found' });
        }
        // Map PWDs to return only necessary information
        const pwds = guardian.guardian_for?.map(pwd => {
            const pwdDoc = pwd;
            return {
                id: pwdDoc._id,
                fullName: `${pwdDoc.full_name.first} ${pwdDoc.full_name.middle ? pwdDoc.full_name.middle + ' ' : ''}${pwdDoc.full_name.last}`,
                birthCertificateNumber: pwdDoc.birth_certificate_number,
                gender: pwdDoc.gender,
                dob: pwdDoc.dob
            };
        });
        return res.status(200).json({ pwds });
    }
    catch (error) {
        console.error('Get guardian PWDs error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.getGuardianPWDs = getGuardianPWDs;
/**
 * Approve a medical officer (for county directors)
 * @route PUT /api/users/approve/:officerId
 */
const approveMedicalOfficer = async (req, res) => {
    try {
        const { officerId } = req.params;
        const directorId = req.user?.id;
        const directorRole = req.user?.role;
        const directorCounty = req.user?.county;
        if (!directorId) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        if (directorRole !== 'county_director') {
            return res.status(403).json({ message: 'Only county directors can approve medical officers' });
        }
        // Validate MongoDB ID
        if (!mongoose_1.default.Types.ObjectId.isValid(officerId)) {
            return res.status(400).json({ message: 'Invalid officer ID' });
        }
        // Find medical officer
        const medicalOfficer = await User_1.default.findById(officerId);
        if (!medicalOfficer) {
            return res.status(404).json({ message: 'Medical officer not found' });
        }
        // Check if user is a medical officer
        if (medicalOfficer.role !== 'medical_officer') {
            return res.status(400).json({ message: 'User is not a medical officer' });
        }
        // Ensure officer is in the same county as director
        if (medicalOfficer.medical_info?.county_of_practice !== directorCounty) {
            return res.status(403).json({ message: 'You can only approve medical officers in your county' });
        }
        // Update medical officer's approval status
        medicalOfficer.medical_info.approved_by_director = true;
        await medicalOfficer.save();
        // Add to director's approved officers list
        await User_1.default.findByIdAndUpdate(directorId, {
            $addToSet: { 'director_info.approved_medical_officers': officerId }
        });
        return res.status(200).json({
            message: 'Medical officer approved successfully',
            officerId: medicalOfficer._id,
            officerName: `${medicalOfficer.full_name.first} ${medicalOfficer.full_name.last}`
        });
    }
    catch (error) {
        console.error('Approve medical officer error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.approveMedicalOfficer = approveMedicalOfficer;
/**
 * Admin: Manage user (enable/disable)
 * @route PUT /api/users/manage/:userId
 */
const manageUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { status } = req.body;
        const adminId = req.user?.id;
        const adminRole = req.user?.role;
        if (!adminId) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        if (adminRole !== 'admin') {
            return res.status(403).json({ message: 'Only administrators can manage users' });
        }
        // Validate status
        if (status !== 'active' && status !== 'disabled') {
            return res.status(400).json({ message: 'Invalid status value' });
        }
        // Validate MongoDB ID
        if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }
        // Find user
        const user = await User_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Prevent disabling self
        if (userId === adminId) {
            return res.status(400).json({ message: 'Cannot modify your own account status' });
        }
        // Update user status
        user.status = status;
        await user.save();
        return res.status(200).json({
            message: `User ${status === 'active' ? 'activated' : 'disabled'} successfully`,
            userId: user._id,
            userName: `${user.full_name.first} ${user.full_name.last}`,
            status: user.status
        });
    }
    catch (error) {
        console.error('Manage user error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.manageUser = manageUser;
/**
 * Admin: Assign role/permissions
 * @route PUT /api/users/assign-role/:userId
 */
const assignRole = async (req, res) => {
    try {
        const { userId } = req.params;
        const { role, permissions } = req.body;
        const adminId = req.user?.id;
        const adminRole = req.user?.role;
        if (!adminId) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        if (adminRole !== 'admin') {
            return res.status(403).json({ message: 'Only administrators can assign roles' });
        }
        // Validate role
        const validRoles = ['pwd', 'guardian', 'medical_officer', 'county_director', 'admin'];
        if (role && !validRoles.includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }
        // Validate MongoDB ID
        if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }
        // Find user
        const user = await User_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Prevent changing own role
        if (userId === adminId) {
            return res.status(400).json({ message: 'Cannot modify your own role' });
        }
        // Update user role if provided
        if (role) {
            user.role = role;
        }
        // Update admin permissions if provided and user is admin
        if (permissions && (user.role === 'admin' || role === 'admin')) {
            if (!user.system_admin_info) {
                user.system_admin_info = {
                    permissions: []
                };
            }
            user.system_admin_info.permissions = permissions;
        }
        // Save updates
        await user.save();
        return res.status(200).json({
            message: 'User role and permissions updated successfully',
            userId: user._id,
            userName: `${user.full_name.first} ${user.full_name.last}`,
            role: user.role,
            permissions: user.system_admin_info?.permissions || []
        });
    }
    catch (error) {
        console.error('Assign role error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.assignRole = assignRole;
