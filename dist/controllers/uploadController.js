"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRelatedFiles = exports.deleteFile = exports.getFile = exports.uploadFile = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const mongoose_1 = __importDefault(require("mongoose"));
const Upload_1 = __importDefault(require("../models/Upload"));
const upload_1 = require("../middleware/upload");
/**
 * Upload a file
 * @route POST /api/files/upload
 */
exports.uploadFile = [
    upload_1.upload.single('file'),
    async (req, res) => {
        try {
            const { relatedType, relatedId } = req.body;
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ message: 'Authentication required' });
            }
            // Check if file was uploaded
            if (!req.file) {
                return res.status(400).json({ message: 'No file uploaded' });
            }
            // Validate related type
            const validRelatedTypes = ['assessment', 'form', 'other'];
            if (!validRelatedTypes.includes(relatedType)) {
                return res.status(400).json({ message: 'Invalid related type' });
            }
            // Validate MongoDB ID
            if (!mongoose_1.default.Types.ObjectId.isValid(relatedId)) {
                return res.status(400).json({ message: 'Invalid related ID' });
            }
            // Save upload record
            const upload = await Upload_1.default.create({
                uploader_id: userId,
                file_path: req.file.path,
                file_type: req.file.mimetype,
                related_to: {
                    type: relatedType,
                    id: relatedId
                }
            });
            return res.status(201).json({
                message: 'File uploaded successfully',
                file: {
                    id: upload._id,
                    fileName: path_1.default.basename(req.file.path),
                    fileType: req.file.mimetype,
                    filePath: req.file.path,
                    relatedType,
                    relatedId
                }
            });
        }
        catch (error) {
            console.error('File upload error:', error);
            return res.status(500).json({ message: 'Server error during file upload' });
        }
    }
];
/**
 * Get file by ID
 * @route GET /api/files/:fileId
 */
const getFile = async (req, res) => {
    try {
        const { fileId } = req.params;
        const userId = req.user?.id;
        const userRole = req.user?.role;
        if (!userId) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        // Validate MongoDB ID
        if (!mongoose_1.default.Types.ObjectId.isValid(fileId)) {
            return res.status(400).json({ message: 'Invalid file ID' });
        }
        // Find upload
        const upload = await Upload_1.default.findById(fileId);
        if (!upload) {
            return res.status(404).json({ message: 'File not found' });
        }
        // Check authorization (basic check - could be more granular in real application)
        if (userRole !== 'admin' && upload.uploader_id.toString() !== userId) {
            return res.status(403).json({ message: 'Not authorized to access this file' });
        }
        // Check if file exists
        if (!fs_1.default.existsSync(upload.file_path)) {
            return res.status(404).json({ message: 'File not found on server' });
        }
        // Send file
        return res.sendFile(path_1.default.resolve(upload.file_path));
    }
    catch (error) {
        console.error('Get file error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.getFile = getFile;
/**
 * Delete file
 * @route DELETE /api/files/:fileId
 */
const deleteFile = async (req, res) => {
    try {
        const { fileId } = req.params;
        const userId = req.user?.id;
        const userRole = req.user?.role;
        if (!userId) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        // Validate MongoDB ID
        if (!mongoose_1.default.Types.ObjectId.isValid(fileId)) {
            return res.status(400).json({ message: 'Invalid file ID' });
        }
        // Find upload
        const upload = await Upload_1.default.findById(fileId);
        if (!upload) {
            return res.status(404).json({ message: 'File not found' });
        }
        // Check authorization
        if (userRole !== 'admin' && upload.uploader_id.toString() !== userId) {
            return res.status(403).json({ message: 'Not authorized to delete this file' });
        }
        // Delete file from filesystem
        if (fs_1.default.existsSync(upload.file_path)) {
            fs_1.default.unlinkSync(upload.file_path);
        }
        // Delete database record
        await upload.deleteOne();
        return res.status(200).json({ message: 'File deleted successfully' });
    }
    catch (error) {
        console.error('Delete file error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.deleteFile = deleteFile;
/**
 * Get files related to an entity
 * @route GET /api/files/related/:type/:id
 */
const getRelatedFiles = async (req, res) => {
    try {
        const { type, id } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        // Validate related type
        const validRelatedTypes = ['assessment', 'form', 'other'];
        if (!validRelatedTypes.includes(type)) {
            return res.status(400).json({ message: 'Invalid related type' });
        }
        // Validate MongoDB ID
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid related ID' });
        }
        // Find related uploads
        const uploads = await Upload_1.default.find({
            'related_to.type': type,
            'related_to.id': id
        }).sort({ created_at: -1 });
        // Format uploads data
        const formattedUploads = uploads.map(upload => ({
            id: upload._id,
            fileName: path_1.default.basename(upload.file_path),
            fileType: upload.file_type,
            uploadedBy: upload.uploader_id.toString(),
            isCurrentUserUploader: upload.uploader_id.toString() === userId,
            createdAt: upload.created_at
        }));
        return res.status(200).json({ files: formattedUploads });
    }
    catch (error) {
        console.error('Get related files error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};
exports.getRelatedFiles = getRelatedFiles;
