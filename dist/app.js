"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
require("dotenv/config");
const path_1 = __importDefault(require("path"));
const database_1 = __importDefault(require("./config/database"));
const routes_1 = __importDefault(require("./routes"));
const error_1 = require("./middleware/error");
const logger_1 = require("./utils/logger");
// Initialize app
const app = (0, express_1.default)();
// Connect to database
(0, database_1.default)();
// Setup global middleware
app.use((0, cors_1.default)());
app.use((0, helmet_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, morgan_1.default)('combined', { stream: logger_1.stream }));
// Setup uploads directory
const uploadsDir = process.env.UPLOAD_DIR || 'uploads';
app.use(`/${uploadsDir}`, express_1.default.static(path_1.default.join(__dirname, '..', uploadsDir)));
// API routes
app.use('/api', routes_1.default);
// 404 handler
app.use(error_1.notFoundHandler);
// Error handler
app.use(error_1.errorHandler);
// Setup unhandled rejection handler
(0, error_1.setupUnhandledRejectionHandler)();
exports.default = app;
