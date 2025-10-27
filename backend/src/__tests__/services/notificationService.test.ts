import { 
  CreateNotificationRequest 
} from '../../types/notification';

// Mock Prisma
const mockPrisma = {
  notification: {
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
  },
  notificationPreference: {
    findUnique: jest.fn(),
    create: jest.fn(),
    upsert: jest.fn(),
  },
} as any;

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
}));

// Mock nodemailer
const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-message-id' });
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: mockSendMail,
  })),
}));

// Mock logger
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

// Import after mocks
import { notificationService } from '../../services/notificationService';

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Notification Template Rendering', () => {
    it('should render appointment booked email template correctly', async () => {
      const mockNotification = {
        id: 'notification-1',
        userId: 'user-1',
        type: 'APPOINTMENT_BOOKED',
        title: 'Appointment Booking Confirmation',
        message: 'Your appointment has been booked',
        data: {
          patientName: 'John Doe',
          doctorName: 'Dr. Smith',
          appointmentDateTime: '2024-01-15 10:00 AM',
          appointmentType: 'Physical Consultation',
          clinicName: 'City Medical Center',
          clinicAddress: '123 Main St, City'
        },
        channels: ['EMAIL'],
        status: 'SENT',
        createdAt: new Date(),
        user: {
          id: 'user-1',
          email: 'john@example.com',
          role: 'PATIENT',
        },
      };

      mockPrisma.notification.create.mockResolvedValue(mockNotification);
      mockPrisma.notificationPreference.findUnique.mockResolvedValue({
        userId: 'user-1',
        emailEnabled: true,
        appointmentUpdates: true,
      });
      mockPrisma.notification.update.mockResolvedValue(mockNotification);

      const request: CreateNotificationRequest = {
        userId: 'user-1',
        type: 'APPOINTMENT_BOOKED' as any,
        title: 'Appointment Booking Confirmation',
        message: 'Your appointment has been booked',
        data: mockNotification.data,
        channels: ['EMAIL'] as any,
      };

      await notificationService.createNotification(request);

      expect(mockSendMail).toHaveBeenCalledWith({
        from: 'noreply@patientcare.com',
        to: 'john@example.com',
        subject: 'Appointment Booking Confirmation',
        html: expect.stringContaining('Dr. Smith'),
        text: expect.stringContaining('Dr. Smith'),
      });
    });

    it('should render appointment reminder template with meeting link', async () => {
      const mockNotification = {
        id: 'notification-2',
        userId: 'user-1',
        type: 'APPOINTMENT_REMINDER',
        title: 'Appointment Reminder',
        message: 'Reminder for your upcoming appointment',
        data: {
          patientName: 'John Doe',
          doctorName: 'Dr. Smith',
          appointmentDateTime: '2024-01-15 10:00 AM',
          appointmentType: 'Online Consultation',
          meetingLink: 'https://zoom.us/j/123456789'
        },
        channels: ['EMAIL'],
        status: 'SENT',
        user: {
          id: 'user-1',
          email: 'john@example.com',
          role: 'PATIENT',
        },
      };

      mockPrisma.notification.create.mockResolvedValue(mockNotification);
      mockPrisma.notificationPreference.findUnique.mockResolvedValue({
        userId: 'user-1',
        emailEnabled: true,
        appointmentReminders: true,
      });
      mockPrisma.notification.update.mockResolvedValue(mockNotification);

      const request: CreateNotificationRequest = {
        userId: 'user-1',
        type: 'APPOINTMENT_REMINDER' as any,
        title: 'Appointment Reminder',
        message: 'Reminder for your upcoming appointment',
        data: mockNotification.data,
        channels: ['EMAIL'] as any,
      };

      await notificationService.createNotification(request);

      expect(mockSendMail).toHaveBeenCalledWith({
        from: 'noreply@patientcare.com',
        to: 'john@example.com',
        subject: 'Appointment Reminder',
        html: expect.stringContaining('https://zoom.us/j/123456789'),
        text: expect.stringContaining('https://zoom.us/j/123456789'),
      });
    });

    it('should render payment confirmation template correctly', async () => {
      const mockNotification = {
        id: 'notification-3',
        userId: 'user-1',
        type: 'PAYMENT_CONFIRMED',
        title: 'Payment Confirmation',
        message: 'Your payment has been confirmed',
        data: {
          patientName: 'John Doe',
          doctorName: 'Dr. Smith',
          appointmentDateTime: '2024-01-15 10:00 AM',
          appointmentType: 'Physical Consultation',
          paymentAmount: '$100.00'
        },
        channels: ['EMAIL'],
        status: 'SENT',
        user: {
          id: 'user-1',
          email: 'john@example.com',
          role: 'PATIENT',
        },
      };

      mockPrisma.notification.create.mockResolvedValue(mockNotification);
      mockPrisma.notificationPreference.findUnique.mockResolvedValue({
        userId: 'user-1',
        emailEnabled: true,
        paymentNotifications: true,
      });
      mockPrisma.notification.update.mockResolvedValue(mockNotification);

      const request: CreateNotificationRequest = {
        userId: 'user-1',
        type: 'PAYMENT_CONFIRMED' as any,
        title: 'Payment Confirmation',
        message: 'Your payment has been confirmed',
        data: mockNotification.data,
        channels: ['EMAIL'] as any,
      };

      await notificationService.createNotification(request);

      expect(mockSendMail).toHaveBeenCalledWith({
        from: 'noreply@patientcare.com',
        to: 'john@example.com',
        subject: 'Payment Confirmation',
        html: expect.stringContaining('$100.00'),
        text: expect.stringContaining('$100.00'),
      });
    });
  });

  describe('Scheduled Notification Creation and Cancellation', () => {
    it('should create scheduled notification without immediate delivery', async () => {
      const scheduledAt = new Date(Date.now() + 3600000); // 1 hour from now
      const mockNotification = {
        id: 'notification-1',
        userId: 'user-1',
        type: 'APPOINTMENT_REMINDER',
        title: 'Reminder',
        message: 'Appointment reminder',
        scheduledAt,
        status: 'PENDING',
        user: { id: 'user-1', email: 'test@example.com', role: 'PATIENT' },
      };

      mockPrisma.notification.create.mockResolvedValue(mockNotification);

      const request: CreateNotificationRequest = {
        userId: 'user-1',
        type: 'APPOINTMENT_REMINDER' as any,
        title: 'Reminder',
        message: 'Appointment reminder',
        channels: ['EMAIL'] as any,
        scheduledAt,
      };

      const result = await notificationService.createNotification(request);

      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          type: 'APPOINTMENT_REMINDER',
          title: 'Reminder',
          message: 'Appointment reminder',
          data: {},
          channels: ['EMAIL'],
          scheduledAt,
          status: 'PENDING',
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
            },
          },
        },
      });

      expect(result).toEqual(mockNotification);
      expect(mockSendMail).not.toHaveBeenCalled(); // Should not send immediately
    });

    it('should process scheduled notifications when due', async () => {
      const pastTime = new Date(Date.now() - 1000); // 1 second ago
      const mockScheduledNotifications = [
        {
          id: 'notification-1',
          userId: 'user-1',
          type: 'APPOINTMENT_REMINDER',
          title: 'Reminder',
          message: 'Test reminder',
          channels: ['EMAIL'],
          scheduledAt: pastTime,
          status: 'PENDING',
          data: {
            patientName: 'John Doe',
            doctorName: 'Dr. Smith',
            appointmentDateTime: '2024-01-15 10:00 AM'
          },
          user: { id: 'user-1', email: 'test@example.com', role: 'PATIENT' },
        },
      ];

      mockPrisma.notification.findMany.mockResolvedValue(mockScheduledNotifications);
      mockPrisma.notification.update.mockResolvedValue({});
      mockPrisma.notificationPreference.findUnique.mockResolvedValue({
        userId: 'user-1',
        emailEnabled: true,
        appointmentReminders: true,
      });

      const result = await notificationService.processScheduledNotifications();

      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith({
        where: {
          status: 'PENDING',
          scheduledAt: {
            lte: expect.any(Date),
          },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
            },
          },
        },
      });

      expect(mockSendMail).toHaveBeenCalled();
      expect(result).toBe(1);
    });

    it('should not process notifications scheduled for future', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([]);

      const result = await notificationService.processScheduledNotifications();

      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith({
        where: {
          status: 'PENDING',
          scheduledAt: {
            lte: expect.any(Date),
          },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
            },
          },
        },
      });

      expect(result).toBe(0);
    });
  });

  describe('Multi-channel Notification Delivery', () => {
    it('should deliver notification through email channel when enabled', async () => {
      const mockNotification = {
        id: 'notification-1',
        userId: 'user-1',
        type: 'APPOINTMENT_BOOKED',
        title: 'Test Notification',
        message: 'Test message',
        data: {
          patientName: 'John Doe',
          doctorName: 'Dr. Smith'
        },
        channels: ['EMAIL'],
        status: 'SENT',
        createdAt: new Date(),
        user: {
          id: 'user-1',
          email: 'test@example.com',
          role: 'PATIENT',
        },
      };

      mockPrisma.notification.create.mockResolvedValue(mockNotification);
      mockPrisma.notificationPreference.findUnique.mockResolvedValue({
        userId: 'user-1',
        emailEnabled: true,
        appointmentUpdates: true,
      });
      mockPrisma.notification.update.mockResolvedValue(mockNotification);

      const request: CreateNotificationRequest = {
        userId: 'user-1',
        type: 'APPOINTMENT_BOOKED' as any,
        title: 'Test Notification',
        message: 'Test message',
        data: mockNotification.data,
        channels: ['EMAIL'] as any,
      };

      await notificationService.createNotification(request);

      expect(mockSendMail).toHaveBeenCalledWith({
        from: 'noreply@patientcare.com',
        to: 'test@example.com',
        subject: 'Appointment Booking Confirmation',
        html: expect.any(String),
        text: expect.any(String),
      });

      expect(mockPrisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notification-1' },
        data: {
          status: 'DELIVERED',
          sentAt: expect.any(Date),
        },
      });
    });

    it('should handle in-app notifications', async () => {
      const mockNotification = {
        id: 'notification-1',
        userId: 'user-1',
        type: 'APPOINTMENT_BOOKED',
        title: 'Test Notification',
        message: 'Test message',
        data: {},
        channels: ['IN_APP'],
        status: 'SENT',
        createdAt: new Date(),
        user: {
          id: 'user-1',
          email: 'test@example.com',
          role: 'PATIENT',
        },
      };

      mockPrisma.notification.create.mockResolvedValue(mockNotification);
      mockPrisma.notificationPreference.findUnique.mockResolvedValue({
        userId: 'user-1',
        inAppEnabled: true,
      });
      mockPrisma.notification.update.mockResolvedValue(mockNotification);

      const request: CreateNotificationRequest = {
        userId: 'user-1',
        type: 'APPOINTMENT_BOOKED' as any,
        title: 'Test Notification',
        message: 'Test message',
        channels: ['IN_APP'] as any,
      };

      await notificationService.createNotification(request);

      expect(mockSendMail).not.toHaveBeenCalled(); // No email for in-app only
      expect(mockPrisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notification-1' },
        data: {
          status: 'DELIVERED',
          sentAt: expect.any(Date),
        },
      });
    });

    it('should handle multiple channels simultaneously', async () => {
      const mockNotification = {
        id: 'notification-1',
        userId: 'user-1',
        type: 'APPOINTMENT_BOOKED',
        title: 'Test Notification',
        message: 'Test message',
        data: {
          patientName: 'John Doe',
          doctorName: 'Dr. Smith'
        },
        channels: ['EMAIL', 'IN_APP', 'PUSH'],
        status: 'SENT',
        createdAt: new Date(),
        user: {
          id: 'user-1',
          email: 'test@example.com',
          role: 'PATIENT',
        },
      };

      mockPrisma.notification.create.mockResolvedValue(mockNotification);
      mockPrisma.notificationPreference.findUnique.mockResolvedValue({
        userId: 'user-1',
        emailEnabled: true,
        inAppEnabled: true,
        pushEnabled: true,
        appointmentUpdates: true,
      });
      mockPrisma.notification.update.mockResolvedValue(mockNotification);

      const request: CreateNotificationRequest = {
        userId: 'user-1',
        type: 'APPOINTMENT_BOOKED' as any,
        title: 'Test Notification',
        message: 'Test message',
        data: mockNotification.data,
        channels: ['EMAIL', 'IN_APP', 'PUSH'] as any,
      };

      await notificationService.createNotification(request);

      expect(mockSendMail).toHaveBeenCalled(); // Email should be sent
      expect(mockPrisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notification-1' },
        data: {
          status: 'DELIVERED',
          sentAt: expect.any(Date),
        },
      });
    });

    it('should respect user preferences and skip disabled channels', async () => {
      const mockNotification = {
        id: 'notification-1',
        userId: 'user-1',
        type: 'APPOINTMENT_BOOKED',
        title: 'Test Notification',
        message: 'Test message',
        data: {},
        channels: ['EMAIL'],
        status: 'SENT',
        createdAt: new Date(),
        user: {
          id: 'user-1',
          email: 'test@example.com',
          role: 'PATIENT',
        },
      };

      mockPrisma.notification.create.mockResolvedValue(mockNotification);
      mockPrisma.notificationPreference.findUnique.mockResolvedValue({
        userId: 'user-1',
        emailEnabled: false, // Email disabled
        appointmentUpdates: true,
      });
      mockPrisma.notification.update.mockResolvedValue(mockNotification);

      const request: CreateNotificationRequest = {
        userId: 'user-1',
        type: 'APPOINTMENT_BOOKED' as any,
        title: 'Test Notification',
        message: 'Test message',
        channels: ['EMAIL'] as any,
      };

      await notificationService.createNotification(request);

      expect(mockSendMail).not.toHaveBeenCalled(); // Should not send email when disabled
    });

    it('should handle notification delivery failures gracefully', async () => {
      const mockNotification = {
        id: 'notification-1',
        userId: 'user-1',
        type: 'APPOINTMENT_BOOKED',
        title: 'Test Notification',
        message: 'Test message',
        data: {
          patientName: 'John Doe',
          doctorName: 'Dr. Smith'
        },
        channels: ['EMAIL'],
        status: 'SENT',
        createdAt: new Date(),
        user: {
          id: 'user-1',
          email: 'test@example.com',
          role: 'PATIENT',
        },
      };

      mockPrisma.notification.create.mockResolvedValue(mockNotification);
      mockPrisma.notificationPreference.findUnique.mockResolvedValue({
        userId: 'user-1',
        emailEnabled: true,
        appointmentUpdates: true,
      });
      mockPrisma.notification.update.mockResolvedValue(mockNotification);
      
      // Mock email failure
      mockSendMail.mockRejectedValueOnce(new Error('Email service unavailable'));

      const request: CreateNotificationRequest = {
        userId: 'user-1',
        type: 'APPOINTMENT_BOOKED' as any,
        title: 'Test Notification',
        message: 'Test message',
        data: mockNotification.data,
        channels: ['EMAIL'] as any,
      };

      await notificationService.createNotification(request);

      expect(mockPrisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notification-1' },
        data: {
          status: 'FAILED',
          sentAt: expect.any(Date),
        },
      });
    });
  });

  describe('Notification Management', () => {
    it('should get user notifications with filters', async () => {
      const mockNotifications = [
        {
          id: 'notification-1',
          userId: 'user-1',
          type: 'APPOINTMENT_BOOKED',
          title: 'Test',
          message: 'Test message',
          createdAt: new Date(),
          user: { id: 'user-1', email: 'test@example.com', role: 'PATIENT' },
        },
      ];

      mockPrisma.notification.findMany.mockResolvedValue(mockNotifications);

      const filters = {
        userId: 'user-1',
        type: 'APPOINTMENT_BOOKED' as any,
        page: 1,
        limit: 20,
      };

      const result = await notificationService.getUserNotifications(filters);

      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          type: 'APPOINTMENT_BOOKED',
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
            },
          },
        },
      });

      expect(result).toEqual(mockNotifications);
    });

    it('should mark notification as read', async () => {
      const mockNotification = {
        id: 'notification-1',
        userId: 'user-1',
        readAt: new Date(),
      };

      mockPrisma.notification.update.mockResolvedValue(mockNotification);

      const result = await notificationService.markAsRead('notification-1', 'user-1');

      expect(mockPrisma.notification.update).toHaveBeenCalledWith({
        where: {
          id: 'notification-1',
          userId: 'user-1',
        },
        data: {
          readAt: expect.any(Date),
        },
      });

      expect(result).toEqual(mockNotification);
    });

    it('should send bulk notifications', async () => {
      const mockNotifications = [
        { id: 'notification-1', userId: 'user-1' },
        { id: 'notification-2', userId: 'user-2' },
      ];

      mockPrisma.notification.create
        .mockResolvedValueOnce(mockNotifications[0])
        .mockResolvedValueOnce(mockNotifications[1]);

      const request = {
        userIds: ['user-1', 'user-2'],
        type: 'APPOINTMENT_BOOKED' as any,
        title: 'Bulk Notification',
        message: 'Test bulk message',
        channels: ['EMAIL'] as any,
      };

      const result = await notificationService.sendBulkNotification(request);

      expect(mockPrisma.notification.create).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);
    });
  });
});