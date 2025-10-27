import { 
  Notification, 
  NotificationType, 
  NotificationChannel, 
  NotificationStatus,
  NotificationPreference,
  ScheduledJob
} from '@prisma/client';

// Extended notification with user details
export interface NotificationWithUser extends Notification {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

// Notification creation request
export interface CreateNotificationRequest {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  channels: NotificationChannel[];
  scheduledAt?: Date;
}

// Notification template data
export interface NotificationTemplateData {
  patientName?: string;
  doctorName?: string;
  appointmentDateTime?: Date;
  appointmentType?: string;
  meetingLink?: string;
  paymentAmount?: number;
  clinicName?: string;
  clinicAddress?: string;
  cancellationReason?: string;
  rescheduleDateTime?: Date;
}

// Email notification data
export interface EmailNotificationData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Push notification data
export interface PushNotificationData {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

// Notification preferences update
export interface NotificationPreferencesUpdate {
  emailEnabled?: boolean;
  pushEnabled?: boolean;
  inAppEnabled?: boolean;
  appointmentReminders?: boolean;
  appointmentUpdates?: boolean;
  paymentNotifications?: boolean;
  marketingEmails?: boolean;
}

// Notification filters
export interface NotificationFilters {
  userId?: string;
  type?: NotificationType;
  status?: NotificationStatus;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}

// Notification statistics
export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
  byStatus: Record<NotificationStatus, number>;
}

// Scheduled job data
export interface ScheduledJobData {
  appointmentId: string;
  userId: string;
  reminderType: 'one_hour' | 'ten_minutes';
  notificationData: NotificationTemplateData;
}

// Reminder job creation
export interface CreateReminderJobRequest {
  appointmentId: string;
  scheduledAt: Date;
  reminderType: 'one_hour' | 'ten_minutes';
  data: ScheduledJobData;
}

// Notification delivery result
export interface NotificationDeliveryResult {
  notificationId: string;
  channel: NotificationChannel;
  success: boolean;
  error?: string;
  deliveredAt?: Date;
}

// Bulk notification request
export interface BulkNotificationRequest {
  userIds: string[];
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  channels: NotificationChannel[];
}

export {
  NotificationType,
  NotificationChannel,
  NotificationStatus,
  Notification,
  NotificationPreference,
  ScheduledJob
};