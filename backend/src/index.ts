// Import debug script first to check environment variables
import './debug-env';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
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
    'https://localhost:3000',
    'https://localhost:4000',
    `${config.client.url}`,
    'http://localhost:3000',
    'http://localhost:4000',
  ].filter(Boolean),
  credentials: true
})); // CORS handling with credentials
app.use(compression()); // Compress responses
app.use(morgan('dev')); // HTTP request logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

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
