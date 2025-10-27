import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import { 
  CreateNotificationRequest,
  NotificationFilters,
  NotificationPreferencesUpdate,
  NotificationTemplateData,
  EmailNotificationData,
  NotificationDeliveryResult,
  BulkNotificationRequest,
  NotificationStats,
  NotificationType,
  NotificationChannel,
  NotificationStatus
} from '../types/notification';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

class NotificationService {
  private emailTransporter: nodemailer.Transporter;

  constructor() {
    // Initialize email transporter
    this.emailTransporter = nodemailer.createTransport({
      host: process.env['SMTP_HOST'] || 'smtp.gmail.com',
      port: parseInt(process.env['SMTP_PORT'] || '587'),
      secure: false,
      auth: {
        user: process.env['SMTP_USER'],
        pass: process.env['SMTP_PASS'],
      },
    });
  }

  // Create a new notification
  async createNotification(data: CreateNotificationRequest) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          data: data.data || {},
          channels: data.channels,
          scheduledAt: data.scheduledAt || null,
          status: data.scheduledAt ? NotificationStatus.PENDING : NotificationStatus.SENT,
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

      // If not scheduled, send immediately
      if (!data.scheduledAt) {
        await this.deliverNotification(notification);
      }

      return notification;
    } catch (error) {
      logger.error('Error creating notification:', error);
      throw new Error('Failed to create notification');
    }
  }

  // Send notification through specified channels
  async deliverNotification(notification: any): Promise<NotificationDeliveryResult[]> {
    const results: NotificationDeliveryResult[] = [];

    try {
      // Get user preferences
      const preferences = await this.getUserPreferences(notification.userId);
      
      for (const channel of notification.channels) {
        let result: NotificationDeliveryResult = {
          notificationId: notification.id,
          channel,
          success: false,
        };

        try {
          switch (channel) {
            case NotificationChannel.EMAIL:
              if (preferences?.emailEnabled && this.shouldSendNotificationType(notification.type, preferences)) {
                await this.sendEmailNotification(notification);
                result.success = true;
                result.deliveredAt = new Date();
              }
              break;

            case NotificationChannel.IN_APP:
              if (preferences?.inAppEnabled) {
                // In-app notifications are stored in database (already done)
                result.success = true;
                result.deliveredAt = new Date();
              }
              break;

            case NotificationChannel.PUSH:
              if (preferences?.pushEnabled) {
                // TODO: Implement push notifications (Firebase/OneSignal)
                result.success = true;
                result.deliveredAt = new Date();
              }
              break;
          }
        } catch (error) {
          result.error = error instanceof Error ? error.message : 'Unknown error';
          logger.error(`Failed to deliver notification via ${channel}:`, error);
        }

        results.push(result);
      }

      // Update notification status
      const allSuccessful = results.every(r => r.success);
      await prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: allSuccessful ? NotificationStatus.DELIVERED : NotificationStatus.FAILED,
          sentAt: new Date(),
        },
      });

      return results;
    } catch (error) {
      logger.error('Error delivering notification:', error);
      throw new Error('Failed to deliver notification');
    }
  }

  // Send email notification
  private async sendEmailNotification(notification: any) {
    const emailData = this.generateEmailContent(notification);
    
    await this.emailTransporter.sendMail({
      from: process.env['SMTP_FROM'] || 'noreply@patientcare.com',
      to: notification.user.email,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
    });

    logger.info(`Email notification sent to ${notification.user.email}`);
  }

  // Generate email content based on notification type
  private generateEmailContent(notification: any): EmailNotificationData {
    const data = notification.data as NotificationTemplateData;
    
    switch (notification.type) {
      case NotificationType.APPOINTMENT_BOOKED:
        return {
          to: notification.user.email,
          subject: 'Appointment Booking Confirmation',
          html: this.getAppointmentBookedTemplate(data),
          text: `Your appointment with Dr. ${data.doctorName} has been booked for ${data.appointmentDateTime}.`,
        };

      case NotificationType.APPOINTMENT_ACCEPTED:
        return {
          to: notification.user.email,
          subject: 'Appointment Accepted',
          html: this.getAppointmentAcceptedTemplate(data),
          text: `Dr. ${data.doctorName} has accepted your appointment scheduled for ${data.appointmentDateTime}.`,
        };

      case NotificationType.APPOINTMENT_REJECTED:
        return {
          to: notification.user.email,
          subject: 'Appointment Request Declined',
          html: this.getAppointmentRejectedTemplate(data),
          text: `Unfortunately, Dr. ${data.doctorName} cannot accept your appointment request for ${data.appointmentDateTime}.`,
        };

      case NotificationType.PAYMENT_CONFIRMED:
        return {
          to: notification.user.email,
          subject: 'Payment Confirmation',
          html: this.getPaymentConfirmedTemplate(data),
          text: `Your payment of $${data.paymentAmount} has been confirmed for your appointment with Dr. ${data.doctorName}.`,
        };

      case NotificationType.APPOINTMENT_REMINDER:
        return {
          to: notification.user.email,
          subject: 'Appointment Reminder',
          html: this.getAppointmentReminderTemplate(data),
          text: `Reminder: You have an appointment with Dr. ${data.doctorName} at ${data.appointmentDateTime}.`,
        };

      case NotificationType.MEETING_LINK_READY:
        return {
          to: notification.user.email,
          subject: 'Online Consultation Link Ready',
          html: this.getMeetingLinkTemplate(data),
          text: `Your online consultation link is ready: ${data.meetingLink}`,
        };

      default:
        return {
          to: notification.user.email,
          subject: notification.title,
          html: `<p>${notification.message}</p>`,
          text: notification.message,
        };
    }
  }

  // Email templates
  private getAppointmentBookedTemplate(data: NotificationTemplateData): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Appointment Booking Confirmation</h2>
        <p>Dear ${data.patientName},</p>
        <p>Your appointment request has been submitted successfully.</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Appointment Details:</h3>
          <p><strong>Doctor:</strong> Dr. ${data.doctorName}</p>
          <p><strong>Date & Time:</strong> ${data.appointmentDateTime}</p>
          <p><strong>Type:</strong> ${data.appointmentType}</p>
          <p><strong>Clinic:</strong> ${data.clinicName}</p>
          <p><strong>Address:</strong> ${data.clinicAddress}</p>
        </div>
        <p>Please wait for the doctor to accept your appointment request. You will receive a confirmation email once accepted.</p>
        <p>Best regards,<br>PatientCare Team</p>
      </div>
    `;
  }

  private getAppointmentAcceptedTemplate(data: NotificationTemplateData): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Appointment Accepted!</h2>
        <p>Dear ${data.patientName},</p>
        <p>Great news! Dr. ${data.doctorName} has accepted your appointment request.</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Appointment Details:</h3>
          <p><strong>Doctor:</strong> Dr. ${data.doctorName}</p>
          <p><strong>Date & Time:</strong> ${data.appointmentDateTime}</p>
          <p><strong>Type:</strong> ${data.appointmentType}</p>
        </div>
        <p><strong>Next Step:</strong> Please complete your payment within 15 minutes before the appointment to confirm your booking.</p>
        <p>Best regards,<br>PatientCare Team</p>
      </div>
    `;
  }

  private getAppointmentRejectedTemplate(data: NotificationTemplateData): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Appointment Request Declined</h2>
        <p>Dear ${data.patientName},</p>
        <p>We regret to inform you that Dr. ${data.doctorName} cannot accept your appointment request for ${data.appointmentDateTime}.</p>
        <p>This could be due to scheduling conflicts or other unavoidable circumstances.</p>
        <p>We encourage you to:</p>
        <ul>
          <li>Try booking a different time slot</li>
          <li>Search for other available doctors in your area</li>
          <li>Contact our support team for assistance</li>
        </ul>
        <p>Best regards,<br>PatientCare Team</p>
      </div>
    `;
  }

  private getPaymentConfirmedTemplate(data: NotificationTemplateData): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Payment Confirmed</h2>
        <p>Dear ${data.patientName},</p>
        <p>Your payment has been successfully processed and your appointment is now confirmed!</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Appointment Details:</h3>
          <p><strong>Doctor:</strong> Dr. ${data.doctorName}</p>
          <p><strong>Date & Time:</strong> ${data.appointmentDateTime}</p>
          <p><strong>Type:</strong> ${data.appointmentType}</p>
          <p><strong>Amount Paid:</strong> $${data.paymentAmount}</p>
        </div>
        <p>You will receive appointment reminders closer to your scheduled time.</p>
        <p>Best regards,<br>PatientCare Team</p>
      </div>
    `;
  }

  private getAppointmentReminderTemplate(data: NotificationTemplateData): string {
    const meetingLinkSection = data.meetingLink ? `
      <div style="background-color: #dbeafe; padding: 15px; border-radius: 8px; margin: 15px 0;">
        <h4 style="color: #1d4ed8;">Online Consultation Link:</h4>
        <a href="${data.meetingLink}" style="color: #1d4ed8; text-decoration: none; font-weight: bold;">${data.meetingLink}</a>
      </div>
    ` : '';

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">Appointment Reminder</h2>
        <p>Dear ${data.patientName},</p>
        <p>This is a reminder about your upcoming appointment.</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Appointment Details:</h3>
          <p><strong>Doctor:</strong> Dr. ${data.doctorName}</p>
          <p><strong>Date & Time:</strong> ${data.appointmentDateTime}</p>
          <p><strong>Type:</strong> ${data.appointmentType}</p>
          ${data.clinicName ? `<p><strong>Clinic:</strong> ${data.clinicName}</p>` : ''}
          ${data.clinicAddress ? `<p><strong>Address:</strong> ${data.clinicAddress}</p>` : ''}
        </div>
        ${meetingLinkSection}
        <p>Please arrive on time for your appointment. If you need to reschedule or cancel, please do so at least 2 hours in advance.</p>
        <p>Best regards,<br>PatientCare Team</p>
      </div>
    `;
  }

  private getMeetingLinkTemplate(data: NotificationTemplateData): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Online Consultation Link Ready</h2>
        <p>Dear ${data.patientName},</p>
        <p>Your online consultation link is now ready for your appointment with Dr. ${data.doctorName}.</p>
        <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Meeting Details:</h3>
          <p><strong>Date & Time:</strong> ${data.appointmentDateTime}</p>
          <p><strong>Meeting Link:</strong></p>
          <a href="${data.meetingLink}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Join Meeting</a>
        </div>
        <p><strong>Important:</strong> Please test your camera and microphone before the appointment time.</p>
        <p>Best regards,<br>PatientCare Team</p>
      </div>
    `;
  }

  // Check if notification type should be sent based on user preferences
  private shouldSendNotificationType(type: NotificationType, preferences: any): boolean {
    switch (type) {
      case NotificationType.APPOINTMENT_BOOKED:
      case NotificationType.APPOINTMENT_ACCEPTED:
      case NotificationType.APPOINTMENT_REJECTED:
      case NotificationType.APPOINTMENT_CANCELLED:
      case NotificationType.APPOINTMENT_RESCHEDULED:
        return preferences.appointmentUpdates;
      
      case NotificationType.APPOINTMENT_REMINDER:
      case NotificationType.MEETING_LINK_READY:
        return preferences.appointmentReminders;
      
      case NotificationType.PAYMENT_CONFIRMED:
        return preferences.paymentNotifications;
      
      default:
        return true;
    }
  }

  // Get user notification preferences
  async getUserPreferences(userId: string) {
    try {
      let preferences = await prisma.notificationPreference.findUnique({
        where: { userId },
      });

      // Create default preferences if none exist
      if (!preferences) {
        preferences = await prisma.notificationPreference.create({
          data: { userId },
        });
      }

      return preferences;
    } catch (error) {
      logger.error('Error getting user preferences:', error);
      return null;
    }
  }

  // Update user notification preferences
  async updateUserPreferences(userId: string, updates: NotificationPreferencesUpdate) {
    try {
      const preferences = await prisma.notificationPreference.upsert({
        where: { userId },
        update: updates,
        create: {
          userId,
          ...updates,
        },
      });

      return preferences;
    } catch (error) {
      logger.error('Error updating user preferences:', error);
      throw new Error('Failed to update notification preferences');
    }
  }

  // Get notifications for a user
  async getUserNotifications(filters: NotificationFilters) {
    try {
      const where: any = {};
      
      if (filters.userId) where.userId = filters.userId;
      if (filters.type) where.type = filters.type;
      if (filters.status) where.status = filters.status;
      if (filters.unreadOnly) where.readAt = null;
      
      if (filters.dateFrom || filters.dateTo) {
        where.createdAt = {};
        if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
        if (filters.dateTo) where.createdAt.lte = filters.dateTo;
      }

      const notifications = await prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: filters.page ? (filters.page - 1) * (filters.limit || 20) : 0,
        take: filters.limit || 20,
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

      return notifications;
    } catch (error) {
      logger.error('Error getting user notifications:', error);
      throw new Error('Failed to get notifications');
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string, userId: string) {
    try {
      const notification = await prisma.notification.update({
        where: {
          id: notificationId,
          userId: userId,
        },
        data: {
          readAt: new Date(),
        },
      });

      return notification;
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      throw new Error('Failed to mark notification as read');
    }
  }

  // Mark all notifications as read for a user
  async markAllAsRead(userId: string) {
    try {
      await prisma.notification.updateMany({
        where: {
          userId: userId,
          readAt: null,
        },
        data: {
          readAt: new Date(),
        },
      });

      return true;
    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
      throw new Error('Failed to mark all notifications as read');
    }
  }

  // Get notification statistics
  async getNotificationStats(userId: string): Promise<NotificationStats> {
    try {
      const [total, unread, byType, byStatus] = await Promise.all([
        prisma.notification.count({ where: { userId } }),
        prisma.notification.count({ where: { userId, readAt: null } }),
        prisma.notification.groupBy({
          by: ['type'],
          where: { userId },
          _count: { type: true },
        }),
        prisma.notification.groupBy({
          by: ['status'],
          where: { userId },
          _count: { status: true },
        }),
      ]);

      const typeStats = byType.reduce((acc, item) => {
        acc[item.type] = item._count.type;
        return acc;
      }, {} as Record<NotificationType, number>);

      const statusStats = byStatus.reduce((acc, item) => {
        acc[item.status] = item._count.status;
        return acc;
      }, {} as Record<NotificationStatus, number>);

      return {
        total,
        unread,
        byType: typeStats,
        byStatus: statusStats,
      };
    } catch (error) {
      logger.error('Error getting notification stats:', error);
      throw new Error('Failed to get notification statistics');
    }
  }

  // Send bulk notifications
  async sendBulkNotification(request: BulkNotificationRequest) {
    try {
      const notifications = await Promise.all(
        request.userIds.map(userId =>
          this.createNotification({
            userId,
            type: request.type,
            title: request.title,
            message: request.message,
            data: request.data || {},
            channels: request.channels,
          })
        )
      );

      return notifications;
    } catch (error) {
      logger.error('Error sending bulk notification:', error);
      throw new Error('Failed to send bulk notification');
    }
  }

  // Process scheduled notifications
  async processScheduledNotifications() {
    try {
      const now = new Date();
      const scheduledNotifications = await prisma.notification.findMany({
        where: {
          status: NotificationStatus.PENDING,
          scheduledAt: {
            lte: now,
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

      for (const notification of scheduledNotifications) {
        await this.deliverNotification(notification);
      }

      logger.info(`Processed ${scheduledNotifications.length} scheduled notifications`);
      return scheduledNotifications.length;
    } catch (error) {
      logger.error('Error processing scheduled notifications:', error);
      throw new Error('Failed to process scheduled notifications');
    }
  }
}

export const notificationService = new NotificationService();