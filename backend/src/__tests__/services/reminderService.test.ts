import { reminderService } from '../../services/reminderService';
import { notificationService } from '../../services/notificationService';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';

// Mock Prisma
jest.mock('@prisma/client');
const mockPrisma = {
  appointment: {
    findUnique: jest.fn(),
  },
  scheduledJob: {
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
  },
} as any;

// Mock notification service
jest.mock('../../services/notificationService', () => ({
  notificationService: {
    createNotification: jest.fn(),
  },
}));

// Mock logger
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('ReminderService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createAppointmentReminders', () => {
    it('should create reminder jobs for future appointment', async () => {
      const futureDate = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours from now
      const mockAppointment = {
        id: 'appointment-1',
        scheduledDateTime: futureDate,
        type: 'ONLINE',
        patient: {
          name: 'John Doe',
          user: { id: 'user-1' },
        },
        doctor: {
          name: 'Dr. Smith',
          clinicName: 'Test Clinic',
          clinicAddress: '123 Test St',
        },
        zoomMeeting: {
          joinUrl: 'https://zoom.us/j/123456789',
        },
      };

      mockPrisma.appointment.findUnique.mockResolvedValue(mockAppointment);
      mockPrisma.scheduledJob.create
        .mockResolvedValueOnce({ id: 'job-1' }) // 1-hour reminder
        .mockResolvedValueOnce({ id: 'job-2' }); // 10-minute reminder

      const result = await reminderService.createAppointmentReminders('appointment-1');

      expect(mockPrisma.appointment.findUnique).toHaveBeenCalledWith({
        where: { id: 'appointment-1' },
        include: {
          patient: {
            include: {
              user: true,
            },
          },
          doctor: true,
          zoomMeeting: true,
        },
      });

      expect(mockPrisma.scheduledJob.create).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);
    });

    it('should not create reminders for past appointment times', async () => {
      const pastDate = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
      const mockAppointment = {
        id: 'appointment-1',
        scheduledDateTime: pastDate,
        type: 'PHYSICAL',
        patient: {
          name: 'John Doe',
          user: { id: 'user-1' },
        },
        doctor: {
          name: 'Dr. Smith',
          clinicName: 'Test Clinic',
          clinicAddress: '123 Test St',
        },
        zoomMeeting: null,
      };

      mockPrisma.appointment.findUnique.mockResolvedValue(mockAppointment);

      const result = await reminderService.createAppointmentReminders('appointment-1');

      expect(mockPrisma.scheduledJob.create).not.toHaveBeenCalled();
      expect(result).toHaveLength(0);
    });

    it('should throw error if appointment not found', async () => {
      mockPrisma.appointment.findUnique.mockResolvedValue(null);

      await expect(reminderService.createAppointmentReminders('nonexistent'))
        .rejects.toThrow('Appointment not found');
    });
  });

  describe('cancelAppointmentReminders', () => {
    it('should cancel pending reminder jobs', async () => {
      mockPrisma.scheduledJob.updateMany.mockResolvedValue({ count: 2 });

      await reminderService.cancelAppointmentReminders('appointment-1');

      expect(mockPrisma.scheduledJob.updateMany).toHaveBeenCalledWith({
        where: {
          type: 'appointment_reminder',
          entityId: 'appointment-1',
          status: 'pending',
        },
        data: {
          status: 'cancelled',
        },
      });
    });
  });

  describe('processDueReminders', () => {
    it('should process due reminder jobs', async () => {
      const mockJobs = [
        {
          id: 'job-1',
          type: 'appointment_reminder',
          entityId: 'appointment-1',
          scheduledAt: new Date(Date.now() - 1000), // 1 second ago
          status: 'pending',
          data: {
            appointmentId: 'appointment-1',
            userId: 'user-1',
            reminderType: 'one_hour',
            notificationData: {
              patientName: 'John Doe',
              doctorName: 'Dr. Smith',
              appointmentDateTime: new Date(),
              appointmentType: 'ONLINE',
            },
          },
        },
      ];

      mockPrisma.scheduledJob.findMany.mockResolvedValue(mockJobs);
      mockPrisma.appointment.findUnique.mockResolvedValue({
        id: 'appointment-1',
        status: 'CONFIRMED',
      });
      mockPrisma.scheduledJob.update.mockResolvedValue({});
      (notificationService.createNotification as jest.Mock).mockResolvedValue({});

      const result = await reminderService.processDueReminders();

      expect(mockPrisma.scheduledJob.findMany).toHaveBeenCalledWith({
        where: {
          type: 'appointment_reminder',
          status: 'pending',
          scheduledAt: {
            lte: expect.any(Date),
          },
        },
      });

      expect(notificationService.createNotification).toHaveBeenCalledWith({
        userId: 'user-1',
        type: 'APPOINTMENT_REMINDER',
        title: 'Appointment Reminder - 1 hour',
        message: 'Your appointment with Dr. Dr. Smith is in 1 hour.',
        data: mockJobs[0]?.data?.notificationData,
        channels: ['EMAIL', 'IN_APP', 'PUSH'],
      });

      expect(mockPrisma.scheduledJob.update).toHaveBeenCalledWith({
        where: { id: 'job-1' },
        data: { status: 'completed' },
      });

      expect(result).toBe(1);
    });

    it('should skip reminders for cancelled appointments', async () => {
      const mockJobs = [
        {
          id: 'job-1',
          data: {
            appointmentId: 'appointment-1',
            userId: 'user-1',
            reminderType: 'one_hour',
          },
        },
      ];

      mockPrisma.scheduledJob.findMany.mockResolvedValue(mockJobs);
      mockPrisma.appointment.findUnique.mockResolvedValue({
        id: 'appointment-1',
        status: 'CANCELLED',
      });
      mockPrisma.scheduledJob.update.mockResolvedValue({});

      const result = await reminderService.processDueReminders();

      expect(notificationService.createNotification).not.toHaveBeenCalled();
      expect(mockPrisma.scheduledJob.update).toHaveBeenCalledWith({
        where: { id: 'job-1' },
        data: { status: 'completed' },
      });

      expect(result).toBe(1);
    });

    it('should mark job as failed on error', async () => {
      const mockJobs = [
        {
          id: 'job-1',
          data: {
            appointmentId: 'appointment-1',
            userId: 'user-1',
            reminderType: 'one_hour',
          },
        },
      ];

      mockPrisma.scheduledJob.findMany.mockResolvedValue(mockJobs);
      mockPrisma.appointment.findUnique.mockRejectedValue(new Error('Database error'));
      mockPrisma.scheduledJob.update.mockResolvedValue({});

      const result = await reminderService.processDueReminders();

      expect(mockPrisma.scheduledJob.update).toHaveBeenCalledWith({
        where: { id: 'job-1' },
        data: { status: 'failed' },
      });

      expect(result).toBe(0);
    });
  });

  describe('updateAppointmentReminders', () => {
    it('should cancel existing and create new reminders', async () => {
      const futureDate = new Date(Date.now() + 2 * 60 * 60 * 1000);
      const mockAppointment = {
        id: 'appointment-1',
        scheduledDateTime: futureDate,
        type: 'ONLINE',
        patient: {
          name: 'John Doe',
          user: { id: 'user-1' },
        },
        doctor: {
          name: 'Dr. Smith',
          clinicName: 'Test Clinic',
          clinicAddress: '123 Test St',
        },
        zoomMeeting: {
          joinUrl: 'https://zoom.us/j/123456789',
        },
      };

      mockPrisma.scheduledJob.updateMany.mockResolvedValue({ count: 2 });
      mockPrisma.appointment.findUnique.mockResolvedValue(mockAppointment);
      mockPrisma.scheduledJob.create
        .mockResolvedValueOnce({ id: 'job-1' })
        .mockResolvedValueOnce({ id: 'job-2' });

      await reminderService.updateAppointmentReminders('appointment-1');

      expect(mockPrisma.scheduledJob.updateMany).toHaveBeenCalledWith({
        where: {
          type: 'appointment_reminder',
          entityId: 'appointment-1',
          status: 'pending',
        },
        data: {
          status: 'cancelled',
        },
      });

      expect(mockPrisma.scheduledJob.create).toHaveBeenCalledTimes(2);
    });
  });

  describe('getAppointmentReminders', () => {
    it('should get pending reminder jobs for appointment', async () => {
      const mockJobs = [
        {
          id: 'job-1',
          type: 'appointment_reminder',
          entityId: 'appointment-1',
          scheduledAt: new Date(),
          status: 'pending',
        },
      ];

      mockPrisma.scheduledJob.findMany.mockResolvedValue(mockJobs);

      const result = await reminderService.getAppointmentReminders('appointment-1');

      expect(mockPrisma.scheduledJob.findMany).toHaveBeenCalledWith({
        where: {
          type: 'appointment_reminder',
          entityId: 'appointment-1',
          status: 'pending',
        },
        orderBy: { scheduledAt: 'asc' },
      });

      expect(result).toEqual(mockJobs);
    });
  });

  describe('cleanupOldJobs', () => {
    it('should delete old completed/failed jobs', async () => {
      mockPrisma.scheduledJob.deleteMany.mockResolvedValue({ count: 10 });

      const result = await reminderService.cleanupOldJobs(30);

      expect(mockPrisma.scheduledJob.deleteMany).toHaveBeenCalledWith({
        where: {
          status: {
            in: ['completed', 'failed', 'cancelled'],
          },
          updatedAt: {
            lt: expect.any(Date),
          },
        },
      });

      expect(result).toBe(10);
    });
  });
});