"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const feedbackController_1 = require("../controllers/feedbackController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = express_1.default.Router();
// Submit feedback
router.post('/', (0, validation_1.validate)(feedbackController_1.submitFeedbackValidation), feedbackController_1.submitFeedback);
// Get all feedback (admin only)
router.get('/', auth_1.authenticate, (0, auth_1.authorize)(['admin']), feedbackController_1.getAllFeedback);
exports.default = router;
