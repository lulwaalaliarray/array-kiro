import { PrismaClient } from '@prisma/client';
import { notificationService } from './notificationService';
import { 
  CreateReminderJobRequest,
  ScheduledJobData,
  NotificationType,
  NotificationChannel
} from '../types/notification';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

class ReminderService {
  // Create reminder jobs for an appointment
  async createAppointmentReminders(appointmentId: string) {
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
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

      if (!appointment) {
        throw new Error('Appointment not found');
      }

      const appointmentDateTime = new Date(appointment.scheduledDateTime);
      const now = new Date();

      // Calculate reminder times
      const oneHourBefore = new Date(appointmentDateTime.getTime() - 60 * 60 * 1000);
      const tenMinutesBefore = new Date(appointmentDateTime.getTime() - 10 * 60 * 1000);

      const reminderJobs: any[] = [];

      // Create 1-hour reminder if it's in the future
      if (oneHourBefore > now) {
        const oneHourJob = await this.createReminderJob({
          appointmentId,
          scheduledAt: oneHourBefore,
          reminderType: 'one_hour',
          data: {
            appointmentId,
            userId: appointment.patient.user.id,
            reminderType: 'one_hour',
            notificationData: {
              patientName: appointment.patient.name,
              doctorName: appointment.doctor.name,
              appointmentDateTime,
              appointmentType: appointment.type,
              clinicName: appointment.doctor.clinicName,
              clinicAddress: appointment.doctor.clinicAddress,
              ...(appointment.zoomMeeting?.joinUrl && { meetingLink: appointment.zoomMeeting.joinUrl }),
            },
          },
        });
        reminderJobs.push(oneHourJob);
      }

      // Create 10-minute reminder if it's in the future
      if (tenMinutesBefore > now) {
        const tenMinuteJob = await this.createReminderJob({
          appointmentId,
          scheduledAt: tenMinutesBefore,
          reminderType: 'ten_minutes',
          data: {
            appointmentId,
            userId: appointment.patient.user.id,
            reminderType: 'ten_minutes',
            notificationData: {
              patientName: appointment.patient.name,
              doctorName: appointment.doctor.name,
              appointmentDateTime,
              appointmentType: appointment.type,
              clinicName: appointment.doctor.clinicName,
              clinicAddress: appointment.doctor.clinicAddress,
              ...(appointment.zoomMeeting?.joinUrl && { meetingLink: appointment.zoomMeeting.joinUrl }),
            },
          },
        });
        reminderJobs.push(tenMinuteJob);
      }

      logger.info(`Created ${reminderJobs.length} reminder jobs for appointment ${appointmentId}`);
      return reminderJobs;
    } catch (error) {
      logger.error('Error creating appointment reminders:', error);
      throw new Error('Failed to create appointment reminders');
    }
  }

  // Create a scheduled reminder job
  private async createReminderJob(request: CreateReminderJobRequest) {
    try {
      const job = await prisma.scheduledJob.create({
        data: {
          type: 'appointment_reminder',
          entityId: request.appointmentId,
          scheduledAt: request.scheduledAt,
          data: request.data as any,
        },
      });

      return job;
    } catch (error) {
      logger.error('Error creating reminder job:', error);
      throw new Error('Failed to create reminder job');
    }
  }

  // Cancel reminder jobs for an appointment
  async cancelAppointmentReminders(appointmentId: string) {
    try {
      await prisma.scheduledJob.updateMany({
        where: {
          type: 'appointment_reminder',
          entityId: appointmentId,
          status: 'pending',
        },
        data: {
          status: 'cancelled',
        },
      });

      logger.info(`Cancelled reminder jobs for appointment ${appointmentId}`);
    } catch (error) {
      logger.error('Error cancelling appointment reminders:', error);
      throw new Error('Failed to cancel appointment reminders');
    }
  }

  // Process due reminder jobs
  async processDueReminders() {
    try {
      const now = new Date();
      const dueJobs = await prisma.scheduledJob.findMany({
        where: {
          type: 'appointment_reminder',
          status: 'pending',
          scheduledAt: {
            lte: now,
          },
        },
      });

      let processedCount = 0;

      for (const job of dueJobs) {
        try {
          await this.executeReminderJob(job);
          
          // Mark job as completed
          await prisma.scheduledJob.update({
            where: { id: job.id },
            data: { status: 'completed' },
          });

          processedCount++;
        } catch (error) {
          logger.error(`Error executing reminder job ${job.id}:`, error);
          
          // Mark job as failed
          await prisma.scheduledJob.update({
            where: { id: job.id },
            data: { status: 'failed' },
          });
        }
      }

      logger.info(`Processed ${processedCount} reminder jobs`);
      return processedCount;
    } catch (error) {
      logger.error('Error processing due reminders:', error);
      throw new Error('Failed to process due reminders');
    }
  }

  // Execute a specific reminder job
  private async executeReminderJob(job: any) {
    const jobData = job.data as ScheduledJobData;
    
    // Verify appointment still exists and is confirmed
    const appointment = await prisma.appointment.findUnique({
      where: { id: jobData.appointmentId },
    });

    if (!appointment || appointment.status === 'CANCELLED') {
      logger.info(`Skipping reminder for cancelled appointment ${jobData.appointmentId}`);
      return;
    }

    // Determine reminder message based on timing
    const isOneHour = jobData.reminderType === 'one_hour';
    const timeText = isOneHour ? '1 hour' : '10 minutes';
    
    const title = `Appointment Reminder - ${timeText}`;
    const message = `Your appointment with Dr. ${jobData.notificationData.doctorName} is in ${timeText}.`;

    // Create and send notification
    await notificationService.createNotification({
      userId: jobData.userId,
      type: NotificationType.APPOINTMENT_REMINDER,
      title,
      message,
      data: jobData.notificationData,
      channels: [
        NotificationChannel.EMAIL,
        NotificationChannel.IN_APP,
        NotificationChannel.PUSH,
      ],
    });

    logger.info(`Sent ${timeText} reminder for appointment ${jobData.appointmentId}`);
  }

  // Update reminders when appointment is rescheduled
  async updateAppointmentReminders(appointmentId: string) {
    try {
      // Cancel existing reminders
      await this.cancelAppointmentReminders(appointmentId);
      
      // Create new reminders with updated time
      await this.createAppointmentReminders(appointmentId);
      
      logger.info(`Updated reminders for rescheduled appointment ${appointmentId}`);
    } catch (error) {
      logger.error('Error updating appointment reminders:', error);
      throw new Error('Failed to update appointment reminders');
    }
  }

  // Get pending reminder jobs for an appointment
  async getAppointmentReminders(appointmentId: string) {
    try {
      const jobs = await prisma.scheduledJob.findMany({
        where: {
          type: 'appointment_reminder',
          entityId: appointmentId,
          status: 'pending',
        },
        orderBy: { scheduledAt: 'asc' },
      });

      return jobs;
    } catch (error) {
      logger.error('Error getting appointment reminders:', error);
      throw new Error('Failed to get appointment reminders');
    }
  }

  // Clean up old completed/failed jobs
  async cleanupOldJobs(daysOld: number = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await prisma.scheduledJob.deleteMany({
        where: {
          status: {
            in: ['completed', 'failed', 'cancelled'],
          },
          updatedAt: {
            lt: cutoffDate,
          },
        },
      });

      logger.info(`Cleaned up ${result.count} old reminder jobs`);
      return result.count;
    } catch (error) {
      logger.error('Error cleaning up old jobs:', error);
      throw new Error('Failed to clean up old jobs');
    }
  }
}

export const reminderService = new ReminderService();