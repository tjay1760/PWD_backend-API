import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import 'dotenv/config';
import path from 'path';

import connectDB from './config/database';
import routes from './routes';
import { errorHandler, notFoundHandler, setupUnhandledRejectionHandler } from './middleware/error';
import { stream } from './utils/logger';

// Initialize app
const app = express();

// Connect to database
connectDB();

// Setup global middleware
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream }));

// Setup uploads directory
const uploadsDir = process.env.UPLOAD_DIR || 'uploads';
app.use(`/${uploadsDir}`, express.static(path.join(__dirname, '..', uploadsDir)));

// API routes
app.use('/api', routes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Setup unhandled rejection handler
setupUnhandledRejectionHandler();

export default app;