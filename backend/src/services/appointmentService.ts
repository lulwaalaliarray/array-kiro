import { PrismaClient, AppointmentStatus, AppointmentType, PaymentStatus } from '@prisma/client';
import { 
  AppointmentRequest, 
  AppointmentWithDetails, 
  AppointmentFilters, 
  AppointmentStatusUpdate,
  AppointmentCancellation,
  AppointmentReschedule,
  ValidationResult,
  ConflictCheck,
  AppointmentStats
} from '../types/appointment';
import { PaginatedResult } from '../types/user';
import { logger } from '../utils/logger';
import { notificationService } from './notificationService';
import { reminderService } from './reminderService';
import { NotificationType, NotificationChannel } from '../types/notification';

export class AppointmentService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Create a new appointment request
   */
  async createAppointment(patientId: string, appointmentData: AppointmentRequest): Promise<AppointmentWithDetails> {
    try {
      // Validate business rules
      const validation = await this.validateAppointmentRequest(patientId, appointmentData);
      if (!validation.isValid) {
        throw new Error(`Appointment validation failed: ${validation.errors.join(', ')}`);
      }

      // Check for conflicts
      const conflictCheck = await this.checkAppointmentConflicts(
        appointmentData.doctorId,
        appointmentData.scheduledDateTime
      );
      if (conflictCheck.hasConflict) {
        throw new Error('Doctor is not available at the requested time');
      }

      // Create the appointment
      const appointment = await this.prisma.appointment.create({
        data: {
          patientId,
          doctorId: appointmentData.doctorId,
          scheduledDateTime: appointmentData.scheduledDateTime,
          type: appointmentData.type,
          notes: appointmentData.notes || null,
          status: AppointmentStatus.AWAITING_ACCEPTANCE,
          paymentStatus: PaymentStatus.PENDING,
        },
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              phone: true,
              age: true,
              gender: true,
            },
          },
          doctor: {
            select: {
              id: true,
              name: true,
              specializations: true,
              consultationFee: true,
              clinicName: true,
              clinicAddress: true,
            },
          },
          payment: {
            select: {
              id: true,
              amount: true,
              status: true,
              processedAt: true,
            },
          },
          zoomMeeting: {
            select: {
              id: true,
              zoomMeetingId: true,
              topic: true,
              startTime: true,
              duration: true,
              hostUrl: true,
              joinUrl: true,
              password: true,
              status: true,
            },
          },
        },
      });

      logger.info(`Appointment created: ${appointment.id} for patient ${patientId}`);
      
      // Send notification to patient about appointment booking
      try {
        await notificationService.createNotification({
          userId: patientId,
          type: NotificationType.APPOINTMENT_BOOKED,
          title: 'Appointment Request Submitted',
          message: `Your appointment request with Dr. ${appointment.doctor.name} has been submitted and is awaiting acceptance.`,
          data: {
            appointmentId: appointment.id,
            patientName: appointment.patient.name,
            doctorName: appointment.doctor.name,
            appointmentDateTime: appointment.scheduledDateTime,
            appointmentType: appointment.type,
            clinicName: appointment.doctor.clinicName,
            clinicAddress: appointment.doctor.clinicAddress,
          },
          channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
        });

        // Send notification to doctor about new appointment request
        await notificationService.createNotification({
          userId: appointmentData.doctorId,
          type: NotificationType.APPOINTMENT_BOOKED,
          title: 'New Appointment Request',
          message: `${appointment.patient.name} has requested an appointment with you.`,
          data: {
            appointmentId: appointment.id,
            patientName: appointment.patient.name,
            doctorName: appointment.doctor.name,
            appointmentDateTime: appointment.scheduledDateTime,
            appointmentType: appointment.type,
          },
          channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP, NotificationChannel.PUSH],
        });
      } catch (notificationError) {
        logger.error('Failed to send appointment booking notifications:', notificationError);
        // Don't fail the appointment creation if notifications fail
      }
      
      // Convert Decimal to number for consultationFee and payment amount
      const result = {
        ...appointment,
        doctor: {
          ...appointment.doctor,
          consultationFee: Number(appointment.doctor.consultationFee),
        },
        payment: appointment.payment ? {
          ...appointment.payment,
          amount: Number(appointment.payment.amount),
        } : null,
        zoomMeeting: appointment.zoomMeeting ? {
          ...appointment.zoomMeeting,
          meetingId: appointment.zoomMeeting.zoomMeetingId,
        } : null,
      };
      
      return result;
    } catch (error) {
      logger.error('Error creating appointment:', error);
      throw error;
    }
  }

  /**
   * Update appointment status (for doctor acceptance/rejection)
   */
  async updateAppointmentStatus(
    appointmentId: string, 
    userId: string, 
    userRole: string,
    statusUpdate: AppointmentStatusUpdate
  ): Promise<AppointmentWithDetails> {
    try {
      // Get the appointment first
      const existingAppointment = await this.prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          doctor: { 
            select: { 
              userId: true, 
              name: true,
              user: { select: { email: true } }
            } 
          },
          patient: { 
            select: { 
              userId: true, 
              name: true,
              user: { select: { email: true } }
            } 
          },
        },
      });

      if (!existingAppointment) {
        throw new Error('Appointment not found');
      }

      // Authorization check
      if (userRole === 'DOCTOR' && existingAppointment.doctor.userId !== userId) {
        throw new Error('Unauthorized: You can only manage your own appointments');
      }
      if (userRole === 'PATIENT' && existingAppointment.patient.userId !== userId) {
        throw new Error('Unauthorized: You can only manage your own appointments');
      }

      // Validate status transition
      const isValidTransition = this.validateStatusTransition(
        existingAppointment.status,
        statusUpdate.status,
        userRole
      );
      if (!isValidTransition) {
        throw new Error(`Invalid status transition from ${existingAppointment.status} to ${statusUpdate.status}`);
      }

      // Create Zoom meeting if appointment is confirmed and it's an online consultation
      if (statusUpdate.status === AppointmentStatus.CONFIRMED && 
          existingAppointment.type === 'ONLINE' && 
          !existingAppointment.zoomMeetingId) {
        
        try {
          await this.createZoomMeetingForAppointment(existingAppointment);
        } catch (zoomError) {
          logger.error('Failed to create Zoom meeting, but continuing with appointment update:', zoomError);
          // Don't fail the appointment update if Zoom meeting creation fails
        }
      }

      // Update the appointment
      const updatedAppointment = await this.prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          status: statusUpdate.status,
          notes: statusUpdate.notes || existingAppointment.notes,
          updatedAt: new Date(),
        },
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              phone: true,
              age: true,
              gender: true,
            },
          },
          doctor: {
            select: {
              id: true,
              name: true,
              specializations: true,
              consultationFee: true,
              clinicName: true,
              clinicAddress: true,
            },
          },
          payment: {
            select: {
              id: true,
              amount: true,
              status: true,
              processedAt: true,
            },
          },
        },
      });

      logger.info(`Appointment ${appointmentId} status updated to ${statusUpdate.status}`);
      
      // Send notifications based on status change
      try {
        await this.sendStatusChangeNotifications(updatedAppointment, existingAppointment.status, statusUpdate.status);
        
        // Create reminders for confirmed appointments
        if (statusUpdate.status === AppointmentStatus.CONFIRMED) {
          await reminderService.createAppointmentReminders(appointmentId);
        }
        
        // Cancel reminders for cancelled appointments
        if (statusUpdate.status === AppointmentStatus.CANCELLED) {
          await reminderService.cancelAppointmentReminders(appointmentId);
        }
      } catch (notificationError) {
        logger.error('Failed to send status change notifications:', notificationError);
        // Don't fail the appointment update if notifications fail
      }
      
      // Convert Decimal to number for consultationFee and payment amount
      const result = {
        ...updatedAppointment,
        doctor: {
          ...updatedAppointment.doctor,
          consultationFee: Number(updatedAppointment.doctor.consultationFee),
        },
        payment: updatedAppointment.payment ? {
          ...updatedAppointment.payment,
          amount: Number(updatedAppointment.payment.amount),
        } : null,
      };
      
      return result;
    } catch (error) {
      logger.error('Error updating appointment status:', error);
      throw error;
    }
  }

  /**
   * Cancel an appointment
   */
  async cancelAppointment(
    appointmentId: string,
    userId: string,
    userRole: string,
    cancellation: AppointmentCancellation
  ): Promise<AppointmentWithDetails> {
    try {
      const existingAppointment = await this.prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          doctor: { select: { userId: true } },
          patient: { select: { userId: true } },
          payment: true,
        },
      });

      if (!existingAppointment) {
        throw new Error('Appointment not found');
      }

      // Authorization check
      if (userRole === 'DOCTOR' && existingAppointment.doctor.userId !== userId) {
        throw new Error('Unauthorized: You can only cancel your own appointments');
      }
      if (userRole === 'PATIENT' && existingAppointment.patient.userId !== userId) {
        throw new Error('Unauthorized: You can only cancel your own appointments');
      }

      // Check if appointment can be cancelled
      if (existingAppointment.status === AppointmentStatus.COMPLETED) {
        throw new Error('Cannot cancel a completed appointment');
      }
      if (existingAppointment.status === AppointmentStatus.CANCELLED) {
        throw new Error('Appointment is already cancelled');
      }

      // Check cancellation timing (24 hours before appointment)
      const now = new Date();
      const appointmentTime = new Date(existingAppointment.scheduledDateTime);
      const timeDifference = appointmentTime.getTime() - now.getTime();
      const hoursUntilAppointment = timeDifference / (1000 * 60 * 60);

      if (hoursUntilAppointment < 24 && userRole === 'PATIENT') {
        throw new Error('Appointments can only be cancelled at least 24 hours in advance');
      }

      // Update appointment status
      const cancelledAppointment = await this.prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          status: AppointmentStatus.CANCELLED,
          notes: `Cancelled: ${cancellation.reason}`,
          updatedAt: new Date(),
        },
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              phone: true,
              age: true,
              gender: true,
            },
          },
          doctor: {
            select: {
              id: true,
              name: true,
              specializations: true,
              consultationFee: true,
              clinicName: true,
              clinicAddress: true,
            },
          },
          payment: {
            select: {
              id: true,
              amount: true,
              status: true,
              processedAt: true,
            },
          },
        },
      });

      // Handle refund if payment was processed and refund is requested
      if (existingAppointment.payment && 
          existingAppointment.payment.status === PaymentStatus.COMPLETED && 
          cancellation.refundRequested) {
        await this.processRefund(existingAppointment.payment.id, cancellation.reason);
      }

      logger.info(`Appointment ${appointmentId} cancelled by ${userRole}`);
      
      // Convert Decimal to number for consultationFee and payment amount
      const result = {
        ...cancelledAppointment,
        doctor: {
          ...cancelledAppointment.doctor,
          consultationFee: Number(cancelledAppointment.doctor.consultationFee),
        },
        payment: cancelledAppointment.payment ? {
          ...cancelledAppointment.payment,
          amount: Number(cancelledAppointment.payment.amount),
        } : null,
      };
      
      return result;
    } catch (error) {
      logger.error('Error cancelling appointment:', error);
      throw error;
    }
  }

  /**
   * Reschedule an appointment
   */
  async rescheduleAppointment(
    appointmentId: string,
    userId: string,
    userRole: string,
    reschedule: AppointmentReschedule
  ): Promise<AppointmentWithDetails> {
    try {
      const existingAppointment = await this.prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          doctor: { select: { userId: true } },
          patient: { select: { userId: true } },
        },
      });

      if (!existingAppointment) {
        throw new Error('Appointment not found');
      }

      // Authorization check
      if (userRole === 'DOCTOR' && existingAppointment.doctor.userId !== userId) {
        throw new Error('Unauthorized: You can only reschedule your own appointments');
      }
      if (userRole === 'PATIENT' && existingAppointment.patient.userId !== userId) {
        throw new Error('Unauthorized: You can only reschedule your own appointments');
      }

      // Check if appointment can be rescheduled
      if (existingAppointment.status === AppointmentStatus.COMPLETED) {
        throw new Error('Cannot reschedule a completed appointment');
      }
      if (existingAppointment.status === AppointmentStatus.CANCELLED) {
        throw new Error('Cannot reschedule a cancelled appointment');
      }

      // Validate new appointment time
      const validation = await this.validateAppointmentRequest(
        existingAppointment.patientId,
        {
          doctorId: existingAppointment.doctorId,
          scheduledDateTime: reschedule.newDateTime,
          type: existingAppointment.type,
        }
      );
      if (!validation.isValid) {
        throw new Error(`Rescheduling validation failed: ${validation.errors.join(', ')}`);
      }

      // Check for conflicts at new time
      const conflictCheck = await this.checkAppointmentConflicts(
        existingAppointment.doctorId,
        reschedule.newDateTime,
        appointmentId // Exclude current appointment from conflict check
      );
      if (conflictCheck.hasConflict) {
        throw new Error('Doctor is not available at the requested new time');
      }

      // Update the appointment
      const rescheduledAppointment = await this.prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          scheduledDateTime: reschedule.newDateTime,
          notes: reschedule.reason ? 
            `Rescheduled: ${reschedule.reason}` : 
            existingAppointment.notes,
          updatedAt: new Date(),
        },
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              phone: true,
              age: true,
              gender: true,
            },
          },
          doctor: {
            select: {
              id: true,
              name: true,
              specializations: true,
              consultationFee: true,
              clinicName: true,
              clinicAddress: true,
            },
          },
          payment: {
            select: {
              id: true,
              amount: true,
              status: true,
              processedAt: true,
            },
          },
        },
      });

      logger.info(`Appointment ${appointmentId} rescheduled to ${reschedule.newDateTime}`);
      
      // Convert Decimal to number for consultationFee and payment amount
      const result = {
        ...rescheduledAppointment,
        doctor: {
          ...rescheduledAppointment.doctor,
          consultationFee: Number(rescheduledAppointment.doctor.consultationFee),
        },
        payment: rescheduledAppointment.payment ? {
          ...rescheduledAppointment.payment,
          amount: Number(rescheduledAppointment.payment.amount),
        } : null,
      };
      
      return result;
    } catch (error) {
      logger.error('Error rescheduling appointment:', error);
      throw error;
    }
  }

  /**
   * Get appointments with filtering and pagination
   */
  async getAppointments(
    userId: string,
    userRole: string,
    filters: AppointmentFilters = {}
  ): Promise<PaginatedResult<AppointmentWithDetails>> {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const skip = (page - 1) * limit;

      // Build where clause based on user role and filters
      const whereClause: any = {};

      // Role-based filtering
      if (userRole === 'PATIENT') {
        const patientProfile = await this.prisma.patientProfile.findUnique({
          where: { userId },
          select: { id: true },
        });
        if (!patientProfile) {
          throw new Error('Patient profile not found');
        }
        whereClause.patientId = patientProfile.id;
      } else if (userRole === 'DOCTOR') {
        const doctorProfile = await this.prisma.doctorProfile.findUnique({
          where: { userId },
          select: { id: true },
        });
        if (!doctorProfile) {
          throw new Error('Doctor profile not found');
        }
        whereClause.doctorId = doctorProfile.id;
      }

      // Apply additional filters
      if (filters.status) {
        whereClause.status = filters.status;
      }
      if (filters.type) {
        whereClause.type = filters.type;
      }
      if (filters.dateFrom || filters.dateTo) {
        whereClause.scheduledDateTime = {};
        if (filters.dateFrom) {
          whereClause.scheduledDateTime.gte = filters.dateFrom;
        }
        if (filters.dateTo) {
          whereClause.scheduledDateTime.lte = filters.dateTo;
        }
      }
      if (filters.doctorId) {
        whereClause.doctorId = filters.doctorId;
      }
      if (filters.patientId) {
        whereClause.patientId = filters.patientId;
      }

      // Build order by clause
      const orderBy: any = {};
      const sortBy = filters.sortBy || 'scheduledDateTime';
      const sortOrder = filters.sortOrder || 'desc';
      orderBy[sortBy] = sortOrder;

      // Execute queries
      const [appointments, total] = await Promise.all([
        this.prisma.appointment.findMany({
          where: whereClause,
          include: {
            patient: {
              select: {
                id: true,
                name: true,
                phone: true,
                age: true,
                gender: true,
              },
            },
            doctor: {
              select: {
                id: true,
                name: true,
                specializations: true,
                consultationFee: true,
                clinicName: true,
                clinicAddress: true,
              },
            },
            payment: {
              select: {
                id: true,
                amount: true,
                status: true,
                processedAt: true,
              },
            },
          },
          orderBy,
          skip,
          take: limit,
        }),
        this.prisma.appointment.count({ where: whereClause }),
      ]);

      // Convert Decimal to number for consultationFee and payment amount in all appointments
      const convertedAppointments = appointments.map(appointment => ({
        ...appointment,
        doctor: {
          ...appointment.doctor,
          consultationFee: Number(appointment.doctor.consultationFee),
        },
        payment: appointment.payment ? {
          ...appointment.payment,
          amount: Number(appointment.payment.amount),
        } : null,
      }));

      return {
        data: convertedAppointments,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error getting appointments:', error);
      throw error;
    }
  }

  /**
   * Get a single appointment by ID
   */
  async getAppointmentById(appointmentId: string, userId: string, userRole: string): Promise<AppointmentWithDetails> {
    try {
      const appointment = await this.prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              phone: true,
              age: true,
              gender: true,
              userId: true,
            },
          },
          doctor: {
            select: {
              id: true,
              name: true,
              specializations: true,
              consultationFee: true,
              clinicName: true,
              clinicAddress: true,
              userId: true,
            },
          },
          payment: {
            select: {
              id: true,
              amount: true,
              status: true,
              processedAt: true,
            },
          },
        },
      });

      if (!appointment) {
        throw new Error('Appointment not found');
      }

      // Authorization check
      if (userRole === 'DOCTOR' && appointment.doctor.userId !== userId) {
        throw new Error('Unauthorized: You can only view your own appointments');
      }
      if (userRole === 'PATIENT' && appointment.patient.userId !== userId) {
        throw new Error('Unauthorized: You can only view your own appointments');
      }

      // Remove userId from response and convert Decimal to number
      const { userId: patientUserId, ...patientData } = appointment.patient;
      const { userId: doctorUserId, ...doctorData } = appointment.doctor;

      return {
        ...appointment,
        patient: patientData,
        doctor: {
          ...doctorData,
          consultationFee: Number(doctorData.consultationFee),
        },
        payment: appointment.payment ? {
          ...appointment.payment,
          amount: Number(appointment.payment.amount),
        } : null,
      };
    } catch (error) {
      logger.error('Error getting appointment by ID:', error);
      throw error;
    }
  }

  /**
   * Validate appointment request business rules
   */
  private async validateAppointmentRequest(
    _patientId: string,
    appointmentData: AppointmentRequest
  ): Promise<ValidationResult> {
    const errors: string[] = [];

    try {
      // Check if doctor exists and is accepting patients
      const doctor = await this.prisma.doctorProfile.findUnique({
        where: { id: appointmentData.doctorId },
      });

      if (!doctor) {
        errors.push('Doctor not found');
      } else {
        if (!doctor.isAcceptingPatients) {
          errors.push('Doctor is not currently accepting new patients');
        }
        if (!doctor.licenseVerified) {
          errors.push('Doctor license is not verified');
        }
      }

      // Check appointment timing constraints (24-48 hours advance)
      const now = new Date();
      const appointmentTime = new Date(appointmentData.scheduledDateTime);
      const timeDifference = appointmentTime.getTime() - now.getTime();
      const hoursUntilAppointment = timeDifference / (1000 * 60 * 60);

      if (hoursUntilAppointment < 24) {
        errors.push('Appointments must be booked at least 24 hours in advance');
      }
      if (hoursUntilAppointment > 48) {
        errors.push('Appointments cannot be booked more than 48 hours in advance');
      }

      // Check if appointment is in the past
      if (appointmentTime <= now) {
        errors.push('Appointment time cannot be in the past');
      }

      // Check if appointment is during business hours (9 AM - 6 PM)
      const appointmentHour = appointmentTime.getHours();
      if (appointmentHour < 9 || appointmentHour >= 18) {
        errors.push('Appointments can only be scheduled between 9 AM and 6 PM');
      }

      // Check if appointment is on a weekday (Monday-Friday)
      const dayOfWeek = appointmentTime.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        errors.push('Appointments can only be scheduled on weekdays (Monday-Friday)');
      }

    } catch (error) {
      logger.error('Error validating appointment request:', error);
      errors.push('Validation error occurred');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check for appointment conflicts
   */
  private async checkAppointmentConflicts(
    doctorId: string,
    scheduledDateTime: Date,
    excludeAppointmentId?: string
  ): Promise<ConflictCheck> {
    try {
      // Check for appointments within 30 minutes of the requested time
      const startTime = new Date(scheduledDateTime.getTime() - 30 * 60 * 1000); // 30 minutes before
      const endTime = new Date(scheduledDateTime.getTime() + 30 * 60 * 1000);   // 30 minutes after

      const whereClause: any = {
        doctorId,
        scheduledDateTime: {
          gte: startTime,
          lte: endTime,
        },
        status: {
          in: [
            AppointmentStatus.AWAITING_ACCEPTANCE,
            AppointmentStatus.PAYMENT_PENDING,
            AppointmentStatus.CONFIRMED,
          ],
        },
      };

      if (excludeAppointmentId) {
        whereClause.id = { not: excludeAppointmentId };
      }

      const conflictingAppointments = await this.prisma.appointment.findMany({
        where: whereClause,
        select: {
          id: true,
          scheduledDateTime: true,
          status: true,
        },
      });

      return {
        hasConflict: conflictingAppointments.length > 0,
        conflictingAppointments,
      };
    } catch (error) {
      logger.error('Error checking appointment conflicts:', error);
      throw error;
    }
  }

  /**
   * Validate status transitions
   */
  private validateStatusTransition(
    currentStatus: AppointmentStatus,
    newStatus: AppointmentStatus,
    userRole: string
  ): boolean {
    const validTransitions: Record<AppointmentStatus, AppointmentStatus[]> = {
      [AppointmentStatus.AWAITING_ACCEPTANCE]: [
        AppointmentStatus.REJECTED,
        AppointmentStatus.PAYMENT_PENDING,
        AppointmentStatus.CANCELLED,
      ],
      [AppointmentStatus.REJECTED]: [], // No transitions from rejected
      [AppointmentStatus.PAYMENT_PENDING]: [
        AppointmentStatus.CONFIRMED,
        AppointmentStatus.CANCELLED,
      ],
      [AppointmentStatus.CONFIRMED]: [
        AppointmentStatus.COMPLETED,
        AppointmentStatus.CANCELLED,
      ],
      [AppointmentStatus.COMPLETED]: [], // No transitions from completed
      [AppointmentStatus.CANCELLED]: [], // No transitions from cancelled
    };

    // Check if the transition is valid
    const allowedTransitions = validTransitions[currentStatus] || [];
    if (!allowedTransitions.includes(newStatus)) {
      return false;
    }

    // Role-based transition restrictions
    if (userRole === 'PATIENT') {
      // Patients can only cancel appointments
      return newStatus === AppointmentStatus.CANCELLED;
    }

    if (userRole === 'DOCTOR') {
      // Doctors can accept, reject, complete, or cancel appointments
      const doctorAllowedTransitions: AppointmentStatus[] = [
        AppointmentStatus.REJECTED,
        AppointmentStatus.PAYMENT_PENDING,
        AppointmentStatus.COMPLETED,
        AppointmentStatus.CANCELLED,
      ];
      return doctorAllowedTransitions.includes(newStatus);
    }

    // Admins can perform any valid transition
    return true;
  }

  /**
   * Process refund for cancelled appointment
   */
  private async processRefund(paymentId: string, reason: string): Promise<void> {
    try {
      // Import payment service dynamically to avoid circular dependency
      const { paymentService } = await import('./paymentService');
      await paymentService.refundPayment(paymentId, reason);
      
      logger.info(`Refund processed for payment ${paymentId}`);
    } catch (error) {
      logger.error('Error processing refund:', error);
      throw error;
    }
  }

  /**
   * Get appointment statistics for dashboard
   */
  async getAppointmentStats(userId: string, userRole: string): Promise<AppointmentStats> {
    try {
      const whereClause: any = {};

      // Role-based filtering
      if (userRole === 'PATIENT') {
        const patientProfile = await this.prisma.patientProfile.findUnique({
          where: { userId },
          select: { id: true },
        });
        if (!patientProfile) {
          throw new Error('Patient profile not found');
        }
        whereClause.patientId = patientProfile.id;
      } else if (userRole === 'DOCTOR') {
        const doctorProfile = await this.prisma.doctorProfile.findUnique({
          where: { userId },
          select: { id: true },
        });
        if (!doctorProfile) {
          throw new Error('Doctor profile not found');
        }
        whereClause.doctorId = doctorProfile.id;
      }

      const [total, statusCounts, typeCounts, upcomingCount, completedCount] = await Promise.all([
        this.prisma.appointment.count({ where: whereClause }),
        this.prisma.appointment.groupBy({
          by: ['status'],
          where: whereClause,
          _count: { status: true },
        }),
        this.prisma.appointment.groupBy({
          by: ['type'],
          where: whereClause,
          _count: { type: true },
        }),
        this.prisma.appointment.count({
          where: {
            ...whereClause,
            scheduledDateTime: { gte: new Date() },
            status: { in: [AppointmentStatus.CONFIRMED, AppointmentStatus.PAYMENT_PENDING] },
          },
        }),
        this.prisma.appointment.count({
          where: {
            ...whereClause,
            status: AppointmentStatus.COMPLETED,
          },
        }),
      ]);

      // Convert arrays to objects
      const byStatus = statusCounts.reduce((acc: Record<AppointmentStatus, number>, item: any) => {
        acc[item.status as AppointmentStatus] = item._count.status;
        return acc;
      }, {} as Record<AppointmentStatus, number>);

      const byType = typeCounts.reduce((acc: Record<AppointmentType, number>, item: any) => {
        acc[item.type as AppointmentType] = item._count.type;
        return acc;
      }, {} as Record<AppointmentType, number>);

      return {
        total,
        byStatus,
        byType,
        upcomingCount,
        completedCount,
      };
    } catch (error) {
      logger.error('Error getting appointment stats:', error);
      throw error;
    }
  }

  /**
   * Create Zoom meeting for online appointment
   */
  private async createZoomMeetingForAppointment(appointment: any): Promise<void> {
    try {
      // Import zoom service dynamically to avoid circular dependency
      const { zoomService } = await import('./zoomService');
      
      const meetingRequest = {
        appointmentId: appointment.id,
        topic: `Medical Consultation - Dr. ${appointment.doctor.name} & ${appointment.patient.name}`,
        startTime: appointment.scheduledDateTime,
        duration: 30, // Default 30 minutes
        hostEmail: appointment.doctor.user.email,
        participantEmail: appointment.patient.user.email,
        participantName: appointment.patient.name
      };

      await zoomService.createMeeting(meetingRequest);
      logger.info(`Zoom meeting created for appointment ${appointment.id}`);
      
    } catch (error) {
      logger.error('Error creating Zoom meeting for appointment:', error);
      throw error;
    }
  }

  /**
   * Send notifications based on appointment status changes
   */
  private async sendStatusChangeNotifications(
    appointment: any,
    _oldStatus: AppointmentStatus,
    newStatus: AppointmentStatus
  ) {
    const appointmentData = {
      appointmentId: appointment.id,
      patientName: appointment.patient.name,
      doctorName: appointment.doctor.name,
      appointmentDateTime: appointment.scheduledDateTime,
      appointmentType: appointment.type,
      clinicName: appointment.doctor.clinicName,
      clinicAddress: appointment.doctor.clinicAddress,
    };

    // Get user IDs for notifications
    const patientUserId = await this.prisma.patientProfile.findUnique({
      where: { id: appointment.patientId },
      select: { userId: true },
    });

    const doctorUserId = await this.prisma.doctorProfile.findUnique({
      where: { id: appointment.doctorId },
      select: { userId: true },
    });

    if (!patientUserId || !doctorUserId) {
      logger.error('Could not find user IDs for notification');
      return;
    }

    switch (newStatus) {
      case AppointmentStatus.REJECTED:
        // Notify patient about rejection
        await notificationService.createNotification({
          userId: patientUserId.userId,
          type: NotificationType.APPOINTMENT_REJECTED,
          title: 'Appointment Request Declined',
          message: `Dr. ${appointment.doctor.name} has declined your appointment request.`,
          data: appointmentData,
          channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP, NotificationChannel.PUSH],
        });
        break;

      case AppointmentStatus.PAYMENT_PENDING:
        // Notify patient about acceptance (payment required)
        await notificationService.createNotification({
          userId: patientUserId.userId,
          type: NotificationType.APPOINTMENT_ACCEPTED,
          title: 'Appointment Accepted - Payment Required',
          message: `Dr. ${appointment.doctor.name} has accepted your appointment. Please complete payment to confirm.`,
          data: appointmentData,
          channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP, NotificationChannel.PUSH],
        });
        break;

      case AppointmentStatus.CONFIRMED:
        // Notify both patient and doctor about confirmation
        await Promise.all([
          notificationService.createNotification({
            userId: patientUserId.userId,
            type: NotificationType.PAYMENT_CONFIRMED,
            title: 'Appointment Confirmed',
            message: `Your appointment with Dr. ${appointment.doctor.name} is confirmed.`,
            data: appointmentData,
            channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
          }),
          notificationService.createNotification({
            userId: doctorUserId.userId,
            type: NotificationType.PAYMENT_CONFIRMED,
            title: 'Appointment Payment Confirmed',
            message: `Payment confirmed for appointment with ${appointment.patient.name}.`,
            data: appointmentData,
            channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
          }),
        ]);
        break;

      case AppointmentStatus.CANCELLED:
        // Notify both parties about cancellation
        await Promise.all([
          notificationService.createNotification({
            userId: patientUserId.userId,
            type: NotificationType.APPOINTMENT_CANCELLED,
            title: 'Appointment Cancelled',
            message: `Your appointment with Dr. ${appointment.doctor.name} has been cancelled.`,
            data: appointmentData,
            channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
          }),
          notificationService.createNotification({
            userId: doctorUserId.userId,
            type: NotificationType.APPOINTMENT_CANCELLED,
            title: 'Appointment Cancelled',
            message: `Appointment with ${appointment.patient.name} has been cancelled.`,
            data: appointmentData,
            channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
          }),
        ]);
        break;
    }
  }
}

export const appointmentService = new AppointmentService(new PrismaClient());