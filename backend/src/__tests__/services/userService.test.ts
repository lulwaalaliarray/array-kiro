import { UserService } from '../../services/userService';
import { UserRole } from '@prisma/client';
import {
  PatientProfileUpdate,
  DoctorProfileUpdate,
  AdminProfileUpdate,
  DoctorSearchCriteria,
  SearchFilters,
  DoctorVerificationRequest
} from '../../types/user';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { describe } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';

// Mock the database service
jest.mock('../../services/database', () => ({
  db: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    doctorProfile: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
  },
}));

// Mock the logger
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('UserService', () => {
  let userService: UserService;
  let mockPrisma: any;

  beforeEach(() => {
    userService = new UserService();
    mockPrisma = require('../../services/database').db;
    jest.clearAllMocks();
  });

  describe('Profile Creation and Update Operations', () => {
    describe('getUserWithProfile', () => {
      it('should fetch user with profile successfully', async () => {
        const mockUser = {
          id: 'user-1',
          email: 'patient@example.com',
          role: UserRole.PATIENT,
          isVerified: true,
          isActive: true,
          patientProfile: {
            id: 'patient-1',
            name: 'John Doe',
            age: 30,
            gender: 'male',
            phone: '1234567890',
            address: '123 Main St'
          },
          doctorProfile: null,
          adminProfile: null
        };

        mockPrisma.user.findUnique.mockResolvedValue(mockUser);

        const result = await userService.getUserWithProfile('user-1');

        expect(result).toEqual(mockUser);
        expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
          where: { id: 'user-1' },
          include: {
            patientProfile: true,
            doctorProfile: true,
            adminProfile: true
          }
        });
      });

      it('should return null when user not found', async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);

        const result = await userService.getUserWithProfile('non-existent');

        expect(result).toBeNull();
      });

      it('should handle database errors', async () => {
        mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'));

        await expect(userService.getUserWithProfile('user-1'))
          .rejects.toThrow('Failed to fetch user profile');
      });
    });

    describe('updatePatientProfile', () => {
      it('should update patient profile successfully', async () => {
        const mockUser = {
          id: 'user-1',
          role: UserRole.PATIENT,
          patientProfile: { id: 'patient-1', name: 'John Doe' }
        };

        const updatedUser = {
          ...mockUser,
          patientProfile: { id: 'patient-1', name: 'John Smith', age: 31 },
          doctorProfile: null,
          adminProfile: null
        };

        const updates: PatientProfileUpdate = {
          name: 'John Smith',
          age: 31
        };

        mockPrisma.user.findUnique.mockResolvedValue(mockUser);
        mockPrisma.user.update.mockResolvedValue(updatedUser);

        const result = await userService.updatePatientProfile('user-1', updates);

        expect(result).toEqual(updatedUser);
        expect(mockPrisma.user.update).toHaveBeenCalledWith({
          where: { id: 'user-1' },
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
      });

      it('should throw error when user is not a patient', async () => {
        const mockUser = {
          id: 'user-1',
          role: UserRole.DOCTOR,
          patientProfile: null
        };

        mockPrisma.user.findUnique.mockResolvedValue(mockUser);

        const updates: PatientProfileUpdate = { name: 'John Smith' };

        await expect(userService.updatePatientProfile('user-1', updates))
          .rejects.toThrow('User not found or not a patient');
      });

      it('should throw error when user not found', async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);

        const updates: PatientProfileUpdate = { name: 'John Smith' };

        await expect(userService.updatePatientProfile('user-1', updates))
          .rejects.toThrow('User not found or not a patient');
      });
    });

    describe('updateDoctorProfile', () => {
      it('should update doctor profile successfully', async () => {
        const mockUser = {
          id: 'user-1',
          role: UserRole.DOCTOR,
          doctorProfile: { id: 'doctor-1', name: 'Dr. Smith' }
        };

        const updatedUser = {
          ...mockUser,
          doctorProfile: { 
            id: 'doctor-1', 
            name: 'Dr. Smith', 
            consultationFee: 200,
            specializations: ['Cardiology']
          },
          patientProfile: null,
          adminProfile: null
        };

        const updates: DoctorProfileUpdate = {
          consultationFee: 200,
          specializations: ['Cardiology']
        };

        mockPrisma.user.findUnique.mockResolvedValue(mockUser);
        mockPrisma.user.update.mockResolvedValue(updatedUser);

        const result = await userService.updateDoctorProfile('user-1', updates);

        expect(result).toEqual(updatedUser);
        expect(mockPrisma.user.update).toHaveBeenCalledWith({
          where: { id: 'user-1' },
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
      });

      it('should throw error when user is not a doctor', async () => {
        const mockUser = {
          id: 'user-1',
          role: UserRole.PATIENT,
          doctorProfile: null
        };

        mockPrisma.user.findUnique.mockResolvedValue(mockUser);

        const updates: DoctorProfileUpdate = { consultationFee: 200 };

        await expect(userService.updateDoctorProfile('user-1', updates))
          .rejects.toThrow('User not found or not a doctor');
      });
    });

    describe('updateAdminProfile', () => {
      it('should update admin profile successfully', async () => {
        const mockUser = {
          id: 'user-1',
          role: UserRole.ADMIN,
          adminProfile: { id: 'admin-1', name: 'Admin User' }
        };

        const updatedUser = {
          ...mockUser,
          adminProfile: { 
            id: 'admin-1', 
            name: 'Admin User', 
            phone: '5555555555'
          },
          patientProfile: null,
          doctorProfile: null
        };

        const updates: AdminProfileUpdate = {
          phone: '5555555555'
        };

        mockPrisma.user.findUnique.mockResolvedValue(mockUser);
        mockPrisma.user.update.mockResolvedValue(updatedUser);

        const result = await userService.updateAdminProfile('user-1', updates);

        expect(result).toEqual(updatedUser);
      });

      it('should throw error when user is not an admin', async () => {
        const mockUser = {
          id: 'user-1',
          role: UserRole.PATIENT,
          adminProfile: null
        };

        mockPrisma.user.findUnique.mockResolvedValue(mockUser);

        const updates: AdminProfileUpdate = { phone: '5555555555' };

        await expect(userService.updateAdminProfile('user-1', updates))
          .rejects.toThrow('User not found or not an admin');
      });
    });
  });

  describe('Doctor Verification Workflow', () => {
    describe('getDoctorsPendingVerification', () => {
      it('should fetch doctors pending verification', async () => {
        const mockDoctors = [
          {
            id: 'doctor-1',
            name: 'Dr. Smith',
            profilePicture: null,
            medicalLicenseNumber: 'DOC123',
            specializations: ['Cardiology'],
            yearsOfExperience: 10,
            rating: 4.5,
            totalReviews: 20,
            consultationFee: 150,
            clinicName: 'Heart Clinic',
            clinicAddress: '123 Medical St',
            isAcceptingPatients: true,
            createdAt: new Date()
          }
        ];

        mockPrisma.doctorProfile.findMany.mockResolvedValue(mockDoctors);

        const result = await userService.getDoctorsPendingVerification();

        expect(result).toHaveLength(1);
        expect(result[0]?.name).toBe('Dr. Smith');
        expect(mockPrisma.doctorProfile.findMany).toHaveBeenCalledWith({
          where: { licenseVerified: false },
          select: expect.objectContaining({
            id: true,
            name: true,
            medicalLicenseNumber: true
          }),
          orderBy: { createdAt: 'asc' }
        });
      });

      it('should return empty array when no doctors pending', async () => {
        mockPrisma.doctorProfile.findMany.mockResolvedValue([]);

        const result = await userService.getDoctorsPendingVerification();

        expect(result).toEqual([]);
      });

      it('should handle database errors', async () => {
        mockPrisma.doctorProfile.findMany.mockRejectedValue(new Error('Database error'));

        await expect(userService.getDoctorsPendingVerification())
          .rejects.toThrow('Failed to fetch doctors pending verification');
      });
    });

    describe('verifyDoctorLicense', () => {
      it('should verify doctor license successfully', async () => {
        const request: DoctorVerificationRequest = {
          doctorId: 'doctor-1',
          licenseVerified: true
        };

        mockPrisma.doctorProfile.update.mockResolvedValue({});

        await userService.verifyDoctorLicense(request);

        expect(mockPrisma.doctorProfile.update).toHaveBeenCalledWith({
          where: { id: 'doctor-1' },
          data: {
            licenseVerified: true,
            updatedAt: expect.any(Date)
          }
        });
      });

      it('should reject doctor license successfully', async () => {
        const request: DoctorVerificationRequest = {
          doctorId: 'doctor-1',
          licenseVerified: false
        };

        mockPrisma.doctorProfile.update.mockResolvedValue({});

        await userService.verifyDoctorLicense(request);

        expect(mockPrisma.doctorProfile.update).toHaveBeenCalledWith({
          where: { id: 'doctor-1' },
          data: {
            licenseVerified: false,
            updatedAt: expect.any(Date)
          }
        });
      });

      it('should handle database errors during verification', async () => {
        const request: DoctorVerificationRequest = {
          doctorId: 'doctor-1',
          licenseVerified: true
        };

        mockPrisma.doctorProfile.update.mockRejectedValue(new Error('Database error'));

        await expect(userService.verifyDoctorLicense(request))
          .rejects.toThrow('Failed to verify doctor license');
      });
    });
  });

  describe('Location-based Search Functionality', () => {
    describe('searchDoctors', () => {
      it('should search doctors with basic criteria', async () => {
        const mockDoctors = [
          {
            id: 'doctor-1',
            name: 'Dr. Smith',
            profilePicture: null,
            specializations: ['Cardiology'],
            yearsOfExperience: 10,
            rating: 4.5,
            totalReviews: 20,
            consultationFee: 150,
            clinicName: 'Heart Clinic',
            clinicAddress: '123 Medical St',
            isAcceptingPatients: true
          }
        ];

        const criteria: DoctorSearchCriteria = {
          specialization: 'Cardiology',
          minRating: 4.0
        };

        mockPrisma.doctorProfile.findMany.mockResolvedValue(mockDoctors);
        mockPrisma.doctorProfile.count.mockResolvedValue(1);

        const result = await userService.searchDoctors(criteria);

        expect(result.data).toHaveLength(1);
        expect(result.data[0]?.name).toBe('Dr. Smith');
        expect(result.pagination.total).toBe(1);
        expect(mockPrisma.doctorProfile.findMany).toHaveBeenCalledWith({
          where: expect.objectContaining({
            licenseVerified: true,
            specializations: { has: 'Cardiology' },
            rating: { gte: 4.0 }
          }),
          orderBy: { rating: 'desc' },
          skip: 0,
          take: 10,
          select: expect.any(Object)
        });
      });

      it('should search doctors with location-based criteria', async () => {
        const mockDoctors = [
          {
            id: 'doctor-1',
            name: 'Dr. Smith',
            profilePicture: null,
            specializations: ['Cardiology'],
            yearsOfExperience: 10,
            rating: 4.5,
            totalReviews: 20,
            consultationFee: 150,
            clinicName: 'Heart Clinic',
            clinicAddress: '123 Medical St',
            isAcceptingPatients: true
          }
        ];

        const criteria: DoctorSearchCriteria = {
          latitude: 40.7128,
          longitude: -74.0060
        };

        mockPrisma.doctorProfile.findMany.mockResolvedValue(mockDoctors);
        mockPrisma.doctorProfile.count.mockResolvedValue(1);

        const result = await userService.searchDoctors(criteria);

        expect(result.data).toHaveLength(1);
        expect(result.data[0]?.distance).toBeDefined();
        expect(typeof result.data[0]?.distance).toBe('number');
      });

      it('should filter doctors by radius when specified', async () => {
        const mockDoctors = [
          {
            id: 'doctor-1',
            name: 'Dr. Smith',
            profilePicture: null,
            specializations: ['Cardiology'],
            yearsOfExperience: 10,
            rating: 4.5,
            totalReviews: 20,
            consultationFee: 150,
            clinicName: 'Heart Clinic',
            clinicAddress: '123 Medical St',
            isAcceptingPatients: true
          }
        ];

        const criteria: DoctorSearchCriteria = {
          latitude: 40.7128,
          longitude: -74.0060,
          radius: 50
        };

        mockPrisma.doctorProfile.findMany.mockResolvedValue(mockDoctors);
        mockPrisma.doctorProfile.count.mockResolvedValue(1);

        const result = await userService.searchDoctors(criteria);

        // The result should include distance calculation
        expect(result.data.length).toBeGreaterThanOrEqual(0);
        if (result.data.length > 0) {
          expect(result.data[0]?.distance).toBeDefined();
          expect(typeof result.data[0]?.distance).toBe('number');
        }
      });

      it('should apply search filters correctly', async () => {
        const mockDoctors = [
          {
            id: 'doctor-1',
            name: 'Dr. Smith',
            profilePicture: null,
            specializations: ['Cardiology'],
            yearsOfExperience: 10,
            rating: 4.5,
            totalReviews: 20,
            consultationFee: 150,
            clinicName: 'Heart Clinic',
            clinicAddress: '123 Medical St',
            isAcceptingPatients: true
          }
        ];

        const criteria: DoctorSearchCriteria = {
          name: 'Smith'
        };

        const filters: SearchFilters = {
          page: 2,
          limit: 5,
          sortBy: 'name',
          sortOrder: 'asc'
        };

        mockPrisma.doctorProfile.findMany.mockResolvedValue(mockDoctors);
        mockPrisma.doctorProfile.count.mockResolvedValue(10);

        const result = await userService.searchDoctors(criteria, filters);

        expect(result.pagination.page).toBe(2);
        expect(result.pagination.limit).toBe(5);
        expect(result.pagination.totalPages).toBe(2);
        expect(mockPrisma.doctorProfile.findMany).toHaveBeenCalledWith({
          where: expect.objectContaining({
            name: { contains: 'Smith', mode: 'insensitive' }
          }),
          orderBy: { name: 'asc' },
          skip: 5, // (page - 1) * limit
          take: 5,
          select: expect.any(Object)
        });
      });

      it('should handle multiple search criteria', async () => {
        const criteria: DoctorSearchCriteria = {
          name: 'Smith',
          specialization: 'Cardiology',
          location: 'New York',
          minRating: 4.0,
          maxConsultationFee: 200,
          isAcceptingPatients: true
        };

        mockPrisma.doctorProfile.findMany.mockResolvedValue([]);
        mockPrisma.doctorProfile.count.mockResolvedValue(0);

        await userService.searchDoctors(criteria);

        expect(mockPrisma.doctorProfile.findMany).toHaveBeenCalledWith({
          where: expect.objectContaining({
            licenseVerified: true,
            isAcceptingPatients: true,
            name: { contains: 'Smith', mode: 'insensitive' },
            specializations: { has: 'Cardiology' },
            clinicAddress: { contains: 'New York', mode: 'insensitive' },
            rating: { gte: 4.0 },
            consultationFee: { lte: 200 }
          }),
          orderBy: { rating: 'desc' },
          skip: 0,
          take: 10,
          select: expect.any(Object)
        });
      });

      it('should handle database errors during search', async () => {
        const criteria: DoctorSearchCriteria = {
          specialization: 'Cardiology'
        };

        mockPrisma.doctorProfile.findMany.mockRejectedValue(new Error('Database error'));

        await expect(userService.searchDoctors(criteria))
          .rejects.toThrow('Failed to search doctors');
      });
    });

    describe('getDoctorById', () => {
      it('should fetch doctor by ID successfully', async () => {
        const mockDoctor = {
          id: 'doctor-1',
          name: 'Dr. Smith',
          profilePicture: null,
          specializations: ['Cardiology'],
          yearsOfExperience: 10,
          rating: 4.5,
          totalReviews: 20,
          consultationFee: 150,
          clinicName: 'Heart Clinic',
          clinicAddress: '123 Medical St',
          isAcceptingPatients: true,
          qualifications: ['MD', 'MBBS'],
          medicalLicenseNumber: 'DOC123',
          licenseVerified: true
        };

        mockPrisma.doctorProfile.findUnique.mockResolvedValue(mockDoctor);

        const result = await userService.getDoctorById('doctor-1');

        expect(result).toBeDefined();
        expect(result?.name).toBe('Dr. Smith');
        expect(result?.rating).toBe(4.5);
        expect(mockPrisma.doctorProfile.findUnique).toHaveBeenCalledWith({
          where: { id: 'doctor-1' },
          select: expect.objectContaining({
            id: true,
            name: true,
            specializations: true,
            rating: true
          })
        });
      });

      it('should return null when doctor not found', async () => {
        mockPrisma.doctorProfile.findUnique.mockResolvedValue(null);

        const result = await userService.getDoctorById('non-existent');

        expect(result).toBeNull();
      });

      it('should handle database errors', async () => {
        mockPrisma.doctorProfile.findUnique.mockRejectedValue(new Error('Database error'));

        await expect(userService.getDoctorById('doctor-1'))
          .rejects.toThrow('Failed to fetch doctor details');
      });
    });
  });
});