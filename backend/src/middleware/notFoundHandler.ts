import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';

/**
 * 404 Not Found handler middleware
 */
export const notFoundHandler = (req: Request, res: Response, _next: NextFunction): Response => {
  logger.warn(`404 Not Found: ${req.method} ${req.originalUrl} from IP: ${req.ip}`);
  
  return res.status(404).json({
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Route ${req.originalUrl} not found`,
      timestamp: new Date().toISOString(),
    },
  });
};