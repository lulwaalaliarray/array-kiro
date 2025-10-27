import { AdminService } from '../../services/adminService';
import { PrismaClient, UserRole, PaymentStatus } from '@prisma/client';
import { notificationService } from '../../services/notificationService';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
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
import { describe } from 'node:test';
import { describe } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';

// Mock notification service
jest.mock('../../services/notificationService', () => ({
  notificationService: {
    createNotification: jest.fn()
  }
}));

// Mock logger
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn()
  }
}));

// Mock Prisma Client
const mockPrisma = {
  user: {
    count: jest.fn(),
    groupBy: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn()
  },
  appointment: {
    count: jest.fn(),
    groupBy: jest.fn()
  },
  payment: {
    count: jest.fn(),
    groupBy: jest.fn(),
    findMany: jest.fn(),
    aggregate: jest.fn()
  },
  review: {
    findMany: jest.fn()
  },
  doctorProfile: {
    count: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn()
  }
} as unknown as PrismaClient;

describe('AdminService', () => {
  let adminService: AdminService;

  beforeEach(() => {
    adminService = new AdminService(mockPrisma);
    jest.clearAllMocks();
  });

  describe('User Management Operations', () => {
    describe('getSystemAnalytics', () => {
      it('should return comprehensive system analytics', async () => {
        // Mock user analytics
        (mockPrisma.user.count as jest.Mock)
          .mockResolvedValueOnce(100) // totalUsers
          .mockResolvedValueOnce(10)  // newUsersThisMonth
          .mockResolvedValueOnce(95); // activeUsers

        (mockPrisma.user.groupBy as jest.Mock).mockResolvedValue([
          { role: 'PATIENT', _count: { role: 60 } },
          { role: 'DOCTOR', _count: { role: 35 } },
          { role: 'ADMIN', _count: { role: 5 } }
        ]);

        (mockPrisma.doctorProfile.count as jest.Mock).mockResolvedValue(5);

        // Mock appointment analytics
        (mockPrisma.appointment.count as jest.Mock)
          .mockResolvedValueOnce(200) // totalAppointments
          .mockResolvedValueOnce(25)  // appointmentsThisMonth
          .mockResolvedValueOnce(15)  // upcomingAppointments
          .mockResolvedValueOnce(150) // completedAppointments
          .mockResolvedValueOnce(10); // cancelledAppointments

        (mockPrisma.appointment.groupBy as jest.Mock).mockResolvedValue([
          { status: 'CONFIRMED', _count: { status: 15 } },
          { status: 'COMPLETED', _count: { status: 150 } },
          { status: 'CANCELLED', _count: { status: 10 } }
        ]);

        // Mock payment analytics
        (mockPrisma.payment.count as jest.Mock).mockResolvedValue(180);
        (mockPrisma.payment.groupBy as jest.Mock).mockResolvedValue([
          { status: 'COMPLETED', _count: { status: 150 } },
          { status: 'PENDING', _count: { status: 20 } },
          { status: 'REFUNDED', _count: { status: 10 } }
        ]);

        (mockPrisma.payment.findMany as jest.Mock).mockResolvedValue([
          { amount: 100 }, { amount: 150 }, { amount: 200 }
        ]);

        (mockPrisma.payment.aggregate as jest.Mock).mockResolvedValue({
          _sum: { amount: 2500 }
        });

        // Mock review analytics
        (mockPrisma.review.findMany as jest.Mock).mockResolvedValue([
          { rating: 5 }, { rating: 4 }, { rating: 5 }, { rating: 3 }
        ]);

        (mockPrisma.doctorProfile.findMany as jest.Mock).mockResolvedValue([
          {
            id: 'doc1',
            name: 'Dr. Smith',
            specializations: ['Cardiology'],
            rating: 4.8,
            totalReviews: 25
          }
        ]);

        const analytics = await adminService.getSystemAnalytics();

        expect(analytics.users.totalUsers).toBe(100);
        expect(analytics.users.newUsersThisMonth).toBe(10);
        expect(analytics.users.activeUsers).toBe(95);
        expect(analytics.users.pendingVerifications).toBe(5);
        expect(analytics.users.usersByRole.PATIENT).toBe(60);
        expect(analytics.users.usersByRole.DOCTOR).toBe(35);
        expect(analytics.users.usersByRole.ADMIN).toBe(5);

        expect(analytics.appointments.totalAppointments).toBe(200);
        expect(analytics.appointments.appointmentsThisMonth).toBe(25);
        expect(analytics.appointments.upcomingAppointments).toBe(15);
        expect(analytics.appointments.completedAppointments).toBe(150);
        expect(analytics.appointments.cancelledAppointments).toBe(10);

        expect(analytics.payments.totalTransactions).toBe(180);
        expect(analytics.payments.revenueThisMonth).toBe(2500);
        expect(analytics.payments.averageTransactionValue).toBe(150);

        expect(analytics.ratings.totalReviews).toBe(4);
        expect(analytics.ratings.averageRating).toBe(4.25);
        expect(analytics.ratings.topRatedDoctors).toHaveLength(1);
      });

      it('should handle errors when fetching analytics', async () => {
        (mockPrisma.user.count as jest.Mock).mockRejectedValue(new Error('Database error'));

        await expect(adminService.getSystemAnalytics()).rejects.toThrow('Failed to fetch system analytics');
      });
    });

    describe('getUsers', () => {
      it('should return paginated users with filters', async () => {
        const mockUsers = [
          {
            id: 'user1',
            email: 'patient@example.com',
            role: 'PATIENT',
            isActive: true,
            isVerified: true,
            createdAt: new Date(),
            patientProfile: { name: 'John Patient', phone: '123-456-7890' },
            doctorProfile: null,
            adminProfile: null
          },
          {
            id: 'user2',
            email: 'doctor@example.com',
            role: 'DOCTOR',
            isActive: true,
            isVerified: true,
            createdAt: new Date(),
            patientProfile: null,
            doctorProfile: { 
              name: 'Dr. Smith', 
              phone: '098-765-4321',
              specializations: ['Cardiology'],
              licenseVerified: true
            },
            adminProfile: null
          }
        ];

        (mockPrisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);
        (mockPrisma.user.count as jest.Mock).mockResolvedValue(2);

        const result = await adminService.getUsers({
          role: UserRole.PATIENT,
          page: 1,
          limit: 10
        });

        expect(result.data).toHaveLength(2);
        expect(result.pagination.total).toBe(2);
        expect(result.data[0]?.profile.name).toBe('John Patient');
        expect(result.data[1]?.profile.name).toBe('Dr. Smith');
        expect(result.data[1]?.profile.specializations).toEqual(['Cardiology']);
      });

      it('should handle search term filtering', async () => {
        (mockPrisma.user.findMany as jest.Mock).mockResolvedValue([]);
        (mockPrisma.user.count as jest.Mock).mockResolvedValue(0);

        await adminService.getUsers({ searchTerm: 'john' });

        expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              OR: expect.arrayContaining([
                { email: { contains: 'john', mode: 'insensitive' } }
              ])
            })
          })
        );
      });
    });

    describe('updateUserStatus', () => {
      it('should update user status successfully', async () => {
        const mockUser = { id: 'user1', isActive: false };
        (mockPrisma.user.update as jest.Mock).mockResolvedValue(mockUser);

        await adminService.updateUserStatus('user1', { isActive: false }, 'admin1');

        expect(mockPrisma.user.update).toHaveBeenCalledWith({
          where: { id: 'user1' },
          data: { isActive: false }
        });
      });

      it('should handle errors when updating user status', async () => {
        (mockPrisma.user.update as jest.Mock).mockRejectedValue(new Error('Database error'));

        await expect(
          adminService.updateUserStatus('user1', { isActive: false }, 'admin1')
        ).rejects.toThrow('Failed to update user status');
      });
    });
  });

  describe('Doctor Verification Workflows', () => {
    describe('getDoctorsPendingVerification', () => {
      it('should return doctors pending verification', async () => {
        const mockDoctors = [
          {
            id: 'doctor1',
            name: 'Dr. John Doe',
            phone: '123-456-7890',
            medicalLicenseNumber: 'MD123456',
            qualifications: ['MD', 'PhD'],
            yearsOfExperience: 10,
            specializations: ['Cardiology'],
            clinicName: 'Heart Clinic',
            clinicAddress: '123 Main St',
            consultationFee: 150,
            profilePicture: null,
            licenseVerified: false,
            createdAt: new Date(),
            user: { email: 'john@example.com' }
          }
        ];

        (mockPrisma.doctorProfile.findMany as jest.Mock).mockResolvedValue(mockDoctors);

        const result = await adminService.getDoctorsPendingVerification();

        expect(result).toHaveLength(1);
        expect(result[0]?.name).toBe('Dr. John Doe');
        expect(result[0]?.email).toBe('john@example.com');
        expect(result[0]?.licenseVerified).toBe(false);
        expect(result[0]?.medicalLicenseNumber).toBe('MD123456');
        expect(result[0]?.specializations).toEqual(['Cardiology']);
      });

      it('should handle errors when fetching pending verifications', async () => {
        (mockPrisma.doctorProfile.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

        await expect(adminService.getDoctorsPendingVerification()).rejects.toThrow(
          'Failed to fetch doctors pending verification'
        );
      });
    });

    describe('processDoctorVerification', () => {
      it('should approve doctor verification and send notification', async () => {
        const mockDoctor = {
          id: 'doctor1',
          userId: 'user1',
          name: 'Dr. John Doe',
          user: { id: 'user1', email: 'john@example.com' }
        };

        (mockPrisma.doctorProfile.update as jest.Mock).mockResolvedValue(mockDoctor);
        (mockPrisma.doctorProfile.findUnique as jest.Mock).mockResolvedValue(mockDoctor);

        const action = {
          doctorId: 'doctor1',
          action: 'approve' as const,
          adminNotes: 'Approved after verification'
        };

        await adminService.processDoctorVerification(action, 'admin1');

        expect(mockPrisma.doctorProfile.update).toHaveBeenCalledWith({
          where: { id: 'doctor1' },
          data: {
            licenseVerified: true,
            updatedAt: expect.any(Date)
          }
        });

        expect(notificationService.createNotification).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: 'user1',
            type: 'DOCTOR_VERIFIED',
            title: 'License Verification Approved'
          })
        );
      });

      it('should reject doctor verification and send notification', async () => {
        const mockDoctor = {
          id: 'doctor1',
          userId: 'user1',
          name: 'Dr. John Doe',
          user: { id: 'user1', email: 'john@example.com' }
        };

        (mockPrisma.doctorProfile.update as jest.Mock).mockResolvedValue(mockDoctor);
        (mockPrisma.doctorProfile.findUnique as jest.Mock).mockResolvedValue(mockDoctor);

        const action = {
          doctorId: 'doctor1',
          action: 'reject' as const,
          adminNotes: 'Invalid license number'
        };

        await adminService.processDoctorVerification(action, 'admin1');

        expect(mockPrisma.doctorProfile.update).toHaveBeenCalledWith({
          where: { id: 'doctor1' },
          data: {
            licenseVerified: false,
            updatedAt: expect.any(Date)
          }
        });

        expect(notificationService.createNotification).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: 'user1',
            type: 'DOCTOR_REJECTED',
            title: 'License Verification Rejected',
            message: expect.stringContaining('Invalid license number')
          })
        );
      });

      it('should handle errors during verification process', async () => {
        (mockPrisma.doctorProfile.update as jest.Mock).mockRejectedValue(new Error('Database error'));

        const action = {
          doctorId: 'doctor1',
          action: 'approve' as const,
          adminNotes: 'Approved'
        };

        await expect(
          adminService.processDoctorVerification(action, 'admin1')
        ).rejects.toThrow('Failed to process doctor verification');
      });
    });
  });

  describe('Analytics Calculation and Reporting', () => {
    describe('getPaymentTransactions', () => {
      it('should return paginated payment transactions with filters', async () => {
        const mockPayments = [
          {
            id: 'payment1',
            appointmentId: 'appt1',
            amount: 150,
            currency: 'USD',
            status: 'COMPLETED',
            createdAt: new Date(),
            processedAt: new Date(),
            refundedAt: null,
            refundReason: null,
            appointment: {
              scheduledDateTime: new Date(),
              type: 'online',
              status: 'COMPLETED',
              patient: {
                id: 'patient1',
                name: 'John Patient',
                user: { email: 'patient@example.com' }
              },
              doctor: {
                id: 'doctor1',
                name: 'Dr. Smith',
                user: { email: 'doctor@example.com' }
              }
            }
          }
        ];

        (mockPrisma.payment.findMany as jest.Mock).mockResolvedValue(mockPayments);
        (mockPrisma.payment.count as jest.Mock).mockResolvedValue(1);

        const result = await adminService.getPaymentTransactions({
          status: PaymentStatus.COMPLETED,
          page: 1,
          limit: 10
        });

        expect(result.data).toHaveLength(1);
        expect(result.data[0]?.amount).toBe(150);
        expect(result.data[0]?.status).toBe('COMPLETED');
        expect(result.data[0]?.patient.name).toBe('John Patient');
        expect(result.data[0]?.doctor.name).toBe('Dr. Smith');
        expect(result.pagination.total).toBe(1);
      });

      it('should apply date range filters', async () => {
        const dateFrom = new Date('2024-01-01');
        const dateTo = new Date('2024-01-31');

        (mockPrisma.payment.findMany as jest.Mock).mockResolvedValue([]);
        (mockPrisma.payment.count as jest.Mock).mockResolvedValue(0);

        await adminService.getPaymentTransactions({
          dateFrom,
          dateTo
        });

        expect(mockPrisma.payment.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              createdAt: {
                gte: dateFrom,
                lte: dateTo
              }
            })
          })
        );
      });
    });

    describe('getPaymentReconciliation', () => {
      it('should return payment reconciliation report', async () => {
        const mockAggregates = [
          { _count: { id: 100 }, _sum: { amount: 15000 } }, // all payments
          { _count: { id: 85 }, _sum: { amount: 12750 } },  // completed
          { _count: { id: 5 }, _sum: { amount: 750 } },     // refunded
          { _count: { id: 10 }, _sum: { amount: 1500 } }    // pending
        ];

        (mockPrisma.payment.aggregate as jest.Mock)
          .mockResolvedValueOnce(mockAggregates[0])
          .mockResolvedValueOnce(mockAggregates[1])
          .mockResolvedValueOnce(mockAggregates[2])
          .mockResolvedValueOnce(mockAggregates[3]);

        const result = await adminService.getPaymentReconciliation();

        expect(result.totalTransactions).toBe(100);
        expect(result.totalAmount).toBe(15000);
        expect(result.completedTransactions).toBe(85);
        expect(result.completedAmount).toBe(12750);
        expect(result.refundedTransactions).toBe(5);
        expect(result.refundedAmount).toBe(750);
        expect(result.pendingTransactions).toBe(10);
        expect(result.pendingAmount).toBe(1500);
      });

      it('should apply date filters to reconciliation', async () => {
        const dateFrom = new Date('2024-01-01');
        const dateTo = new Date('2024-01-31');

        (mockPrisma.payment.aggregate as jest.Mock).mockResolvedValue({
          _count: { id: 0 },
          _sum: { amount: 0 }
        });

        await adminService.getPaymentReconciliation(dateFrom, dateTo);

        expect(mockPrisma.payment.aggregate).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              createdAt: {
                gte: dateFrom,
                lte: dateTo
              }
            })
          })
        );
      });
    });

    describe('monthly revenue calculation', () => {
      it('should calculate monthly revenue data correctly', async () => {
        // This tests the private method through getSystemAnalytics
        const mockMonthlyData = [
          {
            processedAt: new Date('2024-01-15'),
            _sum: { amount: 1000 },
            _count: { id: 10 }
          },
          {
            processedAt: new Date('2024-02-15'),
            _sum: { amount: 1500 },
            _count: { id: 15 }
          }
        ];

        // Mock all required calls for getSystemAnalytics
        (mockPrisma.user.count as jest.Mock).mockResolvedValue(100);
        (mockPrisma.user.groupBy as jest.Mock).mockResolvedValue([]);
        (mockPrisma.doctorProfile.count as jest.Mock).mockResolvedValue(0);
        (mockPrisma.appointment.count as jest.Mock).mockResolvedValue(0);
        (mockPrisma.appointment.groupBy as jest.Mock).mockResolvedValue([]);
        (mockPrisma.payment.count as jest.Mock).mockResolvedValue(0);
        (mockPrisma.payment.findMany as jest.Mock).mockResolvedValue([]);
        (mockPrisma.payment.aggregate as jest.Mock).mockResolvedValue({ _sum: { amount: 0 } });
        (mockPrisma.review.findMany as jest.Mock).mockResolvedValue([]);
        (mockPrisma.doctorProfile.findMany as jest.Mock).mockResolvedValue([]);

        // Mock the groupBy call for monthly revenue
        (mockPrisma.payment.groupBy as jest.Mock).mockResolvedValueOnce(mockMonthlyData);

        const analytics = await adminService.getSystemAnalytics();

        expect(analytics.payments.monthlyRevenue).toBeDefined();
        // The monthly revenue should be processed and sorted
      });
    });
  });
});