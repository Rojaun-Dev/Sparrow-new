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
import { pool } from './db';

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
app.use(compression() as any); // Compress responses
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

// Health check endpoint with database connectivity check
app.get('/health', async (_req, res) => {
  try {
    // Check database connectivity
    await pool.query('SELECT 1');
    res.status(200).json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    logger.error('Health check failed - database connectivity issue:', err);
    res.status(503).json({
      status: 'error',
      database: 'disconnected',
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start the server
const server = app.listen(port, () => {
  logger.info(
    `Server running on port ${port} in ${config.server.env} mode`
  );
});

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received, starting graceful shutdown`);

  // Stop accepting new connections
  server.close(async () => {
    logger.info('HTTP server closed');

    try {
      // Close database pool
      await pool.end();
      logger.info('Database pool closed');

      // Exit cleanly
      logger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (err) {
      logger.error('Error during graceful shutdown:', err);
      process.exit(1);
    }
  });

  // Force shutdown after 30 seconds if graceful shutdown doesn't complete
  setTimeout(() => {
    logger.error('Forced shutdown after 30 second timeout');
    process.exit(1);
  }, 30000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
