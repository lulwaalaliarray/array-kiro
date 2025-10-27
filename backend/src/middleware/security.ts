import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { logger } from '@/utils/logger';

/**
 * Enhanced rate limiting for different endpoints
 */
export const createRateLimit = (windowMs: number, max: number, message?: string) => {
  return rateLimit({
    windowMs,
    max,
    message: message || 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}, endpoint: ${req.path}`);
      res.status(429).json({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: message || 'Too many requests from this IP, please try again later.',
          timestamp: new Date().toISOString(),
          retryAfter: Math.ceil(windowMs / 1000),
        },
      });
    },
  });
};

/**
 * Strict rate limiting for authentication endpoints
 */
export const authRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  5, // 5 attempts
  'Too many authentication attempts, please try again later.'
);

/**
 * Rate limiting for payment endpoints
 */
export const paymentRateLimit = createRateLimit(
  60 * 1000, // 1 minute
  3, // 3 attempts
  'Too many payment attempts, please try again later.'
);

/**
 * Rate limiting for file upload endpoints
 */
export const uploadRateLimit = createRateLimit(
  60 * 1000, // 1 minute
  10, // 10 uploads
  'Too many file uploads, please try again later.'
);

/**
 * Security headers middleware
 */
export const securityHeaders = (_req: Request, res: Response, next: NextFunction): void => {
  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' https://maps.googleapis.com https://js.stripe.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data: https:; " +
    "connect-src 'self' https://api.stripe.com https://maps.googleapis.com; " +
    "frame-src 'self' https://js.stripe.com;"
  );

  // Additional security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // HSTS (HTTP Strict Transport Security)
  if (process.env['NODE_ENV'] === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  next();
};

/**
 * Request sanitization middleware
 */
export const sanitizeInput = (req: Request, _res: Response, next: NextFunction): void => {
  // Remove potentially dangerous characters from request body
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }

  next();
};

/**
 * Recursively sanitize object properties
 */
function sanitizeObject(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const sanitized: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const sanitizedKey = sanitizeString(key);
    sanitized[sanitizedKey] = sanitizeObject(value);
  }

  return sanitized;
}

/**
 * Sanitize string values
 */
function sanitizeString(value: any): any {
  if (typeof value !== 'string') {
    return value;
  }

  // Remove script tags and other potentially dangerous content
  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

/**
 * IP whitelist middleware for admin endpoints
 */
export const ipWhitelist = (allowedIPs: string[]) => {
  return (req: Request, res: Response, next: NextFunction): Response | void => {
    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    
    if (!clientIP || !allowedIPs.includes(clientIP)) {
      logger.warn(`Unauthorized IP access attempt: ${clientIP} to ${req.path}`);
      return res.status(403).json({
        error: {
          code: 'IP_NOT_ALLOWED',
          message: 'Access denied from this IP address',
          timestamp: new Date().toISOString(),
        },
      });
    }

    next();
  };
};

/**
 * Request logging middleware for security monitoring
 */
export const securityLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();

  // Log sensitive endpoint access
  const sensitiveEndpoints = ['/auth', '/payment', '/admin', '/medical-history'];
  const isSensitive = sensitiveEndpoints.some(endpoint => req.path.includes(endpoint));

  if (isSensitive) {
    logger.info(`Security-sensitive request: ${req.method} ${req.path} from IP: ${req.ip}`);
  }

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any): any {
    const duration = Date.now() - startTime;
    
    if (isSensitive || res.statusCode >= 400) {
      logger.info(`Response: ${res.statusCode} for ${req.method} ${req.path} (${duration}ms)`);
    }

    return originalEnd.call(this, chunk, encoding);
  };

  next();
};