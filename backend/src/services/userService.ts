import { UserRole } from '@prisma/client';
import { db as prisma } from './database';
import {
  UserWithProfile,
  PatientProfileUpdate,
  DoctorProfileUpdate,
  AdminProfileUpdate,
  DoctorSearchCriteria,
  SearchFilters,
  DoctorSearchResult,
  PaginatedResult,
  DoctorVerificationRequest,
  GeoLocation
} from '../types/user';
import { logger } from '../utils/logger';



export class UserService {
  // Get user with profile by ID
  async getUserWithProfile(userId: string): Promise<UserWithProfile | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          patientProfile: true,
          doctorProfile: true,
          adminProfile: true
        }
      });

      return user;
    } catch (error) {
      logger.error('Error fetching user with profile:', error);
      throw new Error('Failed to fetch user profile');
    }
  }

  // Update patient profile
  async updatePatientProfile(userId: string, updates: PatientProfileUpdate): Promise<UserWithProfile> {
    try {
      // First verify the user exists and is a patient
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { patientProfile: true }
      });

      if (!user || user.role !== UserRole.PATIENT) {
        throw new Error('User not found or not a patient');
      }

      // Update the patient profile
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          patientProfile: {
            update: updates
          }
        },
        include: {
          patientProfile: true,
          doctorProfile: true,
          adminProfile: true
        }
      });

      logger.info(`Patient profile updated for user ${userId}`);
      return updatedUser;
    } catch (error) {
      logger.error('Error updating patient profile:', error);
      throw error;
    }
  }

  // Update doctor profile
  async updateDoctorProfile(userId: string, updates: DoctorProfileUpdate): Promise<UserWithProfile> {
    try {
      // First verify the user exists and is a doctor
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { doctorProfile: true }
      });

      if (!user || user.role !== UserRole.DOCTOR) {
        throw new Error('User not found or not a doctor');
      }

      // Update the doctor profile
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          doctorProfile: {
            update: updates
          }
        },
        include: {
          patientProfile: true,
          doctorProfile: true,
          adminProfile: true
        }
      });

      logger.info(`Doctor profile updated for user ${userId}`);
      return updatedUser;
    } catch (error) {
      logger.error('Error updating doctor profile:', error);
      throw error;
    }
  }

  // Update admin profile
  async updateAdminProfile(userId: string, updates: AdminProfileUpdate): Promise<UserWithProfile> {
    try {
      // First verify the user exists and is an admin
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { adminProfile: true }
      });

      if (!user || user.role !== UserRole.ADMIN) {
        throw new Error('User not found or not an admin');
      }

      // Update the admin profile
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          adminProfile: {
            update: updates
          }
        },
        include: {
          patientProfile: true,
          doctorProfile: true,
          adminProfile: true
        }
      });

      logger.info(`Admin profile updated for user ${userId}`);
      return updatedUser;
    } catch (error) {
      logger.error('Error updating admin profile:', error);
      throw error;
    }
  }

  // Search doctors with filtering and pagination
  async searchDoctors(
    criteria: DoctorSearchCriteria,
    filters: SearchFilters = {}
  ): Promise<PaginatedResult<DoctorSearchResult>> {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'rating',
        sortOrder = 'desc'
      } = filters;

      const skip = (page - 1) * limit;

      // Build where clause
      const whereClause: any = {
        licenseVerified: true,
        isAcceptingPatients: criteria.isAcceptingPatients ?? true
      };

      if (criteria.name) {
        whereClause.name = {
          contains: criteria.name,
          mode: 'insensitive'
        };
      }

      if (criteria.specialization) {
        whereClause.specializations = {
          has: criteria.specialization
        };
      }

      if (criteria.minRating) {
        whereClause.rating = {
          gte: criteria.minRating
        };
      }

      if (criteria.maxConsultationFee) {
        whereClause.consultationFee = {
          lte: criteria.maxConsultationFee
        };
      }

      if (criteria.location) {
        whereClause.clinicAddress = {
          contains: criteria.location,
          mode: 'insensitive'
        };
      }

      // Build order by clause
      const orderBy: any = {};
      switch (sortBy) {
        case 'name':
          orderBy.name = sortOrder;
          break;
        case 'rating':
          orderBy.rating = sortOrder;
          break;
        case 'experience':
          orderBy.yearsOfExperience = sortOrder;
          break;
        case 'fee':
          orderBy.consultationFee = sortOrder;
          break;
        default:
          orderBy.rating = 'desc';
      }

      // Execute search query
      const [doctors, total] = await Promise.all([
        prisma.doctorProfile.findMany({
          where: whereClause,
          orderBy,
          skip,
          take: limit,
          select: {
            id: true,
            name: true,
            profilePicture: true,
            specializations: true,
            yearsOfExperience: true,
            rating: true,
            totalReviews: true,
            consultationFee: true,
            clinicName: true,
            clinicAddress: true,
            isAcceptingPatients: true
          }
        }),
        prisma.doctorProfile.count({ where: whereClause })
      ]);

      // Calculate distance if location-based search
      let results: DoctorSearchResult[] = doctors.map(doctor => ({
        id: doctor.id,
        name: doctor.name,
        profilePicture: doctor.profilePicture || undefined,
        specializations: doctor.specializations,
        yearsOfExperience: doctor.yearsOfExperience,
        rating: Number(doctor.rating),
        totalReviews: doctor.totalReviews,
        consultationFee: Number(doctor.consultationFee),
        clinicName: doctor.clinicName,
        clinicAddress: doctor.clinicAddress,
        isAcceptingPatients: doctor.isAcceptingPatients
      }));

      // If location-based search, calculate distances
      if (criteria.latitude && criteria.longitude) {
        results = await this.calculateDistances(results, {
          latitude: criteria.latitude,
          longitude: criteria.longitude
        });

        // Filter by radius if specified
        if (criteria.radius) {
          results = results.filter(doctor => 
            doctor.distance !== undefined && doctor.distance <= criteria.radius!
          );
        }

        // Sort by distance if location-based
        results.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      }

      const totalPages = Math.ceil(total / limit);

      return {
        data: results,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      };
    } catch (error) {
      logger.error('Error searching doctors:', error);
      throw new Error('Failed to search doctors');
    }
  }

  // Calculate distances between user location and doctors
  private async calculateDistances(
    doctors: DoctorSearchResult[],
    _userLocation: GeoLocation
  ): Promise<DoctorSearchResult[]> {
    // This is a simplified distance calculation
    // In a real implementation, you would use Google Maps Distance Matrix API
    // or a proper geocoding service to get accurate distances
    
    return doctors.map(doctor => {
      // For now, we'll use a placeholder distance calculation
      // In reality, you'd geocode the clinic address and calculate real distance
      const distance = Math.random() * 50; // Random distance for demo
      return {
        ...doctor,
        distance: Math.round(distance * 100) / 100 // Round to 2 decimal places
      };
    });
  }

  // Get all doctors pending verification (admin only)
  async getDoctorsPendingVerification(): Promise<DoctorSearchResult[]> {
    try {
      const doctors = await prisma.doctorProfile.findMany({
        where: {
          licenseVerified: false
        },
        select: {
          id: true,
          name: true,
          profilePicture: true,
          medicalLicenseNumber: true,
          specializations: true,
          yearsOfExperience: true,
          rating: true,
          totalReviews: true,
          consultationFee: true,
          clinicName: true,
          clinicAddress: true,
          isAcceptingPatients: true,
          createdAt: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      return doctors.map((doctor: any) => ({
        id: doctor.id,
        name: doctor.name,
        profilePicture: doctor.profilePicture || undefined,
        specializations: doctor.specializations,
        yearsOfExperience: doctor.yearsOfExperience,
        rating: Number(doctor.rating),
        totalReviews: doctor.totalReviews,
        consultationFee: Number(doctor.consultationFee),
        clinicName: doctor.clinicName,
        clinicAddress: doctor.clinicAddress,
        isAcceptingPatients: doctor.isAcceptingPatients
      }));
    } catch (error) {
      logger.error('Error fetching doctors pending verification:', error);
      throw new Error('Failed to fetch doctors pending verification');
    }
  }

  // Verify doctor license (admin only)
  async verifyDoctorLicense(request: DoctorVerificationRequest): Promise<void> {
    try {
      await prisma.doctorProfile.update({
        where: { id: request.doctorId },
        data: {
          licenseVerified: request.licenseVerified,
          updatedAt: new Date()
        }
      });

      logger.info(`Doctor ${request.doctorId} license verification updated to ${request.licenseVerified}`);
    } catch (error) {
      logger.error('Error verifying doctor license:', error);
      throw new Error('Failed to verify doctor license');
    }
  }

  // Get doctor by ID with full details
  async getDoctorById(doctorId: string): Promise<DoctorSearchResult | null> {
    try {
      const doctor = await prisma.doctorProfile.findUnique({
        where: { id: doctorId },
        select: {
          id: true,
          name: true,
          profilePicture: true,
          specializations: true,
          yearsOfExperience: true,
          rating: true,
          totalReviews: true,
          consultationFee: true,
          clinicName: true,
          clinicAddress: true,
          isAcceptingPatients: true,
          qualifications: true,
          medicalLicenseNumber: true,
          licenseVerified: true
        }
      });

      if (!doctor) {
        return null;
      }

      return {
        id: doctor.id,
        name: doctor.name,
        profilePicture: doctor.profilePicture || undefined,
        specializations: doctor.specializations,
        yearsOfExperience: doctor.yearsOfExperience,
        rating: Number(doctor.rating),
        totalReviews: doctor.totalReviews,
        consultationFee: Number(doctor.consultationFee),
        clinicName: doctor.clinicName,
        clinicAddress: doctor.clinicAddress,
        isAcceptingPatients: doctor.isAcceptingPatients
      };
    } catch (error) {
      logger.error('Error fetching doctor by ID:', error);
      throw new Error('Failed to fetch doctor details');
    }
  }
}

export const userService = new UserService();