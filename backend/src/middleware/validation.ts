import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Import validationResult directly
const expressValidator = require('express-validator');
const { validationResult } = expressValidator;

/**
 * Middleware to validate request data using express-validator
 */
export const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    logger.warn('Validation failed:', {
      path: req.path,
      method: req.method,
      errors: errors.array()
    });

    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: errors.array().map((error: any) => ({
          field: error.type === 'field' ? error.path : 'unknown',
          message: error.msg,
          value: error.type === 'field' ? error.value : undefined
        }))
      }
    });
    return;
  }

  next();
};