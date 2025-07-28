"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authRoutes_1 = __importDefault(require("./authRoutes"));
const userRoutes_1 = __importDefault(require("./userRoutes"));
const assessmentRoutes_1 = __importDefault(require("./assessmentRoutes"));
const uploadRoutes_1 = __importDefault(require("./uploadRoutes"));
const feedbackRoutes_1 = __importDefault(require("./feedbackRoutes"));
const reportRoutes_1 = __importDefault(require("./reportRoutes"));
const locationRoutes_1 = __importDefault(require("./locationRoutes"));
const visualImparementRoutes_1 = __importDefault(require("./visualImparementRoutes"));
const router = express_1.default.Router();
// Health check route
router.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'API is running' });
});
// API routes
router.use('/auth', authRoutes_1.default);
router.use('/users', userRoutes_1.default);
router.use('/assessments', assessmentRoutes_1.default);
router.use('/files', uploadRoutes_1.default);
router.use('/feedback', feedbackRoutes_1.default);
router.use('/reports', reportRoutes_1.default);
router.use('/locations/counties', locationRoutes_1.default);
router.use('/visual-impairments', visualImparementRoutes_1.default);
exports.default = router;
