import { UserRole, User, PatientProfile, DoctorProfile, AdminProfile } from '@prisma/client';
import { db } from '@/services/database';
import { AuthUtils, AuthTokens } from '@/utils/auth';
import { logger } from '@/utils/logger';

export interface UserRegistrationData {
  email: string;
  password: string;
  role: UserRole;
  profileData: PatientProfileData | DoctorProfileData | AdminProfileData;
}

export interface PatientProfileData {
  name: string;
  age: number;
  gender: string;
  phone: string;
  address: string;
}

export interface DoctorProfileData {
  name: string;
  profilePicture?: string;
  medicalLicenseNumber: string;
  qualifications: string[];
  yearsOfExperience: number;
  specializations: string[];
  phone: string;
  clinicName: string;
  clinicAddress: string;
  consultationFee: number;
}

export interface AdminProfileData {
  name: string;
  phone: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResult {
  user: User & {
    profile: PatientProfile | DoctorProfile | AdminProfile | null;
  };
  tokens: AuthTokens;
}

export class AuthService {
  /**
   * Register a new user with profile
   */
  public static async register(userData: UserRegistrationData): Promise<AuthResult> {
    try {
      // Check if user already exists
      const existingUser = await db.user.findUnique({
        where: { email: userData.email },
      });

      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // For doctors, check if medical license is already registered
      if (userData.role === UserRole.DOCTOR) {
        const doctorData = userData.profileData as DoctorProfileData;
        const existingDoctor = await db.doctorProfile.findUnique({
          where: { medicalLicenseNumber: doctorData.medicalLicenseNumber },
        });

        if (existingDoctor) {
          throw new Error('Medical license number is already registered');
        }
      }

      // Hash password
      const hashedPassword = await AuthUtils.hashPassword(userData.password);

      // Create user and profile in a transaction
      const result = await db.$transaction(async (tx) => {
        // Create user
        const user = await tx.user.create({
          data: {
            email: userData.email,
            password: hashedPassword,
            role: userData.role,
          },
        });

        // Create profile based on role
        let profile: PatientProfile | DoctorProfile | AdminProfile;

        switch (userData.role) {
          case UserRole.PATIENT:
            const patientData = userData.profileData as PatientProfileData;
            profile = await tx.patientProfile.create({
              data: {
                userId: user.id,
                name: patientData.name,
                age: patientData.age,
                gender: patientData.gender,
                phone: patientData.phone,
                address: patientData.address,
              },
            });
            break;

          case UserRole.DOCTOR:
            const doctorData = userData.profileData as DoctorProfileData;
            profile = await tx.doctorProfile.create({
              data: {
                userId: user.id,
                name: doctorData.name,
                profilePicture: doctorData.profilePicture || null,
                medicalLicenseNumber: doctorData.medicalLicenseNumber,
                qualifications: doctorData.qualifications,
                yearsOfExperience: doctorData.yearsOfExperience,
                specializations: doctorData.specializations,
                phone: doctorData.phone,
                clinicName: doctorData.clinicName,
                clinicAddress: doctorData.clinicAddress,
                consultationFee: doctorData.consultationFee,
              },
            });
            break;

          case UserRole.ADMIN:
            const adminData = userData.profileData as AdminProfileData;
            profile = await tx.adminProfile.create({
              data: {
                userId: user.id,
                name: adminData.name,
                phone: adminData.phone,
              },
            });
            break;

          default:
            throw new Error('Invalid user role');
        }

        return { user, profile };
      });

      // Generate tokens
      const tokens = AuthUtils.generateTokens({
        userId: result.user.id,
        email: result.user.email,
        role: result.user.role,
      });

      logger.info(`User registered successfully: ${result.user.email} (${result.user.role})`);

      return {
        user: {
          ...result.user,
          profile: result.profile,
        },
        tokens,
      };
    } catch (error) {
      logger.error('User registration failed:', error);
      throw error;
    }
  }

  /**
   * Login user with email and password
   */
  public static async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      // Find user with profile
      const user = await db.user.findUnique({
        where: { email: credentials.email },
        include: {
          patientProfile: true,
          doctorProfile: true,
          adminProfile: true,
        },
      });

      if (!user) {
        throw new Error('Invalid email or password');
      }

      if (!user.isActive) {
        throw new Error('Account has been deactivated');
      }

      // Verify password
      const isPasswordValid = await AuthUtils.verifyPassword(credentials.password, user.password);
      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      // Get the appropriate profile
      let profile: PatientProfile | DoctorProfile | AdminProfile | null = null;
      switch (user.role) {
        case UserRole.PATIENT:
          profile = user.patientProfile;
          break;
        case UserRole.DOCTOR:
          profile = user.doctorProfile;
          break;
        case UserRole.ADMIN:
          profile = user.adminProfile;
          break;
      }

      // Generate tokens
      const tokens = AuthUtils.generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      logger.info(`User logged in successfully: ${user.email}`);

      return {
        user: {
          ...user,
          profile,
        },
        tokens,
      };
    } catch (error) {
      logger.error('User login failed:', error);
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  public static async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      // Verify refresh token
      const payload = AuthUtils.verifyRefreshToken(refreshToken);

      // Check if user still exists and is active
      const user = await db.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
        },
      });

      if (!user || !user.isActive) {
        throw new Error('Invalid refresh token');
      }

      // Generate new tokens
      const tokens = AuthUtils.generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      logger.info(`Token refreshed for user: ${user.email}`);

      return tokens;
    } catch (error) {
      logger.error('Token refresh failed:', error);
      throw error;
    }
  }

  /**
   * Get user profile by ID
   */
  public static async getUserProfile(userId: string) {
    try {
      const user = await db.user.findUnique({
        where: { id: userId },
        include: {
          patientProfile: true,
          doctorProfile: true,
          adminProfile: true,
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Get the appropriate profile
      let profile: PatientProfile | DoctorProfile | AdminProfile | null = null;
      switch (user.role) {
        case UserRole.PATIENT:
          profile = user.patientProfile;
          break;
        case UserRole.DOCTOR:
          profile = user.doctorProfile;
          break;
        case UserRole.ADMIN:
          profile = user.adminProfile;
          break;
      }

      return {
        ...user,
        profile,
      };
    } catch (error) {
      logger.error('Failed to get user profile:', error);
      throw error;
    }
  }

  /**
   * Update user password
   */
  public static async updatePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    try {
      const user = await db.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await AuthUtils.verifyPassword(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Validate new password strength
      const passwordValidation = AuthUtils.validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
      }

      // Hash new password
      const hashedNewPassword = await AuthUtils.hashPassword(newPassword);

      // Update password
      await db.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword },
      });

      logger.info(`Password updated for user: ${user.email}`);
    } catch (error) {
      logger.error('Password update failed:', error);
      throw error;
    }
  }

  /**
   * Deactivate user account
   */
  public static async deactivateAccount(userId: string): Promise<void> {
    try {
      const user = await db.user.update({
        where: { id: userId },
        data: { isActive: false },
      });

      logger.info(`Account deactivated for user: ${user.email}`);
    } catch (error) {
      logger.error('Account deactivation failed:', error);
      throw error;
    }
  }

  /**
   * Verify user email (placeholder for email verification implementation)
   */
  public static async verifyEmail(userId: string): Promise<void> {
    try {
      const user = await db.user.update({
        where: { id: userId },
        data: { isVerified: true },
      });

      logger.info(`Email verified for user: ${user.email}`);
    } catch (error) {
      logger.error('Email verification failed:', error);
      throw error;
    }
  }
}