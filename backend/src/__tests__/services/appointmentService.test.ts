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
import { it } from 'node:test';
import { it } from 'node:test';
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
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';
import { AppointmentService } from '../../services/appointmentService';
import { 
  AppointmentRequest, 
  AppointmentStatusUpdate, 
  AppointmentCancellation, 
  AppointmentReschedule
} from '../../types/appointment';

// Mock Prisma client and enums since they aren't available in tests
const mockPrisma = {
  appointment: {
    create: jest.fn(),
    update: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
  },
  doctorProfile: {
    findUnique: jest.fn(),
  },
  patientProfile: {
    findUnique: jest.fn(),
  },
  payment: {
    update: jest.fn(),
  },
} as any;

// Mock enums
enum AppointmentStatus {
  AWAITING_ACCEPTANCE = 'AWAITING_ACCEPTANCE',
  REJECTED = 'REJECTED',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

enum AppointmentType {
  ONLINE = 'ONLINE',
  PHYSICAL = 'PHYSICAL'
}

enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}

describe('AppointmentService', () => {
  let appointmentService: AppointmentService;

  beforeEach(() => {
    appointmentService = new AppointmentService(mockPrisma);
    jest.clearAllMocks();
  });

  describe('Appointment Booking Validation Rules', () => {
    const validAppointmentData: AppointmentRequest = {
      doctorId: 'doctor-123',
      scheduledDateTime: new Date(Date.now() + 25 * 60 * 60 * 1000), // 25 hours from now
      type: AppointmentType.ONLINE,
      notes: 'Regular checkup'
    };

    const mockDoctor = {
      id: 'doctor-123',
      name: 'Dr. Smith',
      isAcceptingPatients: true,
      licenseVerified: true,
      consultationFee: 150,
      specializations: ['Cardiology'],
      clinicName: 'Heart Care Clinic',
      clinicAddress: '123 Medical St'
    };

    const mockCreatedAppointment = {
      id: 'appointment-123',
      patientId: 'patient-123',
      doctorId: 'doctor-123',
      scheduledDateTime: validAppointmentData.scheduledDateTime,
      type: AppointmentType.ONLINE,
      status: AppointmentStatus.AWAITING_ACCEPTANCE,
      paymentStatus: PaymentStatus.PENDING,
      notes: 'Regular checkup',
      createdAt: new Date(),
      updatedAt: new Date(),
      patient: {
        id: 'patient-123',
        name: 'John Doe',
        phone: '1234567890',
        age: 30,
        gender: 'male'
      },
      doctor: mockDoctor,
      payment: null
    };

    it('should successfully create appointment with valid data', async () => {
      mockPrisma.doctorProfile.findUnique.mockResolvedValue(mockDoctor);
      mockPrisma.appointment.findMany.mockResolvedValue([]); // No conflicts
      mockPrisma.appointment.create.mockResolvedValue(mockCreatedAppointment);

      const result = await appointmentService.createAppointment('patient-123', validAppointmentData);

      expect(result).toBeDefined();
      expect(result.id).toBe('appointment-123');
      expect(result.status).toBe(AppointmentStatus.AWAITING_ACCEPTANCE);
      expect(mockPrisma.appointment.create).toHaveBeenCalledWith({
        data: {
          patientId: 'patient-123',
          doctorId: 'doctor-123',
          scheduledDateTime: validAppointmentData.scheduledDateTime,
          type: AppointmentType.ONLINE,
          notes: 'Regular checkup',
          status: AppointmentStatus.AWAITING_ACCEPTANCE,
          paymentStatus: PaymentStatus.PENDING,
        },
        include: expect.any(Object)
      });
    });

    it('should reject appointment if doctor not found', async () => {
      mockPrisma.doctorProfile.findUnique.mockResolvedValue(null);

      await expect(
        appointmentService.createAppointment('patient-123', validAppointmentData)
      ).rejects.toThrow('Appointment validation failed: Doctor not found');
    });

    it('should reject appointment if doctor is not accepting patients', async () => {
      const unavailableDoctor = { ...mockDoctor, isAcceptingPatients: false };
      mockPrisma.doctorProfile.findUnique.mockResolvedValue(unavailableDoctor);

      await expect(
        appointmentService.createAppointment('patient-123', validAppointmentData)
      ).rejects.toThrow('Doctor is not currently accepting new patients');
    });

    it('should reject appointment if doctor license is not verified', async () => {
      const unverifiedDoctor = { ...mockDoctor, licenseVerified: false };
      mockPrisma.doctorProfile.findUnique.mockResolvedValue(unverifiedDoctor);

      await expect(
        appointmentService.createAppointment('patient-123', validAppointmentData)
      ).rejects.toThrow('Doctor license is not verified');
    });

    it('should reject appointment if scheduled less than 24 hours in advance', async () => {
      const tooSoonAppointment = {
        ...validAppointmentData,
        scheduledDateTime: new Date(Date.now() + 20 * 60 * 60 * 1000) // 20 hours from now
      };

      mockPrisma.doctorProfile.findUnique.mockResolvedValue(mockDoctor);

      await expect(
        appointmentService.createAppointment('patient-123', tooSoonAppointment)
      ).rejects.toThrow('Appointments must be booked at least 24 hours in advance');
    });

    it('should reject appointment if scheduled more than 48 hours in advance', async () => {
      const tooFarAppointment = {
        ...validAppointmentData,
        scheduledDateTime: new Date(Date.now() + 50 * 60 * 60 * 1000) // 50 hours from now
      };

      mockPrisma.doctorProfile.findUnique.mockResolvedValue(mockDoctor);

      await expect(
        appointmentService.createAppointment('patient-123', tooFarAppointment)
      ).rejects.toThrow('Appointments cannot be booked more than 48 hours in advance');
    });

    it('should reject appointment if scheduled in the past', async () => {
      const pastAppointment = {
        ...validAppointmentData,
        scheduledDateTime: new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago
      };

      mockPrisma.doctorProfile.findUnique.mockResolvedValue(mockDoctor);

      await expect(
        appointmentService.createAppointment('patient-123', pastAppointment)
      ).rejects.toThrow('Appointment time cannot be in the past');
    });

    it('should reject appointment if scheduled outside business hours', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(8, 0, 0, 0); // 8 AM (before 9 AM)

      const outsideHoursAppointment = {
        ...validAppointmentData,
        scheduledDateTime: tomorrow
      };

      mockPrisma.doctorProfile.findUnique.mockResolvedValue(mockDoctor);

      await expect(
        appointmentService.createAppointment('patient-123', outsideHoursAppointment)
      ).rejects.toThrow('Appointments can only be scheduled between 9 AM and 6 PM');
    });

    it('should reject appointment if scheduled on weekend', async () => {
      const nextSunday = new Date();
      nextSunday.setDate(nextSunday.getDate() + (7 - nextSunday.getDay())); // Next Sunday
      nextSunday.setHours(10, 0, 0, 0); // 10 AM

      const weekendAppointment = {
        ...validAppointmentData,
        scheduledDateTime: nextSunday
      };

      mockPrisma.doctorProfile.findUnique.mockResolvedValue(mockDoctor);

      await expect(
        appointmentService.createAppointment('patient-123', weekendAppointment)
      ).rejects.toThrow('Appointments can only be scheduled on weekdays (Monday-Friday)');
    });

    it('should reject appointment if doctor has conflicting appointment', async () => {
      const conflictingAppointment = {
        id: 'conflict-123',
        scheduledDateTime: validAppointmentData.scheduledDateTime,
        status: AppointmentStatus.CONFIRMED
      };

      mockPrisma.doctorProfile.findUnique.mockResolvedValue(mockDoctor);
      mockPrisma.appointment.findMany.mockResolvedValue([conflictingAppointment]);

      await expect(
        appointmentService.createAppointment('patient-123', validAppointmentData)
      ).rejects.toThrow('Doctor is not available at the requested time');
    });
  });

  describe('Status Transition Workflows', () => {
    const mockAppointment = {
      id: 'appointment-123',
      patientId: 'patient-123',
      doctorId: 'doctor-123',
      status: AppointmentStatus.AWAITING_ACCEPTANCE,
      notes: 'Initial notes',
      doctor: { userId: 'doctor-user-123' },
      patient: { userId: 'patient-user-123' }
    };

    const mockUpdatedAppointment = {
      ...mockAppointment,
      status: AppointmentStatus.PAYMENT_PENDING,
      patient: {
        id: 'patient-123',
        name: 'John Doe',
        phone: '1234567890',
        age: 30,
        gender: 'male'
      },
      doctor: {
        id: 'doctor-123',
        name: 'Dr. Smith',
        specializations: ['Cardiology'],
        consultationFee: 150,
        clinicName: 'Heart Care Clinic',
        clinicAddress: '123 Medical St'
      },
      payment: null
    };

    it('should allow doctor to accept appointment (AWAITING_ACCEPTANCE -> PAYMENT_PENDING)', async () => {
      const statusUpdate: AppointmentStatusUpdate = {
        status: AppointmentStatus.PAYMENT_PENDING,
        notes: 'Appointment accepted'
      };

      mockPrisma.appointment.findUnique.mockResolvedValue(mockAppointment);
      mockPrisma.appointment.update.mockResolvedValue(mockUpdatedAppointment);

      const result = await appointmentService.updateAppointmentStatus(
        'appointment-123',
        'doctor-user-123',
        'DOCTOR',
        statusUpdate
      );

      expect(result.status).toBe(AppointmentStatus.PAYMENT_PENDING);
      expect(mockPrisma.appointment.update).toHaveBeenCalledWith({
        where: { id: 'appointment-123' },
        data: {
          status: AppointmentStatus.PAYMENT_PENDING,
          notes: 'Appointment accepted',
          updatedAt: expect.any(Date)
        },
        include: expect.any(Object)
      });
    });

    it('should allow doctor to reject appointment (AWAITING_ACCEPTANCE -> REJECTED)', async () => {
      const statusUpdate: AppointmentStatusUpdate = {
        status: AppointmentStatus.REJECTED,
        notes: 'Not available at this time'
      };

      const rejectedAppointment = { ...mockUpdatedAppointment, status: AppointmentStatus.REJECTED };

      mockPrisma.appointment.findUnique.mockResolvedValue(mockAppointment);
      mockPrisma.appointment.update.mockResolvedValue(rejectedAppointment);

      const result = await appointmentService.updateAppointmentStatus(
        'appointment-123',
        'doctor-user-123',
        'DOCTOR',
        statusUpdate
      );

      expect(result.status).toBe(AppointmentStatus.REJECTED);
    });

    it('should allow system to confirm appointment after payment (PAYMENT_PENDING -> CONFIRMED)', async () => {
      const paymentPendingAppointment = { ...mockAppointment, status: AppointmentStatus.PAYMENT_PENDING };
      const statusUpdate: AppointmentStatusUpdate = {
        status: AppointmentStatus.CONFIRMED
      };

      const confirmedAppointment = { ...mockUpdatedAppointment, status: AppointmentStatus.CONFIRMED };

      mockPrisma.appointment.findUnique.mockResolvedValue(paymentPendingAppointment);
      mockPrisma.appointment.update.mockResolvedValue(confirmedAppointment);

      const result = await appointmentService.updateAppointmentStatus(
        'appointment-123',
        'admin-user-123',
        'ADMIN',
        statusUpdate
      );

      expect(result.status).toBe(AppointmentStatus.CONFIRMED);
    });

    it('should allow doctor to complete appointment (CONFIRMED -> COMPLETED)', async () => {
      const confirmedAppointment = { ...mockAppointment, status: AppointmentStatus.CONFIRMED };
      const statusUpdate: AppointmentStatusUpdate = {
        status: AppointmentStatus.COMPLETED,
        notes: 'Consultation completed successfully'
      };

      const completedAppointment = { ...mockUpdatedAppointment, status: AppointmentStatus.COMPLETED };

      mockPrisma.appointment.findUnique.mockResolvedValue(confirmedAppointment);
      mockPrisma.appointment.update.mockResolvedValue(completedAppointment);

      const result = await appointmentService.updateAppointmentStatus(
        'appointment-123',
        'doctor-user-123',
        'DOCTOR',
        statusUpdate
      );

      expect(result.status).toBe(AppointmentStatus.COMPLETED);
    });

    it('should reject invalid status transitions', async () => {
      const statusUpdate: AppointmentStatusUpdate = {
        status: AppointmentStatus.COMPLETED // Invalid: can't go directly from AWAITING_ACCEPTANCE to COMPLETED
      };

      mockPrisma.appointment.findUnique.mockResolvedValue(mockAppointment);

      await expect(
        appointmentService.updateAppointmentStatus(
          'appointment-123',
          'doctor-user-123',
          'DOCTOR',
          statusUpdate
        )
      ).rejects.toThrow('Invalid status transition from AWAITING_ACCEPTANCE to COMPLETED');
    });

    it('should reject status transitions from completed appointments', async () => {
      const completedAppointment = { ...mockAppointment, status: AppointmentStatus.COMPLETED };
      const statusUpdate: AppointmentStatusUpdate = {
        status: AppointmentStatus.CANCELLED
      };

      mockPrisma.appointment.findUnique.mockResolvedValue(completedAppointment);

      await expect(
        appointmentService.updateAppointmentStatus(
          'appointment-123',
          'doctor-user-123',
          'DOCTOR',
          statusUpdate
        )
      ).rejects.toThrow('Invalid status transition from COMPLETED to CANCELLED');
    });

    it('should reject unauthorized status updates', async () => {
      const statusUpdate: AppointmentStatusUpdate = {
        status: AppointmentStatus.PAYMENT_PENDING
      };

      mockPrisma.appointment.findUnique.mockResolvedValue(mockAppointment);

      await expect(
        appointmentService.updateAppointmentStatus(
          'appointment-123',
          'wrong-user-123',
          'DOCTOR',
          statusUpdate
        )
      ).rejects.toThrow('Unauthorized: You can only manage your own appointments');
    });

    it('should restrict patient status transitions to cancellation only', async () => {
      const statusUpdate: AppointmentStatusUpdate = {
        status: AppointmentStatus.PAYMENT_PENDING // Patients can't accept appointments
      };

      mockPrisma.appointment.findUnique.mockResolvedValue(mockAppointment);

      await expect(
        appointmentService.updateAppointmentStatus(
          'appointment-123',
          'patient-user-123',
          'PATIENT',
          statusUpdate
        )
      ).rejects.toThrow('Invalid status transition from AWAITING_ACCEPTANCE to PAYMENT_PENDING');
    });
  });

  describe('Cancellation and Rescheduling Logic', () => {
    const mockAppointment = {
      id: 'appointment-123',
      patientId: 'patient-123',
      doctorId: 'doctor-123',
      status: AppointmentStatus.CONFIRMED,
      scheduledDateTime: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours from now
      type: AppointmentType.ONLINE,
      notes: 'Regular checkup',
      doctor: { userId: 'doctor-user-123' },
      patient: { userId: 'patient-user-123' },
      payment: {
        id: 'payment-123',
        status: PaymentStatus.COMPLETED
      }
    };

    const mockCancelledAppointment = {
      ...mockAppointment,
      status: AppointmentStatus.CANCELLED,
      patient: {
        id: 'patient-123',
        name: 'John Doe',
        phone: '1234567890',
        age: 30,
        gender: 'male'
      },
      doctor: {
        id: 'doctor-123',
        name: 'Dr. Smith',
        specializations: ['Cardiology'],
        consultationFee: 150,
        clinicName: 'Heart Care Clinic',
        clinicAddress: '123 Medical St'
      },
      payment: {
        id: 'payment-123',
        amount: 150,
        status: PaymentStatus.COMPLETED,
        processedAt: new Date()
      }
    };

    describe('Appointment Cancellation', () => {
      it('should allow patient to cancel appointment with 24+ hours notice', async () => {
        const cancellation: AppointmentCancellation = {
          reason: 'Personal emergency',
          refundRequested: true
        };

        mockPrisma.appointment.findUnique.mockResolvedValue(mockAppointment);
        mockPrisma.appointment.update.mockResolvedValue(mockCancelledAppointment);
        mockPrisma.payment.update.mockResolvedValue({});

        const result = await appointmentService.cancelAppointment(
          'appointment-123',
          'patient-user-123',
          'PATIENT',
          cancellation
        );

        expect(result.status).toBe(AppointmentStatus.CANCELLED);
        expect(mockPrisma.appointment.update).toHaveBeenCalledWith({
          where: { id: 'appointment-123' },
          data: {
            status: AppointmentStatus.CANCELLED,
            notes: 'Cancelled: Personal emergency',
            updatedAt: expect.any(Date)
          },
          include: expect.any(Object)
        });
      });

      it('should reject patient cancellation with less than 24 hours notice', async () => {
        const soonAppointment = {
          ...mockAppointment,
          scheduledDateTime: new Date(Date.now() + 20 * 60 * 60 * 1000) // 20 hours from now
        };

        const cancellation: AppointmentCancellation = {
          reason: 'Changed my mind'
        };

        mockPrisma.appointment.findUnique.mockResolvedValue(soonAppointment);

        await expect(
          appointmentService.cancelAppointment(
            'appointment-123',
            'patient-user-123',
            'PATIENT',
            cancellation
          )
        ).rejects.toThrow('Appointments can only be cancelled at least 24 hours in advance');
      });

      it('should allow doctor to cancel appointment at any time', async () => {
        const soonAppointment = {
          ...mockAppointment,
          scheduledDateTime: new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours from now
        };

        const cancellation: AppointmentCancellation = {
          reason: 'Medical emergency'
        };

        mockPrisma.appointment.findUnique.mockResolvedValue(soonAppointment);
        mockPrisma.appointment.update.mockResolvedValue(mockCancelledAppointment);

        const result = await appointmentService.cancelAppointment(
          'appointment-123',
          'doctor-user-123',
          'DOCTOR',
          cancellation
        );

        expect(result.status).toBe(AppointmentStatus.CANCELLED);
      });

      it('should reject cancellation of completed appointments', async () => {
        const completedAppointment = { ...mockAppointment, status: AppointmentStatus.COMPLETED };
        const cancellation: AppointmentCancellation = {
          reason: 'Want to cancel'
        };

        mockPrisma.appointment.findUnique.mockResolvedValue(completedAppointment);

        await expect(
          appointmentService.cancelAppointment(
            'appointment-123',
            'patient-user-123',
            'PATIENT',
            cancellation
          )
        ).rejects.toThrow('Cannot cancel a completed appointment');
      });

      it('should reject cancellation of already cancelled appointments', async () => {
        const cancelledAppointment = { ...mockAppointment, status: AppointmentStatus.CANCELLED };
        const cancellation: AppointmentCancellation = {
          reason: 'Want to cancel again'
        };

        mockPrisma.appointment.findUnique.mockResolvedValue(cancelledAppointment);

        await expect(
          appointmentService.cancelAppointment(
            'appointment-123',
            'patient-user-123',
            'PATIENT',
            cancellation
          )
        ).rejects.toThrow('Appointment is already cancelled');
      });

      it('should process refund when requested and payment was completed', async () => {
        const cancellation: AppointmentCancellation = {
          reason: 'Personal emergency',
          refundRequested: true
        };

        mockPrisma.appointment.findUnique.mockResolvedValue(mockAppointment);
        mockPrisma.appointment.update.mockResolvedValue(mockCancelledAppointment);
        mockPrisma.payment.update.mockResolvedValue({});

        await appointmentService.cancelAppointment(
          'appointment-123',
          'patient-user-123',
          'PATIENT',
          cancellation
        );

        expect(mockPrisma.payment.update).toHaveBeenCalledWith({
          where: { id: 'payment-123' },
          data: {
            status: PaymentStatus.REFUNDED,
            refundedAt: expect.any(Date),
            refundReason: 'Personal emergency',
            updatedAt: expect.any(Date)
          }
        });
      });
    });

    describe('Appointment Rescheduling', () => {
      // Create a valid business hours datetime (36 hours from now, set to 10 AM on a weekday)
      const newDateTime = (() => {
        const date = new Date(Date.now() + 36 * 60 * 60 * 1000);
        date.setHours(10, 0, 0, 0); // 10 AM
        // Ensure it's a weekday
        while (date.getDay() === 0 || date.getDay() === 6) {
          date.setDate(date.getDate() + 1);
        }
        return date;
      })();
      
      it('should allow rescheduling to valid new time', async () => {
        const reschedule: AppointmentReschedule = {
          newDateTime,
          reason: 'Schedule conflict resolved'
        };

        const mockDoctor = {
          id: 'doctor-123',
          isAcceptingPatients: true,
          licenseVerified: true
        };

        const rescheduledAppointment = {
          ...mockCancelledAppointment,
          status: AppointmentStatus.CONFIRMED,
          scheduledDateTime: newDateTime
        };

        mockPrisma.appointment.findUnique.mockResolvedValue(mockAppointment);
        mockPrisma.doctorProfile.findUnique.mockResolvedValue(mockDoctor);
        mockPrisma.appointment.findMany.mockResolvedValue([]); // No conflicts
        mockPrisma.appointment.update.mockResolvedValue(rescheduledAppointment);

        const result = await appointmentService.rescheduleAppointment(
          'appointment-123',
          'patient-user-123',
          'PATIENT',
          reschedule
        );

        expect(result.scheduledDateTime).toEqual(newDateTime);
        expect(mockPrisma.appointment.update).toHaveBeenCalledWith({
          where: { id: 'appointment-123' },
          data: {
            scheduledDateTime: newDateTime,
            notes: 'Rescheduled: Schedule conflict resolved',
            updatedAt: expect.any(Date)
          },
          include: expect.any(Object)
        });
      });

      it('should reject rescheduling of completed appointments', async () => {
        const completedAppointment = { ...mockAppointment, status: AppointmentStatus.COMPLETED };
        const reschedule: AppointmentReschedule = {
          newDateTime,
          reason: 'Want to reschedule'
        };

        mockPrisma.appointment.findUnique.mockResolvedValue(completedAppointment);

        await expect(
          appointmentService.rescheduleAppointment(
            'appointment-123',
            'patient-user-123',
            'PATIENT',
            reschedule
          )
        ).rejects.toThrow('Cannot reschedule a completed appointment');
      });

      it('should reject rescheduling of cancelled appointments', async () => {
        const cancelledAppointment = { ...mockAppointment, status: AppointmentStatus.CANCELLED };
        const reschedule: AppointmentReschedule = {
          newDateTime,
          reason: 'Want to reschedule'
        };

        mockPrisma.appointment.findUnique.mockResolvedValue(cancelledAppointment);

        await expect(
          appointmentService.rescheduleAppointment(
            'appointment-123',
            'patient-user-123',
            'PATIENT',
            reschedule
          )
        ).rejects.toThrow('Cannot reschedule a cancelled appointment');
      });

      it('should reject rescheduling to invalid time (less than 24 hours)', async () => {
        const invalidNewTime = new Date(Date.now() + 20 * 60 * 60 * 1000); // 20 hours from now
        const reschedule: AppointmentReschedule = {
          newDateTime: invalidNewTime,
          reason: 'Emergency reschedule'
        };

        const mockDoctor = {
          id: 'doctor-123',
          isAcceptingPatients: true,
          licenseVerified: true
        };

        mockPrisma.appointment.findUnique.mockResolvedValue(mockAppointment);
        mockPrisma.doctorProfile.findUnique.mockResolvedValue(mockDoctor);

        await expect(
          appointmentService.rescheduleAppointment(
            'appointment-123',
            'patient-user-123',
            'PATIENT',
            reschedule
          )
        ).rejects.toThrow('Rescheduling validation failed: Appointments must be booked at least 24 hours in advance');
      });

      it('should reject rescheduling to conflicting time slot', async () => {
        const reschedule: AppointmentReschedule = {
          newDateTime,
          reason: 'Better time'
        };

        const mockDoctor = {
          id: 'doctor-123',
          isAcceptingPatients: true,
          licenseVerified: true
        };

        const conflictingAppointment = {
          id: 'conflict-123',
          scheduledDateTime: newDateTime,
          status: AppointmentStatus.CONFIRMED
        };

        mockPrisma.appointment.findUnique.mockResolvedValue(mockAppointment);
        mockPrisma.doctorProfile.findUnique.mockResolvedValue(mockDoctor);
        mockPrisma.appointment.findMany.mockResolvedValue([conflictingAppointment]);

        await expect(
          appointmentService.rescheduleAppointment(
            'appointment-123',
            'patient-user-123',
            'PATIENT',
            reschedule
          )
        ).rejects.toThrow('Doctor is not available at the requested new time');
      });

      it('should allow rescheduling when excluding current appointment from conflict check', async () => {
        const reschedule: AppointmentReschedule = {
          newDateTime,
          reason: 'Better time'
        };

        const mockDoctor = {
          id: 'doctor-123',
          isAcceptingPatients: true,
          licenseVerified: true
        };

        const rescheduledAppointment = {
          ...mockCancelledAppointment,
          status: AppointmentStatus.CONFIRMED,
          scheduledDateTime: newDateTime
        };

        mockPrisma.appointment.findUnique.mockResolvedValue(mockAppointment);
        mockPrisma.doctorProfile.findUnique.mockResolvedValue(mockDoctor);
        mockPrisma.appointment.findMany.mockResolvedValue([]); // No conflicts after excluding current
        mockPrisma.appointment.update.mockResolvedValue(rescheduledAppointment);

        const result = await appointmentService.rescheduleAppointment(
          'appointment-123',
          'patient-user-123',
          'PATIENT',
          reschedule
        );

        expect(result.scheduledDateTime).toEqual(newDateTime);
        // Verify that the conflict check excluded the current appointment
        expect(mockPrisma.appointment.findMany).toHaveBeenCalledWith({
          where: expect.objectContaining({
            id: { not: 'appointment-123' }
          }),
          select: expect.any(Object)
        });
      });
    });
  });

  describe('Authorization and Access Control', () => {
    const mockAppointment = {
      id: 'appointment-123',
      status: AppointmentStatus.CONFIRMED,
      doctor: { userId: 'doctor-user-123' },
      patient: { userId: 'patient-user-123' }
    };

    it('should reject unauthorized appointment access by different patient', async () => {
      mockPrisma.appointment.findUnique.mockResolvedValue(mockAppointment);

      await expect(
        appointmentService.updateAppointmentStatus(
          'appointment-123',
          'different-patient-123',
          'PATIENT',
          { status: AppointmentStatus.CANCELLED }
        )
      ).rejects.toThrow('Unauthorized: You can only manage your own appointments');
    });

    it('should reject unauthorized appointment access by different doctor', async () => {
      mockPrisma.appointment.findUnique.mockResolvedValue(mockAppointment);

      await expect(
        appointmentService.updateAppointmentStatus(
          'appointment-123',
          'different-doctor-123',
          'DOCTOR',
          { status: AppointmentStatus.PAYMENT_PENDING }
        )
      ).rejects.toThrow('Unauthorized: You can only manage your own appointments');
    });

    it('should allow admin to access any appointment', async () => {
      const statusUpdate: AppointmentStatusUpdate = {
        status: AppointmentStatus.CANCELLED
      };

      const updatedAppointment = {
        ...mockAppointment,
        status: AppointmentStatus.CANCELLED,
        patient: {
          id: 'patient-123',
          name: 'John Doe',
          phone: '1234567890',
          age: 30,
          gender: 'male'
        },
        doctor: {
          id: 'doctor-123',
          name: 'Dr. Smith',
          specializations: ['Cardiology'],
          consultationFee: 150,
          clinicName: 'Heart Care Clinic',
          clinicAddress: '123 Medical St'
        },
        payment: null
      };

      mockPrisma.appointment.findUnique.mockResolvedValue(mockAppointment);
      mockPrisma.appointment.update.mockResolvedValue(updatedAppointment);

      const result = await appointmentService.updateAppointmentStatus(
        'appointment-123',
        'admin-user-123',
        'ADMIN',
        statusUpdate
      );

      expect(result.status).toBe(AppointmentStatus.CANCELLED);
    });
  });
});