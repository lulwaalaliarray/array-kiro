import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export class AuthUtils {
  private static readonly SALT_ROUNDS = 12;
  private static readonly JWT_SECRET = process.env['JWT_SECRET'] || 'fallback-secret';
  private static readonly JWT_REFRESH_SECRET = process.env['JWT_REFRESH_SECRET'] || 'fallback-refresh-secret';
  private static readonly JWT_EXPIRES_IN = process.env['JWT_EXPIRES_IN'] || '24h';
  private static readonly JWT_REFRESH_EXPIRES_IN = process.env['JWT_REFRESH_EXPIRES_IN'] || '7d';

  /**
   * Hash a password using bcrypt
   */
  public static async hashPassword(password: string): Promise<string> {
    try {
      const salt = await bcrypt.genSalt(this.SALT_ROUNDS);
      return await bcrypt.hash(password, salt);
    } catch (error) {
      throw new Error('Failed to hash password');
    }
  }

  /**
   * Verify a password against its hash
   */
  public static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      throw new Error('Failed to verify password');
    }
  }

  /**
   * Generate JWT access token
   */
  public static generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    try {
      return jwt.sign(payload, this.JWT_SECRET, {
        expiresIn: this.JWT_EXPIRES_IN,
        issuer: 'patientcare-api',
        audience: 'patientcare-client',
      } as jwt.SignOptions);
    } catch (error) {
      throw new Error('Failed to generate access token');
    }
  }

  /**
   * Generate JWT refresh token
   */
  public static generateRefreshToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    try {
      return jwt.sign(payload, this.JWT_REFRESH_SECRET, {
        expiresIn: this.JWT_REFRESH_EXPIRES_IN,
        issuer: 'patientcare-api',
        audience: 'patientcare-client',
      } as jwt.SignOptions);
    } catch (error) {
      throw new Error('Failed to generate refresh token');
    }
  }

  /**
   * Generate both access and refresh tokens
   */
  public static generateTokens(payload: Omit<JWTPayload, 'iat' | 'exp'>): AuthTokens {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  }

  /**
   * Verify JWT access token
   */
  public static verifyAccessToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, this.JWT_SECRET, {
        issuer: 'patientcare-api',
        audience: 'patientcare-client',
      } as jwt.VerifyOptions) as JWTPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Access token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid access token');
      }
      throw new Error('Failed to verify access token');
    }
  }

  /**
   * Verify JWT refresh token
   */
  public static verifyRefreshToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, this.JWT_REFRESH_SECRET, {
        issuer: 'patientcare-api',
        audience: 'patientcare-client',
      } as jwt.VerifyOptions) as JWTPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Refresh token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid refresh token');
      }
      throw new Error('Failed to verify refresh token');
    }
  }

  /**
   * Extract token from Authorization header
   */
  public static extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  /**
   * Validate password strength
   */
  public static validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}