import { Response } from 'express';
import { AppointmentService } from '../services/appointmentService';
import { db as prisma } from '../services/database';
import { logger } from '../utils/logger';
import { 
  AppointmentRequest, 
  AppointmentStatusUpdate, 
  AppointmentCancellation, 
  AppointmentReschedule,
  AppointmentFilters 
} from '../types/appointment';
import { AuthenticatedRequest } from '../middleware/auth';

export class AppointmentController {
  private appointmentService: AppointmentService;

  constructor() {
    this.appointmentService = new AppointmentService(prisma);
  }

  /**
   * Create a new appointment request
   */
  createAppointment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { doctorId, scheduledDateTime, type, notes } = req.body;
      const userId = req.user!.userId;
      const userRole = req.user!.role;

      // Only patients can create appointments
      if (userRole !== 'PATIENT') {
        res.status(403).json({
          message: 'Only patients can create appointments',
          error: {
            code: 'FORBIDDEN',
            message: 'Insufficient permissions',
            timestamp: new Date().toISOString(),
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Get patient profile ID
      const patientProfile = await prisma.patientProfile.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (!patientProfile) {
        res.status(404).json({
          message: 'Patient profile not found',
          error: {
            code: 'NOT_FOUND',
            message: 'Patient profile not found',
            timestamp: new Date().toISOString(),
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const appointmentData: AppointmentRequest = {
        doctorId,
        scheduledDateTime: new Date(scheduledDateTime),
        type,
        notes,
      };

      const appointment = await this.appointmentService.createAppointment(
        patientProfile.id,
        appointmentData
      );

      res.status(201).json({
        message: 'Appointment request created successfully',
        data: appointment,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error in createAppointment:', error);
      res.status(400).json({
        message: 'Failed to create appointment',
        error: {
          code: 'APPOINTMENT_CREATION_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      });
    }
  };

  /**
   * Update appointment status (accept/reject by doctor)
   */
  updateAppointmentStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const appointmentId = req.params?.['appointmentId'];
      if (!appointmentId) {
        res.status(400).json({
          message: 'Appointment ID is required',
          error: {
            code: 'MISSING_APPOINTMENT_ID',
            message: 'Appointment ID parameter is required',
            timestamp: new Date().toISOString(),
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }
      
      const { status, notes } = req.body || {};
      const userId = req.user!.userId;
      const userRole = req.user!.role;

      const statusUpdate: AppointmentStatusUpdate = {
        status,
        notes,
      };

      const appointment = await this.appointmentService.updateAppointmentStatus(
        appointmentId,
        userId,
        userRole,
        statusUpdate
      );

      res.status(200).json({
        message: 'Appointment status updated successfully',
        data: appointment,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error in updateAppointmentStatus:', error);
      const statusCode = error instanceof Error && error.message.includes('Unauthorized') ? 403 : 400;
      res.status(statusCode).json({
        message: 'Failed to update appointment status',
        error: {
          code: 'APPOINTMENT_UPDATE_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      });
    }
  };

  /**
   * Cancel an appointment
   */
  cancelAppointment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const appointmentId = req.params?.['appointmentId'];
      if (!appointmentId) {
        res.status(400).json({
          message: 'Appointment ID is required',
          error: {
            code: 'MISSING_APPOINTMENT_ID',
            message: 'Appointment ID parameter is required',
            timestamp: new Date().toISOString(),
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }
      
      const { reason, refundRequested } = req.body || {};
      const userId = req.user!.userId;
      const userRole = req.user!.role;

      const cancellation: AppointmentCancellation = {
        reason,
        refundRequested,
      };

      const appointment = await this.appointmentService.cancelAppointment(
        appointmentId,
        userId,
        userRole,
        cancellation
      );

      res.status(200).json({
        message: 'Appointment cancelled successfully',
        data: appointment,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error in cancelAppointment:', error);
      const statusCode = error instanceof Error && error.message.includes('Unauthorized') ? 403 : 400;
      res.status(statusCode).json({
        message: 'Failed to cancel appointment',
        error: {
          code: 'APPOINTMENT_CANCELLATION_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      });
    }
  };

  /**
   * Reschedule an appointment
   */
  rescheduleAppointment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const appointmentId = req.params?.['appointmentId'];
      if (!appointmentId) {
        res.status(400).json({
          message: 'Appointment ID is required',
          error: {
            code: 'MISSING_APPOINTMENT_ID',
            message: 'Appointment ID parameter is required',
            timestamp: new Date().toISOString(),
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }
      
      const { newDateTime, reason } = req.body || {};
      const userId = req.user!.userId;
      const userRole = req.user!.role;

      const reschedule: AppointmentReschedule = {
        newDateTime: new Date(newDateTime),
        reason,
      };

      const appointment = await this.appointmentService.rescheduleAppointment(
        appointmentId,
        userId,
        userRole,
        reschedule
      );

      res.status(200).json({
        message: 'Appointment rescheduled successfully',
        data: appointment,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error in rescheduleAppointment:', error);
      const statusCode = error instanceof Error && error.message.includes('Unauthorized') ? 403 : 400;
      res.status(statusCode).json({
        message: 'Failed to reschedule appointment',
        error: {
          code: 'APPOINTMENT_RESCHEDULE_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      });
    }
  };

  /**
   * Get appointments with filtering and pagination
   */
  getAppointments = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const userRole = req.user!.role;

      // Parse query parameters
      const filters: AppointmentFilters = {};
      const query = req.query || {};
      
      if (query['status']) filters.status = query['status'] as any;
      if (query['type']) filters.type = query['type'] as any;
      if (query['dateFrom']) filters.dateFrom = new Date(query['dateFrom'] as string);
      if (query['dateTo']) filters.dateTo = new Date(query['dateTo'] as string);
      if (query['doctorId']) filters.doctorId = query['doctorId'] as string;
      if (query['patientId']) filters.patientId = query['patientId'] as string;
      if (query['page']) filters.page = parseInt(query['page'] as string);
      if (query['limit']) filters.limit = parseInt(query['limit'] as string);
      if (query['sortBy']) filters.sortBy = query['sortBy'] as any;
      if (query['sortOrder']) filters.sortOrder = query['sortOrder'] as any;

      const result = await this.appointmentService.getAppointments(userId, userRole, filters);

      res.status(200).json({
        message: 'Appointments retrieved successfully',
        data: result.data,
        pagination: result.pagination,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error in getAppointments:', error);
      res.status(400).json({
        message: 'Failed to retrieve appointments',
        error: {
          code: 'APPOINTMENTS_RETRIEVAL_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      });
    }
  };

  /**
   * Get a single appointment by ID
   */
  getAppointmentById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const appointmentId = req.params?.['appointmentId'];
      if (!appointmentId) {
        res.status(400).json({
          message: 'Appointment ID is required',
          error: {
            code: 'MISSING_APPOINTMENT_ID',
            message: 'Appointment ID parameter is required',
            timestamp: new Date().toISOString(),
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }
      
      const userId = req.user!.userId;
      const userRole = req.user!.role;

      const appointment = await this.appointmentService.getAppointmentById(
        appointmentId,
        userId,
        userRole
      );

      res.status(200).json({
        message: 'Appointment retrieved successfully',
        data: appointment,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error in getAppointmentById:', error);
      const statusCode = error instanceof Error && 
        (error.message.includes('not found') || error.message.includes('Unauthorized')) ? 404 : 400;
      res.status(statusCode).json({
        message: 'Failed to retrieve appointment',
        error: {
          code: 'APPOINTMENT_RETRIEVAL_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      });
    }
  };

  /**
   * Get appointment statistics
   */
  getAppointmentStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const userRole = req.user!.role;

      const stats = await this.appointmentService.getAppointmentStats(userId, userRole);

      res.status(200).json({
        message: 'Appointment statistics retrieved successfully',
        data: stats,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error in getAppointmentStats:', error);
      res.status(400).json({
        message: 'Failed to retrieve appointment statistics',
        error: {
          code: 'STATS_RETRIEVAL_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      });
    }
  };
}

export const appointmentController = new AppointmentController();