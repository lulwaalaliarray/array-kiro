import { PrismaClient, UserRole, AppointmentStatus, PaymentStatus } from '@prisma/client';
import {
  SystemAnalytics,
  UserAnalytics,
  AppointmentAnalytics,
  PaymentAnalytics,
  RatingAnalytics,
  UserManagementFilters,
  UserManagementResult,
  UserStatusUpdate,
  DoctorVerificationDetails,
  DoctorVerificationAction,
  PaymentTransactionFilters,
  PaymentTransactionResult,
  PaymentReconciliation,
  MonthlyRevenue,
  TopRatedDoctor
} from '../types/admin';
import { PaginatedResult } from '../types/user';
import { logger } from '../utils/logger';
import { notificationService } from './notificationService';
import { NotificationType, NotificationChannel } from '../types/notification';

export class AdminService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Get comprehensive system analytics for admin dashboard
   */
  async getSystemAnalytics(): Promise<SystemAnalytics> {
    try {
      const [userAnalytics, appointmentAnalytics, paymentAnalytics, ratingAnalytics] = await Promise.all([
        this.getUserAnalytics(),
        this.getAppointmentAnalytics(),
        this.getPaymentAnalytics(),
        this.getRatingAnalytics()
      ]);

      return {
        users: userAnalytics,
        appointments: appointmentAnalytics,
        payments: paymentAnalytics,
        ratings: ratingAnalytics
      };
    } catch (error) {
      logger.error('Error getting system analytics:', error);
      throw new Error('Failed to fetch system analytics');
    }
  }

  /**
   * Get user analytics
   */
  private async getUserAnalytics(): Promise<UserAnalytics> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalUsers, usersByRole, newUsersThisMonth, activeUsers, pendingVerifications] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.groupBy({
        by: ['role'],
        _count: { role: true }
      }),
      this.prisma.user.count({
        where: { createdAt: { gte: startOfMonth } }
      }),
      this.prisma.user.count({
        where: { isActive: true }
      }),
      this.prisma.doctorProfile.count({
        where: { licenseVerified: false }
      })
    ]);

    const roleDistribution = usersByRole.reduce((acc: Record<UserRole, number>, item: any) => {
      acc[item.role as UserRole] = item._count.role;
      return acc;
    }, {} as Record<UserRole, number>);

    return {
      totalUsers,
      usersByRole: roleDistribution,
      newUsersThisMonth,
      activeUsers,
      pendingVerifications
    };
  }

  /**
   * Get appointment analytics
   */
  private async getAppointmentAnalytics(): Promise<AppointmentAnalytics> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalAppointments,
      appointmentsByStatus,
      appointmentsThisMonth,
      upcomingAppointments,
      completedAppointments,
      cancelledAppointments
    ] = await Promise.all([
      this.prisma.appointment.count(),
      this.prisma.appointment.groupBy({
        by: ['status'],
        _count: { status: true }
      }),
      this.prisma.appointment.count({
        where: { createdAt: { gte: startOfMonth } }
      }),
      this.prisma.appointment.count({
        where: {
          scheduledDateTime: { gte: now },
          status: { in: [AppointmentStatus.CONFIRMED, AppointmentStatus.PAYMENT_PENDING] }
        }
      }),
      this.prisma.appointment.count({
        where: { status: AppointmentStatus.COMPLETED }
      }),
      this.prisma.appointment.count({
        where: { status: AppointmentStatus.CANCELLED }
      })
    ]);

    const statusDistribution = appointmentsByStatus.reduce((acc: Record<AppointmentStatus, number>, item: any) => {
      acc[item.status as AppointmentStatus] = item._count.status;
      return acc;
    }, {} as Record<AppointmentStatus, number>);

    const daysInMonth = now.getDate();
    const averageAppointmentsPerDay = daysInMonth > 0 ? appointmentsThisMonth / daysInMonth : 0;

    return {
      totalAppointments,
      appointmentsByStatus: statusDistribution,
      appointmentsThisMonth,
      upcomingAppointments,
      completedAppointments,
      cancelledAppointments,
      averageAppointmentsPerDay: Math.round(averageAppointmentsPerDay * 100) / 100
    };
  }

  /**
   * Get payment analytics
   */
  private async getPaymentAnalytics(): Promise<PaymentAnalytics> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalTransactions,
      paymentsByStatus,
      completedPayments,
      revenueThisMonth,
      monthlyRevenueData
    ] = await Promise.all([
      this.prisma.payment.count(),
      this.prisma.payment.groupBy({
        by: ['status'],
        _count: { status: true }
      }),
      this.prisma.payment.findMany({
        where: { status: PaymentStatus.COMPLETED },
        select: { amount: true }
      }),
      this.prisma.payment.aggregate({
        where: {
          status: PaymentStatus.COMPLETED,
          processedAt: { gte: startOfMonth }
        },
        _sum: { amount: true }
      }),
      this.getMonthlyRevenueData()
    ]);

    const statusDistribution = paymentsByStatus.reduce((acc: Record<PaymentStatus, number>, item: any) => {
      acc[item.status as PaymentStatus] = item._count.status;
      return acc;
    }, {} as Record<PaymentStatus, number>);

    const totalRevenue = completedPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    const averageTransactionValue = completedPayments.length > 0 ? totalRevenue / completedPayments.length : 0;

    return {
      totalRevenue,
      revenueThisMonth: Number(revenueThisMonth._sum.amount) || 0,
      averageTransactionValue: Math.round(averageTransactionValue * 100) / 100,
      totalTransactions,
      paymentsByStatus: statusDistribution,
      monthlyRevenue: monthlyRevenueData
    };
  }

  /**
   * Get monthly revenue data for the last 12 months
   */
  private async getMonthlyRevenueData(): Promise<MonthlyRevenue[]> {
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const monthlyData = await this.prisma.payment.groupBy({
      by: ['processedAt'],
      where: {
        status: PaymentStatus.COMPLETED,
        processedAt: { gte: twelveMonthsAgo }
      },
      _sum: { amount: true },
      _count: { id: true }
    });

    // Group by month and year
    const monthlyMap = new Map<string, MonthlyRevenue>();

    monthlyData.forEach((item: any) => {
      if (item.processedAt) {
        const date = new Date(item.processedAt);
        const key = `${date.getFullYear()}-${date.getMonth()}`;
        const monthName = date.toLocaleString('default', { month: 'long' });

        if (!monthlyMap.has(key)) {
          monthlyMap.set(key, {
            month: monthName,
            year: date.getFullYear(),
            revenue: 0,
            transactionCount: 0
          });
        }

        const monthData = monthlyMap.get(key)!;
        monthData.revenue += Number(item._sum.amount) || 0;
        monthData.transactionCount += item._count.id;
      }
    });

    return Array.from(monthlyMap.values()).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return new Date(`${a.month} 1, ${a.year}`).getMonth() - new Date(`${b.month} 1, ${b.year}`).getMonth();
    });
  }

  /**
   * Get rating analytics
   */
  private async getRatingAnalytics(): Promise<RatingAnalytics> {
    const [reviews, topDoctors] = await Promise.all([
      this.prisma.review.findMany({
        select: { rating: true }
      }),
      this.prisma.doctorProfile.findMany({
        where: {
          totalReviews: { gt: 0 },
          licenseVerified: true
        },
        select: {
          id: true,
          name: true,
          specializations: true,
          rating: true,
          totalReviews: true
        },
        orderBy: { rating: 'desc' },
        take: 10
      })
    ]);

    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
      : 0;

    // Calculate rating distribution
    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(review => {
      ratingDistribution[review.rating] = (ratingDistribution[review.rating] || 0) + 1;
    });

    const topRatedDoctors: TopRatedDoctor[] = topDoctors.map(doctor => ({
      id: doctor.id,
      name: doctor.name,
      specializations: doctor.specializations,
      rating: Number(doctor.rating),
      totalReviews: doctor.totalReviews
    }));

    return {
      averageRating: Math.round(averageRating * 100) / 100,
      totalReviews,
      ratingDistribution,
      topRatedDoctors
    };
  }

  /**
   * Get users with management filters
   */
  async getUsers(filters: UserManagementFilters = {}): Promise<PaginatedResult<UserManagementResult>> {
    try {
      const {
        role,
        isActive,
        isVerified,
        searchTerm,
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = filters;

      const skip = (page - 1) * limit;

      // Build where clause
      const whereClause: any = {};

      if (role) whereClause.role = role;
      if (isActive !== undefined) whereClause.isActive = isActive;
      if (isVerified !== undefined) whereClause.isVerified = isVerified;

      if (searchTerm) {
        whereClause.OR = [
          { email: { contains: searchTerm, mode: 'insensitive' } },
          { patientProfile: { name: { contains: searchTerm, mode: 'insensitive' } } },
          { doctorProfile: { name: { contains: searchTerm, mode: 'insensitive' } } },
          { adminProfile: { name: { contains: searchTerm, mode: 'insensitive' } } }
        ];
      }

      // Execute queries
      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          where: whereClause,
          include: {
            patientProfile: { select: { name: true, phone: true } },
            doctorProfile: { 
              select: { 
                name: true, 
                phone: true, 
                specializations: true, 
                licenseVerified: true 
              } 
            },
            adminProfile: { select: { name: true, phone: true } }
          },
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit
        }),
        this.prisma.user.count({ where: whereClause })
      ]);

      const results: UserManagementResult[] = users.map(user => {
        let profile: any = { name: 'Unknown' };

        if (user.patientProfile) {
          profile = {
            name: user.patientProfile.name,
            phone: user.patientProfile.phone
          };
        } else if (user.doctorProfile) {
          profile = {
            name: user.doctorProfile.name,
            phone: user.doctorProfile.phone,
            specializations: user.doctorProfile.specializations,
            licenseVerified: user.doctorProfile.licenseVerified
          };
        } else if (user.adminProfile) {
          profile = {
            name: user.adminProfile.name,
            phone: user.adminProfile.phone
          };
        }

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
          profile
        };
      });

      return {
        data: results,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error getting users:', error);
      throw new Error('Failed to fetch users');
    }
  }

  /**
   * Update user status (activate/deactivate, verify/unverify)
   */
  async updateUserStatus(userId: string, updates: UserStatusUpdate, adminId: string): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: updates
      });

      // Log admin activity
      await this.logAdminActivity(adminId, 'update_user_status', 'user', userId, updates);

      logger.info(`User ${userId} status updated by admin ${adminId}`);
    } catch (error) {
      logger.error('Error updating user status:', error);
      throw new Error('Failed to update user status');
    }
  }

  /**
   * Get doctors pending verification with detailed information
   */
  async getDoctorsPendingVerification(): Promise<DoctorVerificationDetails[]> {
    try {
      const doctors = await this.prisma.doctorProfile.findMany({
        where: { licenseVerified: false },
        include: {
          user: { select: { email: true } }
        },
        orderBy: { createdAt: 'asc' }
      });

      return doctors.map(doctor => ({
        id: doctor.id,
        name: doctor.name,
        email: doctor.user.email,
        phone: doctor.phone,
        medicalLicenseNumber: doctor.medicalLicenseNumber,
        qualifications: doctor.qualifications,
        yearsOfExperience: doctor.yearsOfExperience,
        specializations: doctor.specializations,
        clinicName: doctor.clinicName,
        clinicAddress: doctor.clinicAddress,
        consultationFee: Number(doctor.consultationFee),
        profilePicture: doctor.profilePicture || undefined,
        licenseVerified: doctor.licenseVerified,
        createdAt: doctor.createdAt
      }));
    } catch (error) {
      logger.error('Error getting doctors pending verification:', error);
      throw new Error('Failed to fetch doctors pending verification');
    }
  }

  /**
   * Process doctor verification (approve/reject)
   */
  async processDoctorVerification(action: DoctorVerificationAction, adminId: string): Promise<void> {
    try {
      const { doctorId, action: verificationAction, adminNotes } = action;

      // Update doctor verification status
      await this.prisma.doctorProfile.update({
        where: { id: doctorId },
        data: {
          licenseVerified: verificationAction === 'approve',
          updatedAt: new Date()
        }
      });

      // Get doctor details for notification
      const doctor = await this.prisma.doctorProfile.findUnique({
        where: { id: doctorId },
        include: { user: true }
      });

      if (doctor) {
        // Send notification to doctor
        await notificationService.createNotification({
          userId: doctor.userId,
          type: verificationAction === 'approve' 
            ? NotificationType.DOCTOR_VERIFIED 
            : NotificationType.DOCTOR_REJECTED,
          title: verificationAction === 'approve' 
            ? 'License Verification Approved' 
            : 'License Verification Rejected',
          message: verificationAction === 'approve'
            ? 'Your medical license has been verified. You can now start accepting appointments.'
            : `Your license verification was rejected. ${adminNotes || 'Please contact support for more information.'}`,
          data: { doctorId, adminNotes },
          channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP]
        });
      }

      // Log admin activity
      await this.logAdminActivity(adminId, `doctor_verification_${verificationAction}`, 'user', doctorId, action);

      logger.info(`Doctor ${doctorId} verification ${verificationAction}d by admin ${adminId}`);
    } catch (error) {
      logger.error('Error processing doctor verification:', error);
      throw new Error('Failed to process doctor verification');
    }
  }

  /**
   * Get payment transactions with filtering
   */
  async getPaymentTransactions(filters: PaymentTransactionFilters = {}): Promise<PaginatedResult<PaymentTransactionResult>> {
    try {
      const {
        status,
        dateFrom,
        dateTo,
        minAmount,
        maxAmount,
        doctorId,
        patientId,
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = filters;

      const skip = (page - 1) * limit;

      // Build where clause
      const whereClause: any = {};

      if (status) whereClause.status = status;
      if (dateFrom || dateTo) {
        whereClause.createdAt = {};
        if (dateFrom) whereClause.createdAt.gte = dateFrom;
        if (dateTo) whereClause.createdAt.lte = dateTo;
      }
      if (minAmount !== undefined || maxAmount !== undefined) {
        whereClause.amount = {};
        if (minAmount !== undefined) whereClause.amount.gte = minAmount;
        if (maxAmount !== undefined) whereClause.amount.lte = maxAmount;
      }
      if (doctorId) {
        whereClause.appointment = { doctorId };
      }
      if (patientId) {
        whereClause.appointment = { patientId };
      }

      // Execute queries
      const [payments, total] = await Promise.all([
        this.prisma.payment.findMany({
          where: whereClause,
          include: {
            appointment: {
              include: {
                patient: { 
                  include: { user: { select: { email: true } } }
                },
                doctor: { 
                  include: { user: { select: { email: true } } }
                }
              }
            }
          },
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit
        }),
        this.prisma.payment.count({ where: whereClause })
      ]);

      const results: PaymentTransactionResult[] = payments.map(payment => ({
        id: payment.id,
        appointmentId: payment.appointmentId,
        amount: Number(payment.amount),
        currency: payment.currency,
        status: payment.status,
        createdAt: payment.createdAt,
        processedAt: payment.processedAt || undefined,
        refundedAt: payment.refundedAt || undefined,
        refundReason: payment.refundReason || undefined,
        patient: {
          id: payment.appointment.patient.id,
          name: payment.appointment.patient.name,
          email: payment.appointment.patient.user.email
        },
        doctor: {
          id: payment.appointment.doctor.id,
          name: payment.appointment.doctor.name,
          email: payment.appointment.doctor.user.email
        },
        appointment: {
          scheduledDateTime: payment.appointment.scheduledDateTime,
          type: payment.appointment.type,
          status: payment.appointment.status
        }
      }));

      return {
        data: results,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error getting payment transactions:', error);
      throw new Error('Failed to fetch payment transactions');
    }
  }

  /**
   * Get payment reconciliation report
   */
  async getPaymentReconciliation(dateFrom?: Date, dateTo?: Date): Promise<PaymentReconciliation> {
    try {
      const whereClause: any = {};
      if (dateFrom || dateTo) {
        whereClause.createdAt = {};
        if (dateFrom) whereClause.createdAt.gte = dateFrom;
        if (dateTo) whereClause.createdAt.lte = dateTo;
      }

      const [
        allPayments,
        completedPayments,
        refundedPayments,
        pendingPayments
      ] = await Promise.all([
        this.prisma.payment.aggregate({
          where: whereClause,
          _count: { id: true },
          _sum: { amount: true }
        }),
        this.prisma.payment.aggregate({
          where: { ...whereClause, status: PaymentStatus.COMPLETED },
          _count: { id: true },
          _sum: { amount: true }
        }),
        this.prisma.payment.aggregate({
          where: { ...whereClause, status: PaymentStatus.REFUNDED },
          _count: { id: true },
          _sum: { amount: true }
        }),
        this.prisma.payment.aggregate({
          where: { ...whereClause, status: PaymentStatus.PENDING },
          _count: { id: true },
          _sum: { amount: true }
        })
      ]);

      return {
        totalTransactions: allPayments._count.id,
        totalAmount: Number(allPayments._sum.amount) || 0,
        completedTransactions: completedPayments._count.id,
        completedAmount: Number(completedPayments._sum.amount) || 0,
        refundedTransactions: refundedPayments._count.id,
        refundedAmount: Number(refundedPayments._sum.amount) || 0,
        pendingTransactions: pendingPayments._count.id,
        pendingAmount: Number(pendingPayments._sum.amount) || 0,
        discrepancies: [] // TODO: Implement discrepancy detection logic
      };
    } catch (error) {
      logger.error('Error getting payment reconciliation:', error);
      throw new Error('Failed to generate payment reconciliation report');
    }
  }

  /**
   * Log admin activity for audit trail
   */
  private async logAdminActivity(
    adminId: string,
    action: string,
    resourceType: string,
    resourceId: string,
    details: any
  ): Promise<void> {
    try {
      // Get admin name
      const admin = await this.prisma.user.findUnique({
        where: { id: adminId },
        include: { adminProfile: { select: { name: true } } }
      });

      const adminName = admin?.adminProfile?.name || admin?.email || 'Unknown Admin';

      // In a real implementation, you would store this in an admin_activities table
      // For now, we'll just log it
      logger.info('Admin activity logged:', {
        adminId,
        adminName,
        action,
        resourceType,
        resourceId,
        details,
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Error logging admin activity:', error);
      // Don't throw error as this is just logging
    }
  }
}

export const adminService = new AdminService(new PrismaClient());