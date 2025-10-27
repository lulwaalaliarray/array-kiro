import type { PatientProfile, DoctorProfile, AdminProfile, UserRole } from '@prisma/client';

// Extended user types with profile relationships
export interface UserWithProfile {
  id: string;
  email: string;
  password: string;
  role: UserRole;
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  patientProfile?: PatientProfile | null;
  doctorProfile?: DoctorProfile | null;
  adminProfile?: AdminProfile | null;
}

// Profile update interfaces
export interface PatientProfileUpdate {
  name?: string;
  age?: number;
  gender?: string;
  phone?: string;
  address?: string;
}

export interface DoctorProfileUpdate {
  name?: string;
  profilePicture?: string;
  qualifications?: string[];
  yearsOfExperience?: number;
  specializations?: string[];
  phone?: string;
  clinicName?: string;
  clinicAddress?: string;
  consultationFee?: number;
  isAcceptingPatients?: boolean;
}

export interface AdminProfileUpdate {
  name?: string;
  phone?: string;
}

// Search and filtering interfaces
export interface DoctorSearchCriteria {
  name?: string;
  specialization?: string;
  location?: string;
  minRating?: number;
  maxConsultationFee?: number;
  isAcceptingPatients?: boolean;
  latitude?: number;
  longitude?: number;
  radius?: number; // in kilometers
}

export interface SearchFilters {
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'rating' | 'experience' | 'fee';
  sortOrder?: 'asc' | 'desc';
}

export interface DoctorSearchResult {
  id: string;
  name: string;
  profilePicture?: string | undefined;
  specializations: string[];
  yearsOfExperience: number;
  rating: number;
  totalReviews: number;
  consultationFee: number;
  clinicName: string;
  clinicAddress: string;
  isAcceptingPatients: boolean;
  distance?: number | undefined; // in kilometers, if location-based search
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Doctor verification interfaces
export interface DoctorVerificationRequest {
  doctorId: string;
  licenseVerified: boolean;
  adminNotes?: string | undefined;
}

export interface DoctorVerificationResponse {
  id: string;
  name: string;
  medicalLicenseNumber: string;
  licenseVerified: boolean;
  verifiedAt?: Date;
  adminNotes?: string;
}

// File upload interfaces
export interface FileUploadRequest {
  file: Express.Multer.File;
  userId: string;
}

export interface FileUploadResponse {
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
}

// Location interfaces for Google Maps integration
export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export interface LocationSearchRequest {
  query: string;
  location?: GeoLocation;
  radius?: number;
  type?: 'doctor' | 'hospital' | 'clinic';
}

export interface LocationSearchResult {
  id: string;
  name: string;
  address: string;
  location: GeoLocation;
  type: 'doctor' | 'hospital' | 'clinic';
  rating?: number;
  distance?: number;
}

// Google Maps API interfaces
export interface GoogleMapsConfig {
  apiKey: string;
  libraries: string[];
}

export interface PlaceSearchRequest {
  query: string;
  location?: GeoLocation;
  radius?: number;
  type?: string;
}

export interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
  types: string[];
}