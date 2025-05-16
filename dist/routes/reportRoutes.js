"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const reportController_1 = require("../controllers/reportController");
const auth_1 = require("../middleware/auth");
const audit_1 = require("../middleware/audit");
const router = express_1.default.Router();
// Generate county summary report (for county director)
router.get('/county-summary', auth_1.authenticate, (0, auth_1.authorize)(['county_director']), (0, audit_1.auditLog)('generate_county_report'), reportController_1.getCountySummary);
// Generate system-wide report (for admin)
router.get('/system', auth_1.authenticate, (0, auth_1.authorize)(['admin']), (0, audit_1.auditLog)('generate_system_report'), reportController_1.getSystemReport);
exports.default = router;
