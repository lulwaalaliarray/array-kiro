import { Response } from 'express';
import { UserRole } from '@prisma/client';
import { userService } from '../services/userService';
import { googleMapsService } from '../services/googleMapsService';
import { fileUploadService } from '../services/fileUploadService';
import {
  PatientProfileUpdate,
  DoctorProfileUpdate,
  AdminProfileUpdate,
  DoctorSearchCriteria,
  SearchFilters,
  DoctorVerificationRequest,
  LocationSearchRequest
} from '../types/user';
import { Request } from 'express';
import { logger } from '../utils/logger';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: UserRole;
    isVerified: boolean;
    isActive: boolean;
  };
}

export class UserController {
  // Get current user profile
  async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const user = await userService.getUserWithProfile(userId);

      if (!user) {
        res.status(404).json({
          message: 'User not found',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Return profile based on user role
      let profile;
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

      res.json({
        message: 'Profile retrieved successfully',
        data: {
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            isVerified: user.isVerified,
            isActive: user.isActive
          },
          profile
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error getting user profile:', error);
      res.status(500).json({
        message: 'Internal server error',
        error: {
          code: 'PROFILE_FETCH_ERROR',
          message: 'Failed to fetch user profile',
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  // Update patient profile
  async updatePatientProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const updates: PatientProfileUpdate = req.body;

      // Validate user role
      if (req.user!.role !== UserRole.PATIENT) {
        res.status(403).json({
          message: 'Access denied. Patient role required.',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const updatedUser = await userService.updatePatientProfile(userId, updates);

      res.json({
        message: 'Patient profile updated successfully',
        data: {
          profile: updatedUser.patientProfile
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error updating patient profile:', error);
      res.status(500).json({
        message: 'Internal server error',
        error: {
          code: 'PROFILE_UPDATE_ERROR',
          message: 'Failed to update patient profile',
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  // Update doctor profile
  async updateDoctorProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const updates: DoctorProfileUpdate = req.body;

      // Validate user role
      if (req.user!.role !== UserRole.DOCTOR) {
        res.status(403).json({
          message: 'Access denied. Doctor role required.',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const updatedUser = await userService.updateDoctorProfile(userId, updates);

      res.json({
        message: 'Doctor profile updated successfully',
        data: {
          profile: updatedUser.doctorProfile
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error updating doctor profile:', error);
      res.status(500).json({
        message: 'Internal server error',
        error: {
          code: 'PROFILE_UPDATE_ERROR',
          message: 'Failed to update doctor profile',
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  // Update admin profile
  async updateAdminProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const updates: AdminProfileUpdate = req.body;

      // Validate user role
      if (req.user!.role !== UserRole.ADMIN) {
        res.status(403).json({
          message: 'Access denied. Admin role required.',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const updatedUser = await userService.updateAdminProfile(userId, updates);

      res.json({
        message: 'Admin profile updated successfully',
        data: {
          profile: updatedUser.adminProfile
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error updating admin profile:', error);
      res.status(500).json({
        message: 'Internal server error',
        error: {
          code: 'PROFILE_UPDATE_ERROR',
          message: 'Failed to update admin profile',
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  // Search doctors
  async searchDoctors(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Only patients and admins can search doctors
      if (req.user!.role !== UserRole.PATIENT && req.user!.role !== UserRole.ADMIN) {
        res.status(403).json({
          message: 'Access denied. Patient or Admin role required.',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const criteria: DoctorSearchCriteria = {};
      
      if (req.query['name']) criteria.name = req.query['name'] as string;
      if (req.query['specialization']) criteria.specialization = req.query['specialization'] as string;
      if (req.query['location']) criteria.location = req.query['location'] as string;
      if (req.query['minRating']) criteria.minRating = parseFloat(req.query['minRating'] as string);
      if (req.query['maxConsultationFee']) criteria.maxConsultationFee = parseFloat(req.query['maxConsultationFee'] as string);
      if (req.query['isAcceptingPatients'] === 'true') criteria.isAcceptingPatients = true;
      if (req.query['latitude']) criteria.latitude = parseFloat(req.query['latitude'] as string);
      if (req.query['longitude']) criteria.longitude = parseFloat(req.query['longitude'] as string);
      if (req.query['radius']) criteria.radius = parseFloat(req.query['radius'] as string);

      const filters: SearchFilters = {
        page: req.query['page'] ? parseInt(req.query['page'] as string) : 1,
        limit: req.query['limit'] ? parseInt(req.query['limit'] as string) : 10,
        sortBy: req.query['sortBy'] as 'name' | 'rating' | 'experience' | 'fee',
        sortOrder: req.query['sortOrder'] as 'asc' | 'desc'
      };

      const results = await userService.searchDoctors(criteria, filters);

      res.json({
        message: 'Doctors retrieved successfully',
        data: results,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error searching doctors:', error);
      res.status(500).json({
        message: 'Internal server error',
        error: {
          code: 'DOCTOR_SEARCH_ERROR',
          message: 'Failed to search doctors',
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  // Get doctor by ID
  async getDoctorById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const doctorId = req.params['doctorId'];

      if (!doctorId) {
        res.status(400).json({
          message: 'Doctor ID is required',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Only patients and admins can view doctor details
      if (req.user!.role !== UserRole.PATIENT && req.user!.role !== UserRole.ADMIN) {
        res.status(403).json({
          message: 'Access denied. Patient or Admin role required.',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const doctor = await userService.getDoctorById(doctorId);

      if (!doctor) {
        res.status(404).json({
          message: 'Doctor not found',
          timestamp: new Date().toISOString()
        });
        return;
      }

      res.json({
        message: 'Doctor details retrieved successfully',
        data: doctor,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error getting doctor by ID:', error);
      res.status(500).json({
        message: 'Internal server error',
        error: {
          code: 'DOCTOR_FETCH_ERROR',
          message: 'Failed to fetch doctor details',
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  // Get doctors pending verification (admin only)
  async getDoctorsPendingVerification(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Only admins can access this endpoint
      if (req.user!.role !== UserRole.ADMIN) {
        res.status(403).json({
          message: 'Access denied. Admin role required.',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const doctors = await userService.getDoctorsPendingVerification();

      res.json({
        message: 'Doctors pending verification retrieved successfully',
        data: doctors,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error getting doctors pending verification:', error);
      res.status(500).json({
        message: 'Internal server error',
        error: {
          code: 'VERIFICATION_FETCH_ERROR',
          message: 'Failed to fetch doctors pending verification',
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  // Verify doctor license (admin only)
  async verifyDoctorLicense(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Only admins can verify doctors
      if (req.user!.role !== UserRole.ADMIN) {
        res.status(403).json({
          message: 'Access denied. Admin role required.',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const doctorId = req.params['doctorId'];
      const { licenseVerified, adminNotes }: DoctorVerificationRequest = req.body;

      if (!doctorId) {
        res.status(400).json({
          message: 'Doctor ID is required',
          timestamp: new Date().toISOString()
        });
        return;
      }

      await userService.verifyDoctorLicense({
        doctorId,
        licenseVerified,
        adminNotes
      });

      res.json({
        message: `Doctor license ${licenseVerified ? 'verified' : 'rejected'} successfully`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error verifying doctor license:', error);
      res.status(500).json({
        message: 'Internal server error',
        error: {
          code: 'VERIFICATION_ERROR',
          message: 'Failed to verify doctor license',
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  // Upload profile image
  async uploadProfileImage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const file = req.file;

      if (!file) {
        res.status(400).json({
          message: 'No file uploaded',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const uploadResult = await fileUploadService.uploadProfileImage({
        file,
        userId
      });

      // Update user profile with new image URL
      if (req.user!.role === UserRole.DOCTOR) {
        await userService.updateDoctorProfile(userId, {
          profilePicture: uploadResult.fileUrl
        });
      }

      res.json({
        message: 'Profile image uploaded successfully',
        data: uploadResult,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error uploading profile image:', error);
      res.status(500).json({
        message: 'Internal server error',
        error: {
          code: 'UPLOAD_ERROR',
          message: 'Failed to upload profile image',
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  // Search nearby healthcare providers using Google Maps
  async searchNearbyProviders(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Only patients and admins can search providers
      if (req.user!.role !== UserRole.PATIENT && req.user!.role !== UserRole.ADMIN) {
        res.status(403).json({
          message: 'Access denied. Patient or Admin role required.',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const searchRequest: LocationSearchRequest = {
        query: req.query['query'] as string || 'healthcare'
      };

      if (req.query['latitude'] && req.query['longitude']) {
        searchRequest.location = {
          latitude: parseFloat(req.query['latitude'] as string),
          longitude: parseFloat(req.query['longitude'] as string)
        };
      }

      if (req.query['radius']) {
        searchRequest.radius = parseInt(req.query['radius'] as string);
      } else {
        searchRequest.radius = 10000;
      }

      if (req.query['type']) {
        searchRequest.type = req.query['type'] as 'doctor' | 'hospital' | 'clinic';
      }

      const providers = await googleMapsService.searchNearbyProviders(searchRequest);

      res.json({
        message: 'Nearby providers retrieved successfully',
        data: providers,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error searching nearby providers:', error);
      res.status(500).json({
        message: 'Internal server error',
        error: {
          code: 'PROVIDER_SEARCH_ERROR',
          message: 'Failed to search nearby providers',
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  // Geocode address
  async geocodeAddress(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const address = req.query['address'];

      if (!address) {
        res.status(400).json({
          message: 'Address parameter is required',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const location = await googleMapsService.geocodeAddress(address as string);

      if (!location) {
        res.status(404).json({
          message: 'Address not found',
          timestamp: new Date().toISOString()
        });
        return;
      }

      res.json({
        message: 'Address geocoded successfully',
        data: location,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error geocoding address:', error);
      res.status(500).json({
        message: 'Internal server error',
        error: {
          code: 'GEOCODING_ERROR',
          message: 'Failed to geocode address',
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      });
    }
  }
}

export const userController = new UserController();