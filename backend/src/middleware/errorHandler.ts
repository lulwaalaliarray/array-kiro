import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';

/**
 * Custom error class for application errors
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code: string;

  constructor(message: string, statusCode: number = 500, code: string = 'UNKNOWN_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handling middleware
 */
export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): Response | void => {
  // Default error values
  let statusCode = 500;
  let message = 'Internal Server Error';
  let code = 'INTERNAL_ERROR';

  // Handle different error types
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    code = error.code || 'APP_ERROR';
  } else if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    code = 'VALIDATION_ERROR';
  } else if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
    code = 'INVALID_ID';
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    code = 'INVALID_TOKEN';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    code = 'TOKEN_EXPIRED';
  } else if (error.message.includes('duplicate key')) {
    statusCode = 409;
    message = 'Resource already exists';
    code = 'DUPLICATE_RESOURCE';
  } else if (error.message.includes('foreign key constraint')) {
    statusCode = 400;
    message = 'Invalid reference to related resource';
    code = 'INVALID_REFERENCE';
  }

  // Log error details
  const errorDetails = {
    message: error.message,
    stack: error.stack,
    statusCode,
    code,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.userId,
  };

  if (statusCode >= 500) {
    logger.error('Server Error:', errorDetails);
  } else {
    logger.warn('Client Error:', errorDetails);
  }

  // Don't leak error details in production
  const isDevelopment = process.env['NODE_ENV'] === 'development';

  const errorResponse = {
    error: {
      code,
      message,
      timestamp: new Date().toISOString(),
      ...(isDevelopment && {
        stack: error.stack,
        details: errorDetails,
      }),
    },
  };

  return res.status(statusCode).json(errorResponse);
};

/**
 * Async error wrapper for route handlers
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req: Request, res: Response, _next: NextFunction): Response => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404, 'ROUTE_NOT_FOUND');
  return res.status(404).json({
    error: {
      code: error.code,
      message: error.message,
      timestamp: new Date().toISOString(),
    },
  });
};

/**
 * Validation error handler
 */
export const validationErrorHandler = (errors: any[]): AppError => {
  const message = errors.map(error => error.msg || error.message).join(', ');
  return new AppError(`Validation failed: ${message}`, 400, 'VALIDATION_ERROR');
};

/**
 * Express middleware to handle validation errors
 */
export const handleValidationErrors = (req: Request, _res: Response, next: NextFunction) => {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const error = validationErrorHandler(errors.array());
    return next(error);
  }
  
  next();
};

/**
 * Database error handler
 */
export const handleDatabaseError = (error: any): AppError => {
  if (error.code === 'P2002') {
    // Prisma unique constraint violation
    return new AppError('Resource already exists', 409, 'DUPLICATE_RESOURCE');
  } else if (error.code === 'P2025') {
    // Prisma record not found
    return new AppError('Resource not found', 404, 'RESOURCE_NOT_FOUND');
  } else if (error.code === 'P2003') {
    // Prisma foreign key constraint violation
    return new AppError('Invalid reference to related resource', 400, 'INVALID_REFERENCE');
  } else if (error.code === 'P2014') {
    // Prisma invalid ID
    return new AppError('Invalid ID provided', 400, 'INVALID_ID');
  }

  // Generic database error
  return new AppError('Database operation failed', 500, 'DATABASE_ERROR');
};

/**
 * External service error handler
 */
export const handleExternalServiceError = (serviceName: string, error: any): AppError => {
  logger.error(`External service error (${serviceName}):`, error);
  
  if (error.response?.status === 401) {
    return new AppError(`${serviceName} authentication failed`, 502, 'EXTERNAL_AUTH_ERROR');
  } else if (error.response?.status === 429) {
    return new AppError(`${serviceName} rate limit exceeded`, 502, 'EXTERNAL_RATE_LIMIT');
  } else if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
    return new AppError(`${serviceName} is unavailable`, 503, 'EXTERNAL_SERVICE_UNAVAILABLE');
  }

  return new AppError(`${serviceName} error`, 502, 'EXTERNAL_SERVICE_ERROR');
};