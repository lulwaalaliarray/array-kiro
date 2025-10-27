import { Request, Response } from 'express';
import { zoomService } from '../services/zoomService';
import { ZoomMeetingRequest, ZoomMeetingUpdate } from '../types/zoom';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/auth';

export class ZoomController {
  /**
   * Create a Zoom meeting for an appointment
   */
  async createMeeting(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { appointmentId, topic, startTime, duration, hostEmail, participantEmail, participantName } = req.body;

      // Validate required fields
      if (!appointmentId || !topic || !startTime || !duration || !hostEmail) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing required fields: appointmentId, topic, startTime, duration, hostEmail'
          }
        });
        return;
      }

      const meetingRequest: ZoomMeetingRequest = {
        appointmentId,
        topic,
        startTime: new Date(startTime),
        duration,
        hostEmail,
        participantEmail: participantEmail || '',
        participantName: participantName || ''
      };

      const meeting = await zoomService.createMeeting(meetingRequest);

      res.status(201).json({
        success: true,
        data: meeting
      });

    } catch (error) {
      logger.error('Error in createMeeting controller:', error);
      res.status(500).json({
        error: {
          code: 'MEETING_CREATION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to create Zoom meeting'
        }
      });
    }
  }

  /**
   * Get meeting details by appointment ID
   */
  async getMeetingByAppointmentId(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { appointmentId } = req.params;

      if (!appointmentId) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Appointment ID is required'
          }
        });
        return;
      }

      const meeting = await zoomService.getMeetingByAppointmentId(appointmentId);

      if (!meeting) {
        res.status(404).json({
          error: {
            code: 'MEETING_NOT_FOUND',
            message: 'No Zoom meeting found for this appointment'
          }
        });
        return;
      }

      res.json({
        success: true,
        data: meeting
      });

    } catch (error) {
      logger.error('Error in getMeetingByAppointmentId controller:', error);
      res.status(500).json({
        error: {
          code: 'MEETING_FETCH_FAILED',
          message: error instanceof Error ? error.message : 'Failed to fetch meeting details'
        }
      });
    }
  }

  /**
   * Get meeting details by meeting ID
   */
  async getMeetingById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { meetingId } = req.params;

      if (!meetingId) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Meeting ID is required'
          }
        });
        return;
      }

      const meeting = await zoomService.getMeetingById(meetingId);

      if (!meeting) {
        res.status(404).json({
          error: {
            code: 'MEETING_NOT_FOUND',
            message: 'Meeting not found'
          }
        });
        return;
      }

      res.json({
        success: true,
        data: meeting
      });

    } catch (error) {
      logger.error('Error in getMeetingById controller:', error);
      res.status(500).json({
        error: {
          code: 'MEETING_FETCH_FAILED',
          message: error instanceof Error ? error.message : 'Failed to fetch meeting details'
        }
      });
    }
  }

  /**
   * Update meeting details
   */
  async updateMeeting(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { meetingId } = req.params;
      const updates: ZoomMeetingUpdate = req.body;

      if (!meetingId) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Meeting ID is required'
          }
        });
        return;
      }

      // Convert startTime string to Date if provided
      if (updates.startTime) {
        updates.startTime = new Date(updates.startTime);
      }

      const updatedMeeting = await zoomService.updateMeeting(meetingId, updates);

      res.json({
        success: true,
        data: updatedMeeting
      });

    } catch (error) {
      logger.error('Error in updateMeeting controller:', error);
      res.status(500).json({
        error: {
          code: 'MEETING_UPDATE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to update meeting'
        }
      });
    }
  }

  /**
   * Cancel/Delete a meeting
   */
  async deleteMeeting(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { meetingId } = req.params;

      if (!meetingId) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Meeting ID is required'
          }
        });
        return;
      }

      await zoomService.deleteMeeting(meetingId);

      res.json({
        success: true,
        message: 'Meeting cancelled successfully'
      });

    } catch (error) {
      logger.error('Error in deleteMeeting controller:', error);
      res.status(500).json({
        error: {
          code: 'MEETING_DELETION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to cancel meeting'
        }
      });
    }
  }

  /**
   * Start a meeting
   */
  async startMeeting(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { meetingId } = req.params;

      if (!meetingId) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Meeting ID is required'
          }
        });
        return;
      }

      await zoomService.startMeeting(meetingId);

      res.json({
        success: true,
        message: 'Meeting started successfully'
      });

    } catch (error) {
      logger.error('Error in startMeeting controller:', error);
      res.status(500).json({
        error: {
          code: 'MEETING_START_FAILED',
          message: error instanceof Error ? error.message : 'Failed to start meeting'
        }
      });
    }
  }

  /**
   * End a meeting
   */
  async endMeeting(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { meetingId } = req.params;

      if (!meetingId) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Meeting ID is required'
          }
        });
        return;
      }

      await zoomService.endMeeting(meetingId);

      res.json({
        success: true,
        message: 'Meeting ended successfully'
      });

    } catch (error) {
      logger.error('Error in endMeeting controller:', error);
      res.status(500).json({
        error: {
          code: 'MEETING_END_FAILED',
          message: error instanceof Error ? error.message : 'Failed to end meeting'
        }
      });
    }
  }

  /**
   * Get meeting statistics
   */
  async getMeetingStats(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const stats = await zoomService.getMeetingStats();

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      logger.error('Error in getMeetingStats controller:', error);
      res.status(500).json({
        error: {
          code: 'STATS_FETCH_FAILED',
          message: error instanceof Error ? error.message : 'Failed to fetch meeting statistics'
        }
      });
    }
  }

  /**
   * Get meeting link for user
   */
  async getMeetingLink(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { meetingId } = req.params;
      const { role } = req.query;

      if (!meetingId) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Meeting ID is required'
          }
        });
        return;
      }

      if (!role || (role !== 'host' && role !== 'participant')) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Valid role (host or participant) is required'
          }
        });
        return;
      }

      const meeting = await zoomService.getMeetingById(meetingId);

      if (!meeting) {
        res.status(404).json({
          error: {
            code: 'MEETING_NOT_FOUND',
            message: 'Meeting not found'
          }
        });
        return;
      }

      const meetingLink = zoomService.generateMeetingLink(meeting, role as 'host' | 'participant');

      res.json({
        success: true,
        data: {
          meetingLink,
          password: meeting.password,
          meetingId: meeting.meetingId,
          topic: meeting.topic,
          startTime: meeting.startTime
        }
      });

    } catch (error) {
      logger.error('Error in getMeetingLink controller:', error);
      res.status(500).json({
        error: {
          code: 'LINK_GENERATION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to generate meeting link'
        }
      });
    }
  }

  /**
   * Handle Zoom webhooks
   */
  async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      const { event, payload } = req.body;

      logger.info(`Received Zoom webhook: ${event}`, payload);

      // Handle different webhook events
      switch (event) {
        case 'meeting.started':
          await this.handleMeetingStarted(payload);
          break;
        case 'meeting.ended':
          await this.handleMeetingEnded(payload);
          break;
        case 'meeting.participant_joined':
          await this.handleParticipantJoined(payload);
          break;
        case 'meeting.participant_left':
          await this.handleParticipantLeft(payload);
          break;
        default:
          logger.info(`Unhandled webhook event: ${event}`);
      }

      res.status(200).json({ success: true });

    } catch (error) {
      logger.error('Error handling Zoom webhook:', error);
      res.status(500).json({
        error: {
          code: 'WEBHOOK_PROCESSING_FAILED',
          message: 'Failed to process webhook'
        }
      });
    }
  }

  /**
   * Handle meeting started webhook
   */
  private async handleMeetingStarted(payload: any): Promise<void> {
    try {
      const zoomMeetingId = payload.object.id.toString();
      
      // Find meeting in database and update status
      const meeting = await zoomService.getMeetingByZoomId(zoomMeetingId);

      if (meeting) {
        await zoomService.startMeeting(meeting.id);
        logger.info(`Meeting started: ${meeting.id}`);
      }

    } catch (error) {
      logger.error('Error handling meeting started webhook:', error);
    }
  }

  /**
   * Handle meeting ended webhook
   */
  private async handleMeetingEnded(payload: any): Promise<void> {
    try {
      const zoomMeetingId = payload.object.id.toString();
      
      // Find meeting in database and update status
      const meeting = await zoomService.getMeetingByZoomId(zoomMeetingId);

      if (meeting) {
        await zoomService.endMeeting(meeting.id);
        logger.info(`Meeting ended: ${meeting.id}`);
      }

    } catch (error) {
      logger.error('Error handling meeting ended webhook:', error);
    }
  }

  /**
   * Handle participant joined webhook
   */
  private async handleParticipantJoined(payload: any): Promise<void> {
    try {
      logger.info('Participant joined meeting:', payload);
      // Implement participant tracking if needed
    } catch (error) {
      logger.error('Error handling participant joined webhook:', error);
    }
  }

  /**
   * Handle participant left webhook
   */
  private async handleParticipantLeft(payload: any): Promise<void> {
    try {
      logger.info('Participant left meeting:', payload);
      // Implement participant tracking if needed
    } catch (error) {
      logger.error('Error handling participant left webhook:', error);
    }
  }
}

export const zoomController = new ZoomController();