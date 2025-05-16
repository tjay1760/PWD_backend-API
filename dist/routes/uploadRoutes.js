"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const uploadController_1 = require("../controllers/uploadController");
const auth_1 = require("../middleware/auth");
const audit_1 = require("../middleware/audit");
const router = express_1.default.Router();
// Upload a file
router.post('/upload', auth_1.authenticate, (0, audit_1.auditLog)('file_upload'), uploadController_1.uploadFile);
// Get file by ID
router.get('/:fileId', auth_1.authenticate, uploadController_1.getFile);
// Delete file
router.delete('/:fileId', auth_1.authenticate, (0, audit_1.auditLog)('file_delete'), uploadController_1.deleteFile);
// Get files related to an entity
router.get('/related/:type/:id', auth_1.authenticate, uploadController_1.getRelatedFiles);
exports.default = router;
