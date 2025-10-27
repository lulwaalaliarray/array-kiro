import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { AuthUtils, JWTPayload } from '@/utils/auth';
import { db } from '@/services/database';
import { logger } from '@/utils/logger';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload & {
        isVerified: boolean;
        isActive: boolean;
        profile?: any;
      };
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload & {
    isVerified: boolean;
    isActive: boolean;
    profile?: any;
  };
}

/**
 * Authentication middleware - verifies JWT token
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = AuthUtils.extractTokenFromHeader(authHeader);

    if (!token) {
      return res.status(401).json({
        error: {
          code: 'MISSING_TOKEN',
          message: 'Access token is required',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Verify the token
    const payload = AuthUtils.verifyAccessToken(token);

    // Check if user still exists and is active
    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        isVerified: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User account not found',
          timestamp: new Date().toISOString(),
        },
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        error: {
          code: 'ACCOUNT_DEACTIVATED',
          message: 'User account has been deactivated',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Attach user info to request
    req.user = {
      ...payload,
      ...user,
    };

    next();
  } catch (error) {
    logger.error('Authentication error:', error);

    if (error instanceof Error) {
      if (error.message === 'Access token expired') {
        return res.status(401).json({
          error: {
            code: 'TOKEN_EXPIRED',
            message: 'Access token has expired',
            timestamp: new Date().toISOString(),
          },
        });
      } else if (error.message === 'Invalid access token') {
        return res.status(401).json({
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid access token',
            timestamp: new Date().toISOString(),
          },
        });
      }
    }

    return res.status(401).json({
      error: {
        code: 'AUTHENTICATION_FAILED',
        message: 'Authentication failed',
        timestamp: new Date().toISOString(),
      },
    });
  }
};

/**
 * Authorization middleware - checks user roles
 */
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): Response | void => {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication is required',
          timestamp: new Date().toISOString(),
        },
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Insufficient permissions to access this resource',
          timestamp: new Date().toISOString(),
        },
      });
    }

    next();
  };
};

/**
 * Optional authentication middleware - doesn't fail if no token provided
 */
export const optionalAuth = async (req: Request, _res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = AuthUtils.extractTokenFromHeader(authHeader);

    if (!token) {
      return next();
    }

    // Verify the token
    const payload = AuthUtils.verifyAccessToken(token);

    // Check if user still exists and is active
    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        isVerified: true,
      },
    });

    if (user && user.isActive) {
      req.user = {
        ...payload,
        ...user,
      };
    }

    next();
  } catch (error) {
    // For optional auth, we don't fail on token errors
    logger.warn('Optional authentication failed:', error);
    next();
  }
};

/**
 * Middleware to require email verification
 */
export const requireEmailVerification = (req: Request, res: Response, next: NextFunction): Response | void => {
  if (!req.user) {
    return res.status(401).json({
      error: {
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required',
        timestamp: new Date().toISOString(),
      },
    });
  }

  if (!req.user.isVerified) {
    return res.status(403).json({
      error: {
        code: 'EMAIL_VERIFICATION_REQUIRED',
        message: 'Email verification is required to access this resource',
        timestamp: new Date().toISOString(),
      },
    });
  }

  next();
};

/**
 * Middleware to check if doctor is verified (for doctor-specific endpoints)
 */
export const requireDoctorVerification = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  if (!req.user || req.user.role !== UserRole.DOCTOR) {
    return res.status(403).json({
      error: {
        code: 'DOCTOR_ACCESS_REQUIRED',
        message: 'Doctor access is required',
        timestamp: new Date().toISOString(),
      },
    });
  }

  try {
    const doctorProfile = await db.doctorProfile.findUnique({
      where: { userId: req.user.userId },
      select: { licenseVerified: true },
    });

    if (!doctorProfile || !doctorProfile.licenseVerified) {
      return res.status(403).json({
        error: {
          code: 'DOCTOR_VERIFICATION_REQUIRED',
          message: 'Doctor license verification is required to access this resource',
          timestamp: new Date().toISOString(),
        },
      });
    }

    next();
  } catch (error) {
    logger.error('Doctor verification check failed:', error);
    return res.status(500).json({
      error: {
        code: 'VERIFICATION_CHECK_FAILED',
        message: 'Failed to verify doctor status',
        timestamp: new Date().toISOString(),
      },
    });
  }
};

/**
 * Role-based authorization middleware
 */
export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): Response | void => {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication is required',
          timestamp: new Date().toISOString(),
        },
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Insufficient permissions to access this resource',
          timestamp: new Date().toISOString(),
        },
      });
    }

    next();
  };
};

// Alias for authenticate function to match the import in routes
export const authenticateToken = authenticate;