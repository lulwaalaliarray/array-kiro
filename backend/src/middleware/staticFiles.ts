import express, { Application } from 'express';
import path from 'path';
import { logger } from '@/utils/logger';

/**
 * Setup static file serving with security and performance optimizations
 */
export const setupStaticFiles = (app: Application): void => {
  const uploadDir = process.env['UPLOAD_DIR'] || 'uploads';
  const maxAge = process.env['NODE_ENV'] === 'production' ? '1y' : '1d';

  // Serve uploaded files with security headers
  app.use('/uploads', express.static(path.resolve(uploadDir), {
    maxAge,
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
      // Security headers for file serving
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      
      // Set appropriate content type based on file extension
      const ext = path.extname(filePath).toLowerCase();
      
      if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
        res.setHeader('Content-Type', `image/${ext.slice(1)}`);
      } else if (ext === '.pdf') {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline');
      } else {
        // For other file types, force download
        res.setHeader('Content-Disposition', 'attachment');
      }
    },
  }));

  // Serve frontend static files in production
  if (process.env['NODE_ENV'] === 'production') {
    const frontendBuildPath = path.resolve('../frontend/dist');
    
    app.use(express.static(frontendBuildPath, {
      maxAge: '1y',
      etag: true,
      lastModified: true,
    }));

    // Catch-all handler for SPA routing
    app.get('*', (req, res) => {
      // Skip API routes
      if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
        return;
      }
      
      res.sendFile(path.join(frontendBuildPath, 'index.html'));
    });
  }

  logger.info('Static file serving configured');
};