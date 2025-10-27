import axios, { AxiosInstance } from 'axios';
import { PrismaClient } from '@prisma/client';
import {
  ZoomMeetingRequest,
  ZoomMeetingResponse,
  ZoomMeetingDetails,
  ZoomMeetingUpdate,
  ZoomAPICredentials,
  ZoomTokenResponse,
  ZoomCreateMeetingRequest,
  ZoomCreateMeetingResponse,
  ZoomMeetingStatus,
  ZoomMeetingStats,
  ZoomError
} from '../types/zoom';
import { logger } from '../utils/logger';
import { notificationService } from './notificationService';
import { NotificationType, NotificationChannel } from '../types/notification';

export class ZoomService {
  private prisma: PrismaClient;
  private axiosInstance: AxiosInstance;
  private credentials: ZoomAPICredentials;
  private accessToken: string | null = null;
  private tokenExpiresAt: Date | null = null;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    
    // Initialize Zoom API credentials from environment variables
    this.credentials = {
      apiKey: process.env['ZOOM_API_KEY'] || '',
      apiSecret: process.env['ZOOM_API_SECRET'] || '',
      accountId: process.env['ZOOM_ACCOUNT_ID'] || ''
    };

    // Create axios instance for Zoom API
    this.axiosInstance = axios.create({
      baseURL: 'https://api.zoom.us/v2',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Add request interceptor to include auth token
    this.axiosInstance.interceptors.request.use(async (config) => {
      const token = await this.getAccessToken();
      config.headers.Authorization = `Bearer ${token}`;
      return config;
    });

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        logger.error('Zoom API error:', error.response?.data || error.message);
        throw this.handleZoomError(error);
      }
    );
  }

  /**
   * Create a Zoom meeting for an appointment
   */
  async createMeeting(meetingRequest: ZoomMeetingRequest): Promise<ZoomMeetingResponse> {
    try {
      logger.info(`Creating Zoom meeting for appointment ${meetingRequest.appointmentId}`);

      // Get appointment details
      const appointment = await this.prisma.appointment.findUnique({
        where: { id: meetingRequest.appointmentId },
        include: {
          patient: { select: { name: true, userId: true } },
          doctor: { select: { name: true, userId: true } }
        }
      });

      if (!appointment) {
        throw new Error('Appointment not found');
      }

      // Prepare Zoom meeting request
      const zoomMeetingData: ZoomCreateMeetingRequest = {
        topic: meetingRequest.topic,
        type: 2, // Scheduled meeting
        start_time: meetingRequest.startTime.toISOString(),
        duration: meetingRequest.duration,
        timezone: 'UTC',
        password: this.generateMeetingPassword(),
        agenda: `Medical consultation between Dr. ${appointment.doctor.name} and ${appointment.patient.name}`,
        settings: {
          host_video: true,
          participant_video: true,
          cn_meeting: false,
          in_meeting: true,
          join_before_host: false,
          mute_upon_entry: true,
          watermark: false,
          use_pmi: false,
          approval_type: 0, // Automatically approve
          audio: 'both',
          auto_recording: 'none',
          enforce_login: false,
          waiting_room: true
        }
      };

      // Create meeting via Zoom API
      const response = await this.axiosInstance.post<ZoomCreateMeetingResponse>(
        '/users/me/meetings',
        zoomMeetingData
      );

      const zoomMeeting = response.data;

      // Store meeting details in database
      const meetingRecord = await this.prisma.zoomMeeting.create({
        data: {
          appointmentId: meetingRequest.appointmentId,
          zoomMeetingId: zoomMeeting.id.toString(),
          topic: zoomMeeting.topic,
          startTime: new Date(zoomMeeting.start_time),
          duration: zoomMeeting.duration,
          hostUrl: zoomMeeting.start_url,
          joinUrl: zoomMeeting.join_url,
          password: zoomMeeting.password,
          status: ZoomMeetingStatus.SCHEDULED,
          hostEmail: meetingRequest.hostEmail
        }
      });

      // Update appointment with Zoom meeting ID
      const updatedAppointment = await this.prisma.appointment.update({
        where: { id: meetingRequest.appointmentId },
        data: { zoomMeetingId: meetingRecord.id },
        include: {
          patient: { include: { user: true } },
          doctor: { include: { user: true } }
        }
      });

      // Send meeting link notifications
      try {
        const notificationData = {
          appointmentId: updatedAppointment.id,
          patientName: updatedAppointment.patient.name,
          doctorName: updatedAppointment.doctor.name,
          appointmentDateTime: updatedAppointment.scheduledDateTime,
          appointmentType: updatedAppointment.type,
          meetingLink: zoomMeeting.join_url,
        };

        // Notify patient with meeting link
        await notificationService.createNotification({
          userId: updatedAppointment.patient.userId,
          type: NotificationType.MEETING_LINK_READY,
          title: 'Online Consultation Link Ready',
          message: `Your online consultation link is ready for your appointment with Dr. ${updatedAppointment.doctor.name}.`,
          data: notificationData,
          channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
        });

        // Notify doctor with meeting link
        await notificationService.createNotification({
          userId: updatedAppointment.doctor.userId,
          type: NotificationType.MEETING_LINK_READY,
          title: 'Online Consultation Link Ready',
          message: `Meeting link ready for your appointment with ${updatedAppointment.patient.name}.`,
          data: notificationData,
          channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
        });
      } catch (notificationError) {
        logger.error('Failed to send meeting link notifications:', notificationError);
        // Don't fail the meeting creation if notifications fail
      }

      logger.info(`Zoom meeting created successfully: ${meetingRecord.id}`);

      return {
        id: meetingRecord.id,
        meetingId: zoomMeeting.id.toString(),
        topic: zoomMeeting.topic,
        startTime: new Date(zoomMeeting.start_time),
        duration: zoomMeeting.duration,
        hostUrl: zoomMeeting.start_url,
        joinUrl: zoomMeeting.join_url,
        password: zoomMeeting.password,
        status: ZoomMeetingStatus.SCHEDULED,
        createdAt: meetingRecord.createdAt,
        updatedAt: meetingRecord.updatedAt
      };

    } catch (error) {
      logger.error('Error creating Zoom meeting:', error);
      throw error;
    }
  }

  /**
   * Get meeting details by appointment ID
   */
  async getMeetingByAppointmentId(appointmentId: string): Promise<ZoomMeetingDetails | null> {
    try {
      const meeting = await this.prisma.zoomMeeting.findUnique({
        where: { appointmentId },
        include: {
          appointment: {
            include: {
              patient: { select: { name: true, userId: true } },
              doctor: { select: { name: true, userId: true } }
            }
          }
        }
      });

      if (!meeting) {
        return null;
      }

      return {
        id: meeting.id,
        meetingId: meeting.zoomMeetingId,
        topic: meeting.topic,
        startTime: meeting.startTime,
        duration: meeting.duration,
        hostUrl: meeting.hostUrl,
        joinUrl: meeting.joinUrl,
        password: meeting.password,
        status: meeting.status as ZoomMeetingStatus,
        hostEmail: meeting.hostEmail,
        participants: [
          {
            email: meeting.hostEmail,
            name: meeting.appointment.doctor.name,
            role: 'host'
          },
          {
            email: '', // Patient email would need to be stored separately
            name: meeting.appointment.patient.name,
            role: 'participant'
          }
        ],
        createdAt: meeting.createdAt,
        updatedAt: meeting.updatedAt
      };

    } catch (error) {
      logger.error('Error getting meeting by appointment ID:', error);
      throw error;
    }
  }

  /**
   * Get meeting details by meeting ID
   */
  async getMeetingById(meetingId: string): Promise<ZoomMeetingDetails | null> {
    try {
      const meeting = await this.prisma.zoomMeeting.findUnique({
        where: { id: meetingId },
        include: {
          appointment: {
            include: {
              patient: { select: { name: true, userId: true } },
              doctor: { select: { name: true, userId: true } }
            }
          }
        }
      });

      if (!meeting) {
        return null;
      }

      return {
        id: meeting.id,
        meetingId: meeting.zoomMeetingId,
        topic: meeting.topic,
        startTime: meeting.startTime,
        duration: meeting.duration,
        hostUrl: meeting.hostUrl,
        joinUrl: meeting.joinUrl,
        password: meeting.password,
        status: meeting.status as ZoomMeetingStatus,
        hostEmail: meeting.hostEmail,
        participants: [
          {
            email: meeting.hostEmail,
            name: meeting.appointment.doctor.name,
            role: 'host'
          },
          {
            email: '', // Patient email would need to be stored separately
            name: meeting.appointment.patient.name,
            role: 'participant'
          }
        ],
        createdAt: meeting.createdAt,
        updatedAt: meeting.updatedAt
      };

    } catch (error) {
      logger.error('Error getting meeting by ID:', error);
      throw error;
    }
  }

  /**
   * Get meeting details by Zoom meeting ID
   */
  async getMeetingByZoomId(zoomMeetingId: string): Promise<ZoomMeetingDetails | null> {
    try {
      const meeting = await this.prisma.zoomMeeting.findUnique({
        where: { zoomMeetingId },
        include: {
          appointment: {
            include: {
              patient: { select: { name: true, userId: true } },
              doctor: { select: { name: true, userId: true } }
            }
          }
        }
      });

      if (!meeting) {
        return null;
      }

      return {
        id: meeting.id,
        meetingId: meeting.zoomMeetingId,
        topic: meeting.topic,
        startTime: meeting.startTime,
        duration: meeting.duration,
        hostUrl: meeting.hostUrl,
        joinUrl: meeting.joinUrl,
        password: meeting.password,
        status: meeting.status as ZoomMeetingStatus,
        hostEmail: meeting.hostEmail,
        participants: [
          {
            email: meeting.hostEmail,
            name: meeting.appointment.doctor.name,
            role: 'host'
          },
          {
            email: '', // Patient email would need to be stored separately
            name: meeting.appointment.patient.name,
            role: 'participant'
          }
        ],
        createdAt: meeting.createdAt,
        updatedAt: meeting.updatedAt
      };

    } catch (error) {
      logger.error('Error getting meeting by Zoom ID:', error);
      throw error;
    }
  }

  /**
   * Update meeting details
   */
  async updateMeeting(meetingId: string, updates: ZoomMeetingUpdate): Promise<ZoomMeetingResponse> {
    try {
      const meeting = await this.prisma.zoomMeeting.findUnique({
        where: { id: meetingId }
      });

      if (!meeting) {
        throw new Error('Meeting not found');
      }

      // Prepare update data for Zoom API
      const updateData: any = {};
      if (updates.topic) updateData.topic = updates.topic;
      if (updates.startTime) updateData.start_time = updates.startTime.toISOString();
      if (updates.duration) updateData.duration = updates.duration;

      // Update meeting via Zoom API if there are API-related changes
      if (Object.keys(updateData).length > 0) {
        await this.axiosInstance.patch(
          `/meetings/${meeting.zoomMeetingId}`,
          updateData
        );
      }

      // Update local database record
      const updatedMeeting = await this.prisma.zoomMeeting.update({
        where: { id: meetingId },
        data: {
          topic: updates.topic || meeting.topic,
          startTime: updates.startTime || meeting.startTime,
          duration: updates.duration || meeting.duration,
          status: updates.status || meeting.status,
          updatedAt: new Date()
        }
      });

      logger.info(`Zoom meeting updated: ${meetingId}`);

      return {
        id: updatedMeeting.id,
        meetingId: updatedMeeting.zoomMeetingId,
        topic: updatedMeeting.topic,
        startTime: updatedMeeting.startTime,
        duration: updatedMeeting.duration,
        hostUrl: updatedMeeting.hostUrl,
        joinUrl: updatedMeeting.joinUrl,
        password: updatedMeeting.password,
        status: updatedMeeting.status as ZoomMeetingStatus,
        createdAt: updatedMeeting.createdAt,
        updatedAt: updatedMeeting.updatedAt
      };

    } catch (error) {
      logger.error('Error updating Zoom meeting:', error);
      throw error;
    }
  }

  /**
   * Delete/Cancel a meeting
   */
  async deleteMeeting(meetingId: string): Promise<void> {
    try {
      const meeting = await this.prisma.zoomMeeting.findUnique({
        where: { id: meetingId }
      });

      if (!meeting) {
        throw new Error('Meeting not found');
      }

      // Delete meeting via Zoom API
      await this.axiosInstance.delete(`/meetings/${meeting.zoomMeetingId}`);

      // Update status in database instead of deleting for audit trail
      await this.prisma.zoomMeeting.update({
        where: { id: meetingId },
        data: {
          status: ZoomMeetingStatus.CANCELLED,
          updatedAt: new Date()
        }
      });

      logger.info(`Zoom meeting cancelled: ${meetingId}`);

    } catch (error) {
      logger.error('Error deleting Zoom meeting:', error);
      throw error;
    }
  }

  /**
   * Start a meeting (update status)
   */
  async startMeeting(meetingId: string): Promise<void> {
    try {
      await this.prisma.zoomMeeting.update({
        where: { id: meetingId },
        data: {
          status: ZoomMeetingStatus.STARTED,
          updatedAt: new Date()
        }
      });

      logger.info(`Zoom meeting started: ${meetingId}`);

    } catch (error) {
      logger.error('Error starting Zoom meeting:', error);
      throw error;
    }
  }

  /**
   * End a meeting (update status)
   */
  async endMeeting(meetingId: string): Promise<void> {
    try {
      await this.prisma.zoomMeeting.update({
        where: { id: meetingId },
        data: {
          status: ZoomMeetingStatus.ENDED,
          updatedAt: new Date()
        }
      });

      logger.info(`Zoom meeting ended: ${meetingId}`);

    } catch (error) {
      logger.error('Error ending Zoom meeting:', error);
      throw error;
    }
  }

  /**
   * Get meeting statistics
   */
  async getMeetingStats(): Promise<ZoomMeetingStats> {
    try {
      const [total, active, completed, cancelled] = await Promise.all([
        this.prisma.zoomMeeting.count(),
        this.prisma.zoomMeeting.count({
          where: { status: ZoomMeetingStatus.STARTED }
        }),
        this.prisma.zoomMeeting.count({
          where: { status: ZoomMeetingStatus.ENDED }
        }),
        this.prisma.zoomMeeting.count({
          where: { status: ZoomMeetingStatus.CANCELLED }
        })
      ]);

      return {
        totalMeetings: total,
        activeMeetings: active,
        completedMeetings: completed,
        cancelledMeetings: cancelled
      };

    } catch (error) {
      logger.error('Error getting meeting stats:', error);
      throw error;
    }
  }

  /**
   * Clean up old meetings (archive meetings older than 30 days)
   */
  async cleanupOldMeetings(): Promise<number> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Find meetings to archive
      const oldMeetings = await this.prisma.zoomMeeting.findMany({
        where: {
          startTime: { lt: thirtyDaysAgo },
          status: { in: [ZoomMeetingStatus.ENDED, ZoomMeetingStatus.CANCELLED] }
        }
      });

      // Archive meetings by updating a flag or moving to archive table
      // For now, we'll just log them - in production you might move to archive table
      const archivedCount = oldMeetings.length;

      if (archivedCount > 0) {
        logger.info(`Found ${archivedCount} old meetings for cleanup`);
        // Here you could implement actual archival logic
      }

      return archivedCount;

    } catch (error) {
      logger.error('Error cleaning up old meetings:', error);
      throw error;
    }
  }

  /**
   * Generate meeting link for user role
   */
  generateMeetingLink(meetingDetails: ZoomMeetingDetails, userRole: 'host' | 'participant'): string {
    return userRole === 'host' ? meetingDetails.hostUrl : meetingDetails.joinUrl;
  }

  /**
   * Get access token for Zoom API
   */
  private async getAccessToken(): Promise<string> {
    try {
      // Check if we have a valid token
      if (this.accessToken && this.tokenExpiresAt && new Date() < this.tokenExpiresAt) {
        return this.accessToken;
      }

      // Get new token using Server-to-Server OAuth
      const credentials = Buffer.from(
        `${this.credentials.apiKey}:${this.credentials.apiSecret}`
      ).toString('base64');

      const response = await axios.post<ZoomTokenResponse>(
        'https://zoom.us/oauth/token',
        `grant_type=account_credentials&account_id=${this.credentials.accountId}`,
        {
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiresAt = new Date(Date.now() + (response.data.expires_in - 60) * 1000); // Subtract 60 seconds for safety

      logger.info('Zoom access token refreshed');
      return this.accessToken;

    } catch (error) {
      logger.error('Error getting Zoom access token:', error);
      throw new Error('Failed to authenticate with Zoom API');
    }
  }

  /**
   * Generate a secure meeting password
   */
  private generateMeetingPassword(): string {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /**
   * Handle Zoom API errors
   */
  private handleZoomError(error: any): Error {
    if (error.response?.data) {
      const zoomError: ZoomError = {
        code: error.response.data.code || error.response.status,
        message: error.response.data.message || error.message
      };
      return new Error(`Zoom API Error ${zoomError.code}: ${zoomError.message}`);
    }
    return new Error(`Zoom API Error: ${error.message}`);
  }
}

// Create singleton instance - will be initialized with shared Prisma client
let zoomServiceInstance: ZoomService | null = null;

export const getZoomService = (prisma?: PrismaClient): ZoomService => {
  if (!zoomServiceInstance) {
    zoomServiceInstance = new ZoomService(prisma || new PrismaClient());
  }
  return zoomServiceInstance;
};

// Export default instance
export const zoomService = getZoomService();