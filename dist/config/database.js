"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = require("../utils/logger");
const connectDB = async () => {
    try {
        const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/medical_assessment_db';
        await mongoose_1.default.connect(dbUri);
        logger_1.logger.info('MongoDB connected successfully');
        // Log when disconnected
        mongoose_1.default.connection.on('disconnected', () => {
            logger_1.logger.warn('MongoDB disconnected');
        });
        // Log connection errors
        mongoose_1.default.connection.on('error', (err) => {
            logger_1.logger.error(`MongoDB connection error: ${err}`);
        });
        // Handle process termination
        process.on('SIGINT', async () => {
            await mongoose_1.default.connection.close();
            logger_1.logger.info('MongoDB connection closed due to app termination');
            process.exit(0);
        });
    }
    catch (error) {
        logger_1.logger.error(`MongoDB connection error: ${error}`);
        process.exit(1);
    }
};
exports.default = connectDB;
