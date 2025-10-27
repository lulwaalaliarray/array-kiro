import { Request, Response } from 'express';
import { UserRole } from '@prisma/client';
import { AuthService, UserRegistrationData } from '@/services/authService';
import { logger } from '@/utils/logger';

export class AuthController {
  /**
   * Register a new patient
   */
  public static async registerPatient(req: Request, res: Response): Promise<Response | void> {
    try {
      const { email, password, name, age, gender, phone, address } = req.body;

      const userData: UserRegistrationData = {
        email,
        password,
        role: UserRole.PATIENT,
        profileData: {
          name,
          age,
          gender,
          phone,
          address,
        },
      };

      const result = await AuthService.register(userData);

      res.status(201).json({
        message: 'Patient registered successfully',
        data: {
          user: {
            id: result.user.id,
            email: result.user.email,
            role: result.user.role,
            isVerified: result.user.isVerified,
            profile: result.user.profile,
          },
          tokens: result.tokens,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Patient registration failed:', error);

      if (error instanceof Error) {
        if (error.message.includes('already exists')) {
          return res.status(409).json({
            error: {
              code: 'USER_ALREADY_EXISTS',
              message: error.message,
              timestamp: new Date().toISOString(),
            },
          });
        }
      }

      res.status(500).json({
        error: {
          code: 'REGISTRATION_FAILED',
          message: 'Failed to register patient',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  /**
   * Register a new doctor
   */
  public static async registerDoctor(req: Request, res: Response): Promise<Response | void> {
    try {
      const {
        email,
        password,
        name,
        profilePicture,
        medicalLicenseNumber,
        qualifications,
        yearsOfExperience,
        specializations,
        phone,
        clinicName,
        clinicAddress,
        consultationFee,
      } = req.body;

      const userData: UserRegistrationData = {
        email,
        password,
        role: UserRole.DOCTOR,
        profileData: {
          name,
          profilePicture,
          medicalLicenseNumber,
          qualifications,
          yearsOfExperience,
          specializations,
          phone,
          clinicName,
          clinicAddress,
          consultationFee,
        },
      };

      const result = await AuthService.register(userData);

      res.status(201).json({
        message: 'Doctor registered successfully. License verification is pending.',
        data: {
          user: {
            id: result.user.id,
            email: result.user.email,
            role: result.user.role,
            isVerified: result.user.isVerified,
            profile: result.user.profile,
          },
          tokens: result.tokens,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Doctor registration failed:', error);

      if (error instanceof Error) {
        if (error.message.includes('already exists') || error.message.includes('already registered')) {
          return res.status(409).json({
            error: {
              code: 'DOCTOR_ALREADY_EXISTS',
              message: error.message,
              timestamp: new Date().toISOString(),
            },
          });
        }
      }

      res.status(500).json({
        error: {
          code: 'REGISTRATION_FAILED',
          message: 'Failed to register doctor',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  /**
   * Register a new admin (restricted endpoint)
   */
  public static async registerAdmin(req: Request, res: Response): Promise<Response | void> {
    try {
      const { email, password, name, phone } = req.body;

      const userData: UserRegistrationData = {
        email,
        password,
        role: UserRole.ADMIN,
        profileData: {
          name,
          phone,
        },
      };

      const result = await AuthService.register(userData);

      res.status(201).json({
        message: 'Admin registered successfully',
        data: {
          user: {
            id: result.user.id,
            email: result.user.email,
            role: result.user.role,
            isVerified: result.user.isVerified,
            profile: result.user.profile,
          },
          tokens: result.tokens,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Admin registration failed:', error);

      if (error instanceof Error) {
        if (error.message.includes('already exists')) {
          return res.status(409).json({
            error: {
              code: 'ADMIN_ALREADY_EXISTS',
              message: error.message,
              timestamp: new Date().toISOString(),
            },
          });
        }
      }

      res.status(500).json({
        error: {
          code: 'REGISTRATION_FAILED',
          message: 'Failed to register admin',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  /**
   * Login user
   */
  public static async login(req: Request, res: Response): Promise<Response | void> {
    try {
      const { email, password } = req.body;

      const result = await AuthService.login({ email, password });

      res.status(200).json({
        message: 'Login successful',
        data: {
          user: {
            id: result.user.id,
            email: result.user.email,
            role: result.user.role,
            isVerified: result.user.isVerified,
            profile: result.user.profile,
          },
          tokens: result.tokens,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Login failed:', error);

      if (error instanceof Error) {
        if (error.message.includes('Invalid email or password')) {
          return res.status(401).json({
            error: {
              code: 'INVALID_CREDENTIALS',
              message: 'Invalid email or password',
              timestamp: new Date().toISOString(),
            },
          });
        } else if (error.message.includes('deactivated')) {
          return res.status(401).json({
            error: {
              code: 'ACCOUNT_DEACTIVATED',
              message: 'Account has been deactivated',
              timestamp: new Date().toISOString(),
            },
          });
        }
      }

      res.status(500).json({
        error: {
          code: 'LOGIN_FAILED',
          message: 'Login failed',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  /**
   * Refresh access token
   */
  public static async refreshToken(req: Request, res: Response): Promise<Response | void> {
    try {
      const { refreshToken } = req.body;

      const tokens = await AuthService.refreshToken(refreshToken);

      res.status(200).json({
        message: 'Token refreshed successfully',
        data: { tokens },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Token refresh failed:', error);

      if (error instanceof Error) {
        if (error.message.includes('expired') || error.message.includes('Invalid')) {
          return res.status(401).json({
            error: {
              code: 'INVALID_REFRESH_TOKEN',
              message: 'Invalid or expired refresh token',
              timestamp: new Date().toISOString(),
            },
          });
        }
      }

      res.status(500).json({
        error: {
          code: 'TOKEN_REFRESH_FAILED',
          message: 'Failed to refresh token',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  /**
   * Get current user profile
   */
  public static async getProfile(req: Request, res: Response): Promise<Response | void> {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication is required',
            timestamp: new Date().toISOString(),
          },
        });
      }

      const userProfile = await AuthService.getUserProfile(req.user.userId);

      res.status(200).json({
        message: 'Profile retrieved successfully',
        data: {
          user: {
            id: userProfile.id,
            email: userProfile.email,
            role: userProfile.role,
            isVerified: userProfile.isVerified,
            isActive: userProfile.isActive,
            createdAt: userProfile.createdAt,
            profile: userProfile.profile,
          },
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to get user profile:', error);

      res.status(500).json({
        error: {
          code: 'PROFILE_FETCH_FAILED',
          message: 'Failed to retrieve user profile',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  /**
   * Update user password
   */
  public static async updatePassword(req: Request, res: Response): Promise<Response | void> {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication is required',
            timestamp: new Date().toISOString(),
          },
        });
      }

      const { currentPassword, newPassword } = req.body;

      await AuthService.updatePassword(req.user.userId, currentPassword, newPassword);

      res.status(200).json({
        message: 'Password updated successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Password update failed:', error);

      if (error instanceof Error) {
        if (error.message.includes('Current password is incorrect')) {
          return res.status(400).json({
            error: {
              code: 'INVALID_CURRENT_PASSWORD',
              message: 'Current password is incorrect',
              timestamp: new Date().toISOString(),
            },
          });
        } else if (error.message.includes('Password validation failed')) {
          return res.status(400).json({
            error: {
              code: 'WEAK_PASSWORD',
              message: error.message,
              timestamp: new Date().toISOString(),
            },
          });
        }
      }

      res.status(500).json({
        error: {
          code: 'PASSWORD_UPDATE_FAILED',
          message: 'Failed to update password',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  /**
   * Logout user (placeholder - in a real app, you might want to blacklist the token)
   */
  public static async logout(_req: Request, res: Response): Promise<Response | void> {
    try {
      // In a stateless JWT implementation, logout is typically handled client-side
      // by removing the tokens from storage. However, you could implement token blacklisting here.
      
      res.status(200).json({
        message: 'Logout successful',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Logout failed:', error);

      res.status(500).json({
        error: {
          code: 'LOGOUT_FAILED',
          message: 'Failed to logout',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
}