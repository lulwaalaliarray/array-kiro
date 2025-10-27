import { ZoomService } from '../../services/zoomService';
import { PrismaClient } from '@prisma/client';
import { ZoomMeetingRequest, ZoomMeetingStatus, ZoomMeetingUpdate } from '../../types/zoom';
import axios from 'axios';

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  })),
  post: jest.fn(),
}));

const mockAxios = axios as jest.Mocked<typeof axios>;
const mockAxiosInstance = {
  post: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  },
};

// Mock Prisma Client
const mockPrisma = {
  appointment: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  zoomMeeting: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    findMany: jest.fn(),
  },
} as unknown as PrismaClient;

describe('ZoomService', () => {
  let zoomService: ZoomService;

  beforeEach(() => {
    // Setup axios mock
    (mockAxios.create as jest.Mock).mockReturnValue(mockAxiosInstance);
    
    // Mock environment variables
    process.env['ZOOM_API_KEY'] = 'test-api-key';
    process.env['ZOOM_API_SECRET'] = 'test-api-secret';
    process.env['ZOOM_ACCOUNT_ID'] = 'test-account-id';
    
    zoomService = new ZoomService(mockPrisma);
    jest.clearAllMocks();
  });

  describe('createMeeting', () => {
    it('should create a Zoom meeting successfully', async () => {
      // Mock appointment data
      const mockAppointment = {
        id: 'appointment-1',
        type: 'ONLINE',
        scheduledDateTime: new Date(),
        patient: {
          name: 'John Doe',
          userId: 'patient-1'
        },
        doctor: {
          name: 'Dr. Smith',
          userId: 'doctor-1'
        }
      };

      const mockZoomApiResponse = {
        id: 123456789,
        uuid: 'test-uuid',
        host_id: 'host-id',
        topic: 'Test Meeting',
        type: 2,
        start_time: '2024-01-01T10:00:00Z',
        duration: 30,
        timezone: 'UTC',
        created_at: '2024-01-01T09:00:00Z',
        start_url: 'https://zoom.us/s/123456789?role=host',
        join_url: 'https://zoom.us/j/123456789',
        password: 'password123'
      };

      const mockZoomMeetingRecord = {
        id: 'zoom-meeting-1',
        appointmentId: 'appointment-1',
        zoomMeetingId: '123456789',
        topic: 'Test Meeting',
        startTime: new Date('2024-01-01T10:00:00Z'),
        duration: 30,
        hostUrl: 'https://zoom.us/s/123456789?role=host',
        joinUrl: 'https://zoom.us/j/123456789',
        password: 'password123',
        status: ZoomMeetingStatus.SCHEDULED,
        hostEmail: 'doctor@example.com',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock Zoom API token request
      mockAxios.post.mockResolvedValueOnce({
        data: {
          access_token: 'test-token',
          expires_in: 3600
        }
      });

      // Mock Zoom API meeting creation
      mockAxiosInstance.post.mockResolvedValueOnce({
        data: mockZoomApiResponse
      });

      // Mock Prisma calls
      (mockPrisma.appointment.findUnique as jest.Mock).mockResolvedValue(mockAppointment);
      (mockPrisma.zoomMeeting.create as jest.Mock).mockResolvedValue(mockZoomMeetingRecord);
      (mockPrisma.appointment.update as jest.Mock).mockResolvedValue(mockAppointment);

      const meetingRequest: ZoomMeetingRequest = {
        appointmentId: 'appointment-1',
        topic: 'Test Meeting',
        startTime: new Date('2024-01-01T10:00:00Z'),
        duration: 30,
        hostEmail: 'doctor@example.com',
        participantEmail: 'patient@example.com',
        participantName: 'John Doe'
      };

      const result = await zoomService.createMeeting(meetingRequest);

      expect(result).toBeDefined();
      expect(result.id).toBe('zoom-meeting-1');
      expect(result.meetingId).toBe('123456789');
      expect(result.topic).toBe('Test Meeting');
      expect(result.status).toBe(ZoomMeetingStatus.SCHEDULED);
      expect(mockPrisma.zoomMeeting.create).toHaveBeenCalled();
      expect(mockPrisma.appointment.update).toHaveBeenCalledWith({
        where: { id: 'appointment-1' },
        data: { zoomMeetingId: 'zoom-meeting-1' }
      });
    });

    it('should throw error if appointment not found', async () => {
      (mockPrisma.appointment.findUnique as jest.Mock).mockResolvedValue(null);

      const meetingRequest: ZoomMeetingRequest = {
        appointmentId: 'non-existent',
        topic: 'Test Meeting',
        startTime: new Date(),
        duration: 30,
        hostEmail: 'doctor@example.com',
        participantEmail: 'patient@example.com',
        participantName: 'John Doe'
      };

      await expect(zoomService.createMeeting(meetingRequest)).rejects.toThrow('Appointment not found');
    });
  });

  describe('getMeetingByAppointmentId', () => {
    it('should retrieve meeting by appointment ID', async () => {
      const mockMeeting = {
        id: 'zoom-meeting-1',
        appointmentId: 'appointment-1',
        zoomMeetingId: '123456789',
        topic: 'Test Meeting',
        startTime: new Date(),
        duration: 30,
        hostUrl: 'https://zoom.us/s/123456789?role=host',
        joinUrl: 'https://zoom.us/j/123456789',
        password: 'password123',
        status: ZoomMeetingStatus.SCHEDULED,
        hostEmail: 'doctor@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
        appointment: {
          patient: { name: 'John Doe', userId: 'patient-1' },
          doctor: { name: 'Dr. Smith', userId: 'doctor-1' }
        }
      };

      (mockPrisma.zoomMeeting.findUnique as jest.Mock).mockResolvedValue(mockMeeting);

      const result = await zoomService.getMeetingByAppointmentId('appointment-1');

      expect(result).toBeDefined();
      expect(result?.id).toBe('zoom-meeting-1');
      expect(result?.meetingId).toBe('123456789');
      expect(mockPrisma.zoomMeeting.findUnique).toHaveBeenCalledWith({
        where: { appointmentId: 'appointment-1' },
        include: {
          appointment: {
            include: {
              patient: { select: { name: true, userId: true } },
              doctor: { select: { name: true, userId: true } }
            }
          }
        }
      });
    });

    it('should return null if meeting not found', async () => {
      (mockPrisma.zoomMeeting.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await zoomService.getMeetingByAppointmentId('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getMeetingStats', () => {
    it('should return meeting statistics', async () => {
      (mockPrisma.zoomMeeting.count as jest.Mock)
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(2)  // active
        .mockResolvedValueOnce(7)  // completed
        .mockResolvedValueOnce(1); // cancelled

      const stats = await zoomService.getMeetingStats();

      expect(stats).toEqual({
        totalMeetings: 10,
        activeMeetings: 2,
        completedMeetings: 7,
        cancelledMeetings: 1
      });
    });
  });

  describe('updateMeeting', () => {
    it('should update meeting details successfully', async () => {
      const mockMeeting = {
        id: 'zoom-meeting-1',
        zoomMeetingId: '123456789',
        topic: 'Original Topic',
        startTime: new Date('2024-01-01T10:00:00Z'),
        duration: 30,
        status: ZoomMeetingStatus.SCHEDULED
      };

      const mockUpdatedMeeting = {
        ...mockMeeting,
        topic: 'Updated Topic',
        duration: 45,
        updatedAt: new Date()
      };

      (mockPrisma.zoomMeeting.findUnique as jest.Mock).mockResolvedValue(mockMeeting);
      (mockPrisma.zoomMeeting.update as jest.Mock).mockResolvedValue(mockUpdatedMeeting);
      mockAxiosInstance.patch.mockResolvedValueOnce({ data: {} });

      const updates: ZoomMeetingUpdate = {
        topic: 'Updated Topic',
        duration: 45
      };

      const result = await zoomService.updateMeeting('zoom-meeting-1', updates);

      expect(result.topic).toBe('Updated Topic');
      expect(result.duration).toBe(45);
      expect(mockAxiosInstance.patch).toHaveBeenCalledWith('/meetings/123456789', {
        topic: 'Updated Topic',
        duration: 45
      });
    });

    it('should throw error if meeting not found for update', async () => {
      (mockPrisma.zoomMeeting.findUnique as jest.Mock).mockResolvedValue(null);

      const updates: ZoomMeetingUpdate = { topic: 'New Topic' };

      await expect(zoomService.updateMeeting('non-existent', updates)).rejects.toThrow('Meeting not found');
    });
  });

  describe('deleteMeeting', () => {
    it('should cancel meeting successfully', async () => {
      const mockMeeting = {
        id: 'zoom-meeting-1',
        zoomMeetingId: '123456789'
      };

      (mockPrisma.zoomMeeting.findUnique as jest.Mock).mockResolvedValue(mockMeeting);
      (mockPrisma.zoomMeeting.update as jest.Mock).mockResolvedValue({});
      mockAxiosInstance.delete.mockResolvedValueOnce({ data: {} });

      await zoomService.deleteMeeting('zoom-meeting-1');

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/meetings/123456789');
      expect(mockPrisma.zoomMeeting.update).toHaveBeenCalledWith({
        where: { id: 'zoom-meeting-1' },
        data: {
          status: ZoomMeetingStatus.CANCELLED,
          updatedAt: expect.any(Date)
        }
      });
    });

    it('should throw error if meeting not found for deletion', async () => {
      (mockPrisma.zoomMeeting.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(zoomService.deleteMeeting('non-existent')).rejects.toThrow('Meeting not found');
    });
  });

  describe('startMeeting', () => {
    it('should update meeting status to started', async () => {
      (mockPrisma.zoomMeeting.update as jest.Mock).mockResolvedValue({});

      await zoomService.startMeeting('zoom-meeting-1');

      expect(mockPrisma.zoomMeeting.update).toHaveBeenCalledWith({
        where: { id: 'zoom-meeting-1' },
        data: {
          status: ZoomMeetingStatus.STARTED,
          updatedAt: expect.any(Date)
        }
      });
    });
  });

  describe('endMeeting', () => {
    it('should update meeting status to ended', async () => {
      (mockPrisma.zoomMeeting.update as jest.Mock).mockResolvedValue({});

      await zoomService.endMeeting('zoom-meeting-1');

      expect(mockPrisma.zoomMeeting.update).toHaveBeenCalledWith({
        where: { id: 'zoom-meeting-1' },
        data: {
          status: ZoomMeetingStatus.ENDED,
          updatedAt: expect.any(Date)
        }
      });
    });
  });

  describe('getMeetingById', () => {
    it('should retrieve meeting by ID', async () => {
      const mockMeeting = {
        id: 'zoom-meeting-1',
        zoomMeetingId: '123456789',
        topic: 'Test Meeting',
        startTime: new Date(),
        duration: 30,
        hostUrl: 'https://zoom.us/s/123456789?role=host',
        joinUrl: 'https://zoom.us/j/123456789',
        password: 'password123',
        status: ZoomMeetingStatus.SCHEDULED,
        hostEmail: 'doctor@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
        appointment: {
          patient: { name: 'John Doe', userId: 'patient-1' },
          doctor: { name: 'Dr. Smith', userId: 'doctor-1' }
        }
      };

      (mockPrisma.zoomMeeting.findUnique as jest.Mock).mockResolvedValue(mockMeeting);

      const result = await zoomService.getMeetingById('zoom-meeting-1');

      expect(result).toBeDefined();
      expect(result?.id).toBe('zoom-meeting-1');
      expect(result?.participants).toHaveLength(2);
      expect(result?.participants?.[0]?.role).toBe('host');
      expect(result?.participants?.[1]?.role).toBe('participant');
    });

    it('should return null if meeting not found by ID', async () => {
      (mockPrisma.zoomMeeting.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await zoomService.getMeetingById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getMeetingByZoomId', () => {
    it('should retrieve meeting by Zoom meeting ID', async () => {
      const mockMeeting = {
        id: 'zoom-meeting-1',
        zoomMeetingId: '123456789',
        topic: 'Test Meeting',
        startTime: new Date(),
        duration: 30,
        hostUrl: 'https://zoom.us/s/123456789?role=host',
        joinUrl: 'https://zoom.us/j/123456789',
        password: 'password123',
        status: ZoomMeetingStatus.SCHEDULED,
        hostEmail: 'doctor@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
        appointment: {
          patient: { name: 'John Doe', userId: 'patient-1' },
          doctor: { name: 'Dr. Smith', userId: 'doctor-1' }
        }
      };

      (mockPrisma.zoomMeeting.findUnique as jest.Mock).mockResolvedValue(mockMeeting);

      const result = await zoomService.getMeetingByZoomId('123456789');

      expect(result).toBeDefined();
      expect(result?.meetingId).toBe('123456789');
      expect(mockPrisma.zoomMeeting.findUnique).toHaveBeenCalledWith({
        where: { zoomMeetingId: '123456789' },
        include: {
          appointment: {
            include: {
              patient: { select: { name: true, userId: true } },
              doctor: { select: { name: true, userId: true } }
            }
          }
        }
      });
    });
  });

  describe('cleanupOldMeetings', () => {
    it('should identify old meetings for cleanup', async () => {
      const oldMeetings = [
        { id: 'old-meeting-1', startTime: new Date('2023-01-01') },
        { id: 'old-meeting-2', startTime: new Date('2023-01-02') }
      ];

      (mockPrisma.zoomMeeting.findMany as jest.Mock).mockResolvedValue(oldMeetings);

      const result = await zoomService.cleanupOldMeetings();

      expect(result).toBe(2);
      expect(mockPrisma.zoomMeeting.findMany).toHaveBeenCalledWith({
        where: {
          startTime: { lt: expect.any(Date) },
          status: { in: [ZoomMeetingStatus.ENDED, ZoomMeetingStatus.CANCELLED] }
        }
      });
    });
  });

  describe('generateMeetingLink', () => {
    it('should return host URL for host role', () => {
      const meetingDetails = {
        id: 'meeting-1',
        meetingId: '123456789',
        topic: 'Test Meeting',
        startTime: new Date(),
        duration: 30,
        hostUrl: 'https://zoom.us/s/123456789?role=host',
        joinUrl: 'https://zoom.us/j/123456789',
        password: 'password123',
        status: ZoomMeetingStatus.SCHEDULED,
        hostEmail: 'doctor@example.com',
        participants: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const link = zoomService.generateMeetingLink(meetingDetails, 'host');
      expect(link).toBe('https://zoom.us/s/123456789?role=host');
    });

    it('should return join URL for participant role', () => {
      const meetingDetails = {
        id: 'meeting-1',
        meetingId: '123456789',
        topic: 'Test Meeting',
        startTime: new Date(),
        duration: 30,
        hostUrl: 'https://zoom.us/s/123456789?role=host',
        joinUrl: 'https://zoom.us/j/123456789',
        password: 'password123',
        status: ZoomMeetingStatus.SCHEDULED,
        hostEmail: 'doctor@example.com',
        participants: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const link = zoomService.generateMeetingLink(meetingDetails, 'participant');
      expect(link).toBe('https://zoom.us/j/123456789');
    });
  });

  describe('Meeting Status Tracking', () => {
    it('should track meeting status transitions correctly', async () => {
      const meetingId = 'zoom-meeting-1';

      // Test starting a meeting
      await zoomService.startMeeting(meetingId);
      expect(mockPrisma.zoomMeeting.update).toHaveBeenCalledWith({
        where: { id: meetingId },
        data: {
          status: ZoomMeetingStatus.STARTED,
          updatedAt: expect.any(Date)
        }
      });

      // Test ending a meeting
      await zoomService.endMeeting(meetingId);
      expect(mockPrisma.zoomMeeting.update).toHaveBeenCalledWith({
        where: { id: meetingId },
        data: {
          status: ZoomMeetingStatus.ENDED,
          updatedAt: expect.any(Date)
        }
      });
    });

    it('should handle meeting status in statistics', async () => {
      (mockPrisma.zoomMeeting.count as jest.Mock)
        .mockResolvedValueOnce(15) // total
        .mockResolvedValueOnce(3)  // active (started)
        .mockResolvedValueOnce(10) // completed (ended)
        .mockResolvedValueOnce(2); // cancelled

      const stats = await zoomService.getMeetingStats();

      expect(stats.totalMeetings).toBe(15);
      expect(stats.activeMeetings).toBe(3);
      expect(stats.completedMeetings).toBe(10);
      expect(stats.cancelledMeetings).toBe(2);

      // Verify correct status filters were used
      expect(mockPrisma.zoomMeeting.count).toHaveBeenCalledWith({
        where: { status: ZoomMeetingStatus.STARTED }
      });
      expect(mockPrisma.zoomMeeting.count).toHaveBeenCalledWith({
        where: { status: ZoomMeetingStatus.ENDED }
      });
      expect(mockPrisma.zoomMeeting.count).toHaveBeenCalledWith({
        where: { status: ZoomMeetingStatus.CANCELLED }
      });
    });
  });
});