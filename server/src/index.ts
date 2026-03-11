import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import passport from 'passport';

import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { configurePassport } from './config/passport.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import routes from './routes/index.js';
import { logger } from './utils/logger.js';

async function bootstrap(): Promise<void> {
  // Connect to MongoDB
  await connectDB();

  // Configure Passport
  configurePassport();

  // Create Express app
  const app = express();

  // ── Global Middleware ──
  app.use(helmet());
  app.use(
    cors({
      origin: env.clientUrl,
      credentials: true,
    })
  );
  app.use(morgan('short', { stream: { write: (msg) => logger.info(msg.trim()) } }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(passport.initialize());

  // Rate limiting
  app.use('/api', apiLimiter);

  // ── Health Check ──
  app.get('/api/health', (_req, res) => {
    res.json({
      success: true,
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
        env: env.nodeEnv,
      },
    });
  });

  // ── API Routes ──
  app.use('/api', routes);

  // ── Error Handler (must be last) ──
  app.use(errorHandler);

  // ── Serve React client in production ──
  if (env.nodeEnv === 'production') {
    const clientDist = path.resolve(__dirname, '../../client/dist');
    app.use(express.static(clientDist));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  } else {
    // ── 404 (dev only — in production, React handles routing) ──
    app.use((_req, res) => {
      res.status(404).json({ success: false, error: 'Route not found' });
    });
  }

  // ── Start Server ──
  app.listen(env.port, () => {
    logger.info(`🚀 Server running on port ${env.port} [${env.nodeEnv}]`);
    logger.info(`   Health: http://localhost:${env.port}/api/health`);
    logger.info(`   Auth:   http://localhost:${env.port}/api/auth/google`);
  });
}

bootstrap().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});
