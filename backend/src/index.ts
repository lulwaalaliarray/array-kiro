import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { errorHandler } from '@/middleware/errorHandler';
import { notFoundHandler } from '@/middleware/notFoundHandler';
import { setupStaticFiles } from '@/middleware/staticFiles';
import { securityHeaders, sanitizeInput, securityLogger } from '@/middleware/security';
import { monitoringMiddleware, monitoringService, AlertSystem } from '@/services/monitoringService';
import { performanceMiddleware, optimizeDatabaseConnections, monitorMemoryUsage } from '@/services/performanceService';
import { cacheService } from '@/services/cacheService';
import { backupService } from '@/services/backupService';
import { logger } from '@/utils/logger';
import DatabaseService from '@/services/database';
import apiRoutes from '@/routes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env['PORT'] || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // We'll handle this in securityHeaders middleware
  crossOriginEmbedderPolicy: false,
}));

// Enhanced security headers
app.use(securityHeaders);

// Request sanitization
app.use(sanitizeInput);

// Security logging
app.use(securityLogger);

// CORS configuration
app.use(cors({
  origin: process.env['CORS_ORIGIN'] || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000'), // 15 minutes
  max: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '100'),
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
}));

// Performance monitoring middleware
app.use(monitoringMiddleware);
app.use(performanceMiddleware);

// Logging middleware
app.use(morgan('combined', { stream: { write: (message: string) => logger.info(message.trim()) } }));

// Static file serving
setupStaticFiles(app);

// Health check endpoint with detailed system status
app.get('/health', async (_req, res) => {
  try {
    const metrics = await monitoringService.getMetrics();
    const backupStatus = await backupService.getBackupStatus();
    
    res.status(200).json({
      status: metrics.health.overall === 'healthy' ? 'OK' : 'DEGRADED',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env['NODE_ENV'],
      metrics: {
        requests: metrics.requests,
        performance: metrics.performance,
        memory: metrics.system.memory_usage,
        health: metrics.health,
      },
      backup: {
        latest_backup: backupStatus.latest_database_backup?.createdAt || null,
        total_backups: backupStatus.total_backups,
        backup_in_progress: backupStatus.backup_in_progress,
      },
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
    });
  }
});

// System metrics endpoint (admin only)
app.get('/metrics', async (_req, res) => {
  try {
    // In a real implementation, you'd add authentication here
    const metrics = await monitoringService.getMetrics();
    res.json(metrics);
  } catch (error) {
    logger.error('Metrics endpoint failed:', error);
    res.status(500).json({ error: 'Failed to retrieve metrics' });
  }
});

// Test route for security testing
app.post('/api/v1/test-sanitization', (req, res) => {
  res.json(req.body);
});

// API routes
app.use('/api/v1', apiRoutes);

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize database and start server
async function startServer() {
  try {
    // Connect to database
    const dbService = DatabaseService.getInstance();
    await dbService.connect();

    // Connect to cache service
    await cacheService.connect();

    // Optimize database connections
    optimizeDatabaseConnections();

    // Start memory monitoring
    monitorMemoryUsage();

    // Schedule automatic backups
    backupService.scheduleAutomaticBackups();

    // Start system monitoring
    setInterval(async () => {
      await monitoringService.logSystemStatus();
      await AlertSystem.checkAlerts();
    }, 300000); // Every 5 minutes

    // Start server
    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT} in ${process.env['NODE_ENV'] || 'development'} mode`);
      logger.info('✅ Security and performance optimizations enabled');
      logger.info('📊 Monitoring and alerting system active');
      logger.info('💾 Automatic backup system scheduled');
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received, shutting down gracefully`);
  
  try {
    // Close database connections
    const dbService = DatabaseService.getInstance();
    await dbService.disconnect();
    
    // Close cache connections
    await cacheService.disconnect();
    
    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

startServer();

export default app;