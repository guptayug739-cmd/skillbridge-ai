import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import hpp from 'hpp';
import { config } from './config';
import { prisma } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';
import { securityHeaders } from './middleware/security';
import { sanitizeInput } from './middleware/sanitize';
import { generateCsrfToken, validateCsrfToken } from './middleware/csrf';
import { requestId } from './middleware/requestId';
import { setupSocketHandlers } from './services/socket';
import { cleanupExpiredSessions } from './services/session.service';
import { logger } from './utils/logger';
import routes from './routes';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: config.clientUrl,
    credentials: true,
  },
});

app.set('io', io);

app.use(securityHeaders);
app.use(compression());
app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  }),
);

const morganStream = {
  write: (message: string) => logger.http(message.trim()),
};
app.use(morgan('combined', { stream: morganStream }));

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(requestId);
app.use(hpp());
app.use(sanitizeInput);

app.use('/api', apiLimiter);
app.use('/api', generateCsrfToken);
app.use('/api', validateCsrfToken);

app.use('/api', routes);

app.use(errorHandler);

setupSocketHandlers(io);

httpServer.listen(config.port, () => {
  logger.info(`Server running on port ${config.port} in ${config.nodeEnv} mode`);

  setInterval(
    () => {
      cleanupExpiredSessions().catch((err) => logger.error('Session cleanup failed:', err));
    },
    60 * 60 * 1000,
  );
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  io.close();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('unhandledRejection', (err: Error) => {
  logger.error('Unhandled Rejection:', err);
  process.exit(1);
});

export default app;
