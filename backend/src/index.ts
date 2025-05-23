// Import debug script first to check environment variables
import './debug-env';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import fileUpload from 'express-fileupload';
import { errorHandler } from './middleware/error-handler';
import { notFoundHandler } from './middleware/not-found-handler';
import routes from './routes';
import config from './config';
import logger from './utils/logger';

// Create Express server
const app = express();
const port = config.server.port;

// Apply middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: [
    'https://cautious-robot-client.vercel.app',
    'https://localhost:4000',
    `${config.client.url}`,
    'http://localhost:3000',
    'http://localhost:4000',
    'https://localhost:3000',
  ].filter(Boolean),
  credentials: true
})); // CORS handling with credentials
app.use(compression()); // Compress responses
app.use(morgan('dev')); // HTTP request logging
app.use(express.json({ limit: '50mb' })); // Parse JSON bodies with increased limit
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// File upload middleware
app.use(fileUpload({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max file size
  abortOnLimit: true,
  useTempFiles: false, // Store files in memory
  createParentPath: true,
  safeFileNames: true,
  preserveExtension: true,
}) as any);

// Apply rate limiting
const limiter = rateLimit({
  windowMs: config.security.rateLimitWindowMs,
  max: config.security.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// API routes
app.use('/api', routes);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start the server
app.listen(port, () => {
  logger.info(
    `Server running on port ${port} in ${config.server.env} mode`
  );
});

export default app;
