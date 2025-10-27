import { Request } from 'express';
import { User, UserRole, PatientProfile, DoctorProfile, AdminProfile } from '@prisma/client';

export interface AuthenticatedUser extends User {
  profile: PatientProfile | DoctorProfile | AdminProfile | null;
}

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload & {
    isVerified: boolean;
    isActive: boolean;
    profile?: any;
  };
}

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

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface UpdatePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface PatientRegistrationRequest {
  email: string;
  password: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  address: string;
}

export interface DoctorRegistrationRequest {
  email: string;
  password: string;
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

export interface AdminRegistrationRequest {
  email: string;
  password: string;
  name: string;
  phone: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    role: UserRole;
    isVerified: boolean;
    profile: PatientProfile | DoctorProfile | AdminProfile | null;
  };
  tokens: AuthTokens;
}

export interface ApiResponse<T = any> {
  message: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
  };
  timestamp: string;
}