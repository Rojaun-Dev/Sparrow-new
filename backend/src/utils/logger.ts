import pino from 'pino';
import { logging } from '../config';

// Configure pino logger with pretty print in development
const logger = pino({
  level: logging.level,
  transport: process.env.NODE_ENV !== 'production'
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
});

export default logger; 