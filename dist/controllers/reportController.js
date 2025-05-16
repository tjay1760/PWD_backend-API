"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSystemReport = exports.getCountySummary = void 0;
const User_1 = __importDefault(require("../models/User"));
const Assessment_1 = __importDefault(require("../models/Assessment"));
/**
 * Generate county summary report (for county director)
 * @route GET /api/reports/county-summary
 */
const getCountySummary = async (req, res) => {
    try {
        const directorId = req.user?.id;
        const directorRole = req.user?.role;
        const county = req.user?.county;
        if (!directorId) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        if (directorRole !== 'county_director') {
            return res.status(403).json({ message: 'Only county directors can access county reports' });
        }
        // Get time range parameters
        const { fromDate, toDate } = req.query;
        const dateFilter = {};
        if (fromDate) {
            dateFilter.$gte = new Date(fromDate);
        }
        if (toDate) {
            dateFilter.$lte = new Date(toDate);
        }
        // Find all PWDs in the county
        const pwdQuery = { role: 'pwd', county };
        if (Object.keys(dateFilter).length > 0) {
            pwdQuery.created_at = dateFilter;
        }
        const pwdsInCounty = await User_1.default.find(pwdQuery);
        const pwdIds = pwdsInCounty.map(pwd => pwd._id);
        // Get count of PWDs by gender
        const pwdsByGender = await User_1.default.aggregate([
            {
                $match: {
                    role: 'pwd',
                    county,
                    ...(Object.keys(dateFilter).length > 0 ? { created_at: dateFilter } : {})
                }
            },
            {
                $group: {
                    _id: '$gender',
                    count: { $sum: 1 }
                }
            }
        ]);
        // Get count of medical officers in the county
        const medicalOfficersCount = await User_1.default.countDocuments({
            role: 'medical_officer',
            'medical_info.county_of_practice': county,
            ...(Object.keys(dateFilter).length > 0 ? { created_at: dateFilter } : {})
        });
        // Get approved medical officers count
        const approvedMedicalOfficersCount = await User_1.default.countDocuments({
            role: 'medical_officer',
            'medical_info.county_of_practice': county,
            'medical_info.approved_by_director': true,
            ...(Object.keys(dateFilter).length > 0 ? { created_at: dateFilter } : {})
        });
        // Get assessment statistics
        const assessmentQuery = { pwd_id: { $in: pwdIds } };
        if (Object.keys(dateFilter).length > 0) {
            assessmentQuery.created_at = dateFilter;
        }
        const assessments = await Assessment_1.default.find(assessmentQuery);
        // Count assessments by status
        const assessmentsByStatus = await Assessment_1.default.aggregate([
            {
                $match: {
                    pwd_id: { $in: pwdIds },
                    ...(Object.keys(dateFilter).length > 0 ? { created_at: dateFilter } : {})
                }
            },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);
        // Count assessments by form type
        const assessmentsByFormType = await Assessment_1.default.aggregate([
            {
                $match: {
                    pwd_id: { $in: pwdIds },
                    ...(Object.keys(dateFilter).length > 0 ? { created_at: dateFilter } : {})
                }
            },
            {
                $group: {
                    _id: '$form_type',
                    count: { $sum: 1 }
                }
            }
        ]);
        // Format gender data
        const genderData = pwdsByGender.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
        }, {});
        // Format status data
        const statusData = assessmentsByStatus.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
        }, {});
        // Format form type data
        const formTypeData = assessmentsByFormType.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
        }, {});
        return res.status(200).json({
            county,
            dateRange: {
                from: fromDate || 'all time',
                to: toDate || 'present'
            },
            summary: {
                totalPWDs: pwdsInCounty.length,
                pwdsByGender: genderData,
                totalMedicalOfficers: medicalOfficersCount,
                approvedMedicalOfficers: approvedMedicalOfficersCount,
                totalAssessments: assessments.length,
                assessmentsByStatus: statusData,
                assessmentsByFormType: formTypeData,
                approvalRate: assessments.length > 0
                    ? ((statusData.approved || 0) / assessments.length * 100).toFixed(2) + '%'
                    : '0%'
            }
        });
    }
    catch (error) {
        console.error('County summary report error:', error);
        return res.status(500).json({ message: 'Server error generating report' });
    }
};
exports.getCountySummary = getCountySummary;
/**
 * Generate system-wide report (for admin)
 * @route GET /api/reports/system
 */
const getSystemReport = async (req, res) => {
    try {
        const adminId = req.user?.id;
        const adminRole = req.user?.role;
        if (!adminId) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        if (adminRole !== 'admin') {
            return res.status(403).json({ message: 'Only administrators can access system reports' });
        }
        // Get time range parameters
        const { fromDate, toDate } = req.query;
        const dateFilter = {};
        if (fromDate) {
            dateFilter.$gte = new Date(fromDate);
        }
        if (toDate) {
            dateFilter.$lte = new Date(toDate);
        }
        // Get user statistics
        const userQuery = Object.keys(dateFilter).length > 0 ? { created_at: dateFilter } : {};
        const totalUsers = await User_1.default.countDocuments(userQuery);
        // Get users by role
        const usersByRole = await User_1.default.aggregate([
            {
                $match: userQuery
            },
            {
                $group: {
                    _id: '$role',
                    count: { $sum: 1 }
                }
            }
        ]);
        // Get users by county
        const usersByCounty = await User_1.default.aggregate([
            {
                $match: userQuery
            },
            {
                $group: {
                    _id: '$county',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);
        // Get assessment statistics
        const assessmentQuery = Object.keys(dateFilter).length > 0 ? { created_at: dateFilter } : {};
        const totalAssessments = await Assessment_1.default.countDocuments(assessmentQuery);
        // Get assessments by status
        const assessmentsByStatus = await Assessment_1.default.aggregate([
            {
                $match: assessmentQuery
            },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);
        // Get assessments by form type
        const assessmentsByFormType = await Assessment_1.default.aggregate([
            {
                $match: assessmentQuery
            },
            {
                $group: {
                    _id: '$form_type',
                    count: { $sum: 1 }
                }
            }
        ]);
        // Format role data
        const roleData = usersByRole.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
        }, {});
        // Format status data
        const statusData = assessmentsByStatus.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
        }, {});
        // Format form type data
        const formTypeData = assessmentsByFormType.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
        }, {});
        return res.status(200).json({
            dateRange: {
                from: fromDate || 'all time',
                to: toDate || 'present'
            },
            summary: {
                users: {
                    total: totalUsers,
                    byRole: roleData,
                    topCounties: usersByCounty.slice(0, 5)
                },
                assessments: {
                    total: totalAssessments,
                    byStatus: statusData,
                    byFormType: formTypeData,
                    approvalRate: totalAssessments > 0
                        ? ((statusData.approved || 0) / totalAssessments * 100).toFixed(2) + '%'
                        : '0%'
                }
            }
        });
    }
    catch (error) {
        console.error('System report error:', error);
        return res.status(500).json({ message: 'Server error generating report' });
    }
};
exports.getSystemReport = getSystemReport;
