import { Request, Response } from "express";
import { body, param } from "express-validator";
import mongoose from "mongoose";
import User from "../models/User";
import { hashPassword } from "../utils/password";
import { AppError } from "../middleware/error";
import { UserRole } from "../types/models";
import { auditLog } from "../middleware/audit";

// Validation rules
export const updateProfileValidation = [
  body("firstName")
    .optional()
    .notEmpty()
    .withMessage("First name cannot be empty"),
  body("lastName")
    .optional()
    .notEmpty()
    .withMessage("Last name cannot be empty"),
  body("phone").optional().notEmpty().withMessage("Phone cannot be empty"),
  body("maritalStatus")
    .optional()
    .isIn(["single", "married", "divorced", "widowed", "other"])
    .withMessage("Invalid marital status"),
  body("occupation").optional(),
  body("educationDetails").optional(),
  body("nextOfKin")
    .optional()
    .isObject()
    .withMessage("Next of kin must be an object"),
];

/**
 * Get current user profile
 * @route GET /api/users/me
 */
export const getCurrentUser = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Find user excluding password hash
    const user = await User.findById(userId).select("-password_hash");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      user: {
        id: user._id,
        fullName: `${user.full_name.first} ${
          user.full_name.middle ? user.full_name.middle + " " : ""
        }${user.full_name.last}`,
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
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    console.error("Get current user error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * Update user profile
 * @route PUT /api/users/update-profile
 */
export const updateProfile = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const {
      firstName,
      middleName,
      lastName,
      phone,
      maritalStatus,
      occupation,
      educationDetails,
      nextOfKin,
    } = req.body;

    // Update user fields if provided
    if (firstName) user.full_name.first = firstName;
    if (middleName !== undefined) user.full_name.middle = middleName;
    if (lastName) user.full_name.last = lastName;
    if (phone) user.contact.phone = phone;
    if (maritalStatus) user.marital_status = maritalStatus;
    if (occupation !== undefined) user.occupation = occupation;
    if (educationDetails !== undefined)
      user.education_details = educationDetails;

    // Update next of kin if provided
    if (nextOfKin && (user.role === "pwd" || user.role === "guardian")) {
      user.next_of_kin = {
        name: nextOfKin.name || user.next_of_kin?.name || "",
        relationship:
          nextOfKin.relationship || user.next_of_kin?.relationship || "",
        phone: nextOfKin.phone || user.next_of_kin?.phone || "",
      };
    }

    // Update medical info if provided and user is a medical officer
    if (user.role === "medical_officer" && req.body.medicalInfo) {
      const { specialty } = req.body.medicalInfo;
      if (specialty) user.medical_info!.specialty = specialty;
    }

    // Save updated user
    await user.save();

    return res.status(200).json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        fullName: `${user.full_name.first} ${
          user.full_name.middle ? user.full_name.middle + " " : ""
        }${user.full_name.last}`,
        email: user.contact.email,
        phone: user.contact.phone,
        role: user.role,
        maritalStatus: user.marital_status,
        occupation: user.occupation,
        educationDetails: user.education_details,
        nextOfKin: user.next_of_kin,
        medicalInfo: user.medical_info,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return res
      .status(500)
      .json({ message: "Server error during profile update" });
  }
};

/**
 * Get user by ID
 * @route GET /api/users/:userId
 */
export const getUserById = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const userId = req.params?.userId;
    // Validate MongoDB ID

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Find user excluding password hash
    const user = await User.findById(userId).select("-password_hash");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Initialize userResponse with common fields
    const userResponse: any = { // Use 'any' or define a proper type for userResponse
      id: user._id,
      email: user.contact.email, // Always include email for admin and county director
      phone: user.contact.phone, // Always include phone for admin and county director
      nationalId: user.national_id_or_passport, // Always include for admin and county
      dob: user.dob, // Always include for admin and county director
      maritalStatus: user.marital_status, // Always include for admin and county director
      fullName: `${user.full_name.first} ${
        user.full_name.middle ? user.full_name.middle + " " : ""
      }${user.full_name.last}`,
      gender: user.gender,
      county: user.county,
      subCounty: user.sub_county,
      role: user.role,
      status: user.status,
    };

    // // CONDITIONAL ADDITION of assessment stats (Corrected Placement)
    // if (user.role === 'medical_officer' || user.role === 'county_director') {
    //   userResponse.assessmentStats = user.assessment_stats;
    // }


    // Add role-specific fields (this existing block is already correctly placed)
    if (
      req.user?.role === "admin" ||
      req.user?.role === "county_director" ||
      req.user?.id === userId
    ) {
      Object.assign(userResponse, {
        occupation: user.occupation, // Was missing from initial userResponse
        educationDetails: user.education_details, // Was missing from initial userResponse
        createdAt: user.created_at,
      });

      if (user.role === "pwd" || user.role === "guardian") {
        Object.assign(userResponse, {
          nextOfKin: user.next_of_kin,
        });
      }

      if (user.role === "medical_officer") {
        Object.assign(userResponse, {
          medicalInfo: user.medical_info,
        });
      }
    }
    return res.status(200).json({ user: userResponse });
  } catch (error) {
    console.error("Get user by ID error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * Register a PWD by guardian
 * @route POST /api/pwds/register
 */
export const registerPWD = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const guardianId = req.user?.id;
    const guardianRole = req.user?.role;

    if (!guardianId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (guardianRole !== "guardian") {
      return res
        .status(403)
        .json({ message: "Only guardians can register PWDs" });
    }

    const guardian = await User.findById(guardianId);
    if (!guardian) {
      return res.status(404).json({ message: "Guardian not found" });
    }

    const {
      firstName,
      middleName,
      lastName,
      birthCertificateNumber,
      gender,
      dateOfBirth,
      educationDetails,
      disability,
    } = req.body;

    // Create a temporary password for the PWD
    const temporaryPassword = Math.random().toString(36).slice(-8);
    const passwordHash = await hashPassword(temporaryPassword);

    // Create PWD user
    const pwdUser = await User.create({
      full_name: {
        first: firstName,
        middle: middleName,
        last: lastName,
      },
      birth_certificate_number: birthCertificateNumber,
      national_id_or_passport: birthCertificateNumber, // Use guardian's ID
      gender,
      dob: new Date(dateOfBirth),
      contact: {
        email: `pwd_${Date.now()}@placeholder.com`, // Placeholder email
        phone: guardian.contact.phone, // Use guardian's phone
      },
      education_details: educationDetails,
      county: guardian.county,
      sub_county: guardian.sub_county,
      role: "pwd",
      password_hash: passwordHash,
      next_of_kin: {
        name: `${guardian.full_name.first} ${guardian.full_name.last}`,
        relationship: "Guardian",
        phone: guardian.contact.phone,
      },
      status: "active",
    });

    // Update guardian to link to the PWD
    await User.findByIdAndUpdate(guardianId, {
      $push: { guardian_for: pwdUser._id },
    });

    return res.status(201).json({
      message: "PWD registered successfully",
      pwd: {
        id: pwdUser._id,
        fullName: `${pwdUser.full_name.first} ${pwdUser.full_name.last}`,
        birthCertificateNumber: pwdUser.birth_certificate_number,
        gender: pwdUser.gender,
        dob: pwdUser.dob,
      },
      temporaryPassword,
    });
  } catch (error) {
    console.error("Register PWD error:", error);
    return res
      .status(500)
      .json({ message: "Server error during PWD registration" });
  }
};

/**
 * Get PWDs registered by a guardian
 * @route GET /api/guardians/my-pwds
 */
export const getGuardianPWDs = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const guardianId = req.user?.id;
    const guardianRole = req.user?.role;

    if (!guardianId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (guardianRole !== "guardian") {
      return res
        .status(403)
        .json({ message: "Only guardians can access this endpoint" });
    }

    // Find guardian with populated PWD references
    const guardian = await User.findById(guardianId).populate("guardian_for");
    if (!guardian) {
      return res.status(404).json({ message: "Guardian not found" });
    }

    // Map PWDs to return only necessary information
    const pwds = guardian.guardian_for?.map((pwd) => {
      const pwdDoc = pwd as unknown as typeof User.prototype;
      return {
        id: pwdDoc._id,
        fullName: `${pwdDoc.full_name.first} ${
          pwdDoc.full_name.middle ? pwdDoc.full_name.middle + " " : ""
        }${pwdDoc.full_name.last}`,
        birthCertificateNumber: pwdDoc.birth_certificate_number,
        gender: pwdDoc.gender,
        dob: pwdDoc.dob,
      };
    });

    return res.status(200).json({ pwds });
  } catch (error) {
    console.error("Get guardian PWDs error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Get all medical officers
export const getAllMedicalOfficers = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { id: directorId, role: directorRole, county } = req.user || {};

    if (!directorId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (directorRole !== "county_director") {
      return res
        .status(403)
        .json({ message: "Only county directors can access this endpoint" });
    }

    const medicalOfficers = await User.find({
      role: "medical_officer",
      county: county,
    });

    return res.status(200).json({ medicalOfficers });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * Approve a medical officer (for county directors)
 * @route PUT /api/users/approve/:officerId
 */
export const approveMedicalOfficer = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { officerId } = req.params;
    const directorId = req.user?.id;
    const directorRole = req.user?.role;
    const directorCounty = req.user?.county;

    if (!directorId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (directorRole !== "county_director") {
      return res
        .status(403)
        .json({
          message: "Only county directors can approve medical officers",
        });
    }

    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(officerId)) {
      return res.status(400).json({ message: "Invalid officer ID" });
    }

    // Find medical officer
    const medicalOfficer = await User.findById(officerId);
    if (!medicalOfficer) {
      return res.status(404).json({ message: "Medical officer not found" });
    }

    // Check if user is a medical officer
    if (medicalOfficer.role !== "medical_officer") {
      return res.status(400).json({ message: "User is not a medical officer" });
    }

    // Ensure officer is in the same county as director
    if (medicalOfficer.county !== directorCounty) {
      return res
        .status(403)
        .json({
          message: "You can only approve medical officers in your county",
        });
    }

    // Update medical officer's approval status
    medicalOfficer.medical_info!.approved_by_director = true;
    await medicalOfficer.save();

    // Add to director's approved officers list
    await User.findByIdAndUpdate(directorId, {
      $addToSet: { "director_info.approved_medical_officers": officerId },
    });

    return res.status(200).json({
      message: "Medical officer approved successfully",
      officerId: medicalOfficer._id,
      officerName: `${medicalOfficer.full_name.first} ${medicalOfficer.full_name.last}`,
    });
  } catch (error) {
    console.error("Approve medical officer error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * Admin: Manage user (enable/disable)
 * @route PUT /api/users/manage/:userId
 */
export const manageUser = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { userId } = req.params;
    const { status } = req.body;
    const adminId = req.user?.id;
    const adminRole = req.user?.role;

    if (!adminId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (adminRole !== "admin") {
      return res
        .status(403)
        .json({ message: "Only administrators can manage users" });
    }

    // Validate status
    if (status !== "active" && status !== "disabled") {
      return res.status(400).json({ message: "Invalid status value" });
    }

    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent disabling self
    if (userId === adminId) {
      return res
        .status(400)
        .json({ message: "Cannot modify your own account status" });
    }

    // Update user status
    user.status = status;
    await user.save();

    return res.status(200).json({
      message: `User ${
        status === "active" ? "activated" : "disabled"
      } successfully`,
      userId: user._id,
      userName: `${user.full_name.first} ${user.full_name.last}`,
      status: user.status,
    });
  } catch (error) {
    console.error("Manage user error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * Admin: Assign role/permissions
 * @route PUT /api/users/assign-role/:userId
 */
export const assignRole = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { userId } = req.params;
    const { role, permissions } = req.body;
    const adminId = req.user?.id;
    const adminRole = req.user?.role;

    if (!adminId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (adminRole !== "admin") {
      return res
        .status(403)
        .json({ message: "Only administrators can assign roles" });
    }

    // Validate role
    const validRoles: UserRole[] = [
      "pwd",
      "guardian",
      "medical_officer",
      "county_director",
      "admin",
    ];
    if (role && !validRoles.includes(role as UserRole)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent changing own role
    if (userId === adminId) {
      return res.status(400).json({ message: "Cannot modify your own role" });
    }

    // Update user role if provided
    if (role) {
      user.role = role as UserRole;
    }

    // Update admin permissions if provided and user is admin
    if (permissions && (user.role === "admin" || role === "admin")) {
      if (!user.system_admin_info) {
        user.system_admin_info = {
          permissions: [],
        };
      }
      user.system_admin_info.permissions = permissions;
    }

    // Save updates
    await user.save();

    return res.status(200).json({
      message: "User role and permissions updated successfully",
      userId: user._id,
      userName: `${user.full_name.first} ${user.full_name.last}`,
      role: user.role,
      permissions: user.system_admin_info?.permissions || [],
    });
  } catch (error) {
    console.error("Assign role error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
