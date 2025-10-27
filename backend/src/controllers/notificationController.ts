import { Request, Response } from 'express';
import { notificationService } from '../services/notificationService';
import { reminderService } from '../services/reminderService';
import { 
  NotificationFilters,
  NotificationPreferencesUpdate,
  CreateNotificationRequest,
  BulkNotificationRequest
} from '../types/notification';
import { logger } from '../utils/logger';

export class NotificationController {
  // Get user notifications
  async getUserNotifications(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const filters: NotificationFilters = {
        userId,
        type: req.query.type as any,
        status: req.query.status as any,
        unreadOnly: req.query.unreadOnly === 'true',
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      };

      if (req.query.dateFrom) {
        filters.dateFrom = new Date(req.query.dateFrom as string);
      }
      if (req.query.dateTo) {
        filters.dateTo = new Date(req.query.dateTo as string);
      }

      const notifications = await notificationService.getUserNotifications(filters);
      
      res.json({
        success: true,
        data: notifications,
      });
    } catch (error) {
      logger.error('Error getting user notifications:', error);
      res.status(500).json({
        error: 'Failed to get notifications',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Get notification statistics
  async getNotificationStats(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const stats = await notificationService.getNotificationStats(userId);
      
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Error getting notification stats:', error);
      res.status(500).json({
        error: 'Failed to get notification statistics',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Mark notification as read
  async markAsRead(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { notificationId } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const notification = await notificationService.markAsRead(notificationId, userId);
      
      res.json({
        success: true,
        data: notification,
      });
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      res.status(500).json({
        error: 'Failed to mark notification as read',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Mark all notifications as read
  async markAllAsRead(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      await notificationService.markAllAsRead(userId);
      
      res.json({
        success: true,
        message: 'All notifications marked as read',
      });
    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
      res.status(500).json({
        error: 'Failed to mark all notifications as read',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Get user notification preferences
  async getNotificationPreferences(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const preferences = await notificationService.getUserPreferences(userId);
      
      res.json({
        success: true,
        data: preferences,
      });
    } catch (error) {
      logger.error('Error getting notification preferences:', error);
      res.status(500).json({
        error: 'Failed to get notification preferences',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Update user notification preferences
  async updateNotificationPreferences(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const updates: NotificationPreferencesUpdate = req.body;
      const preferences = await notificationService.updateUserPreferences(userId, updates);
      
      res.json({
        success: true,
        data: preferences,
      });
    } catch (error) {
      logger.error('Error updating notification preferences:', error);
      res.status(500).json({
        error: 'Failed to update notification preferences',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Create notification (admin only)
  async createNotification(req: Request, res: Response) {
    try {
      const userRole = req.user?.role;
      if (userRole !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const notificationData: CreateNotificationRequest = req.body;
      const notification = await notificationService.createNotification(notificationData);
      
      res.status(201).json({
        success: true,
        data: notification,
      });
    } catch (error) {
      logger.error('Error creating notification:', error);
      res.status(500).json({
        error: 'Failed to create notification',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Send bulk notification (admin only)
  async sendBulkNotification(req: Request, res: Response) {
    try {
      const userRole = req.user?.role;
      if (userRole !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const bulkRequest: BulkNotificationRequest = req.body;
      const notifications = await notificationService.sendBulkNotification(bulkRequest);
      
      res.status(201).json({
        success: true,
        data: notifications,
        message: `Sent ${notifications.length} notifications`,
      });
    } catch (error) {
      logger.error('Error sending bulk notification:', error);
      res.status(500).json({
        error: 'Failed to send bulk notification',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Process scheduled notifications (internal/cron job)
  async processScheduledNotifications(req: Request, res: Response) {
    try {
      const processedCount = await notificationService.processScheduledNotifications();
      
      res.json({
        success: true,
        message: `Processed ${processedCount} scheduled notifications`,
        data: { processedCount },
      });
    } catch (error) {
      logger.error('Error processing scheduled notifications:', error);
      res.status(500).json({
        error: 'Failed to process scheduled notifications',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Process due reminders (internal/cron job)
  async processDueReminders(req: Request, res: Response) {
    try {
      const processedCount = await reminderService.processDueReminders();
      
      res.json({
        success: true,
        message: `Processed ${processedCount} reminder jobs`,
        data: { processedCount },
      });
    } catch (error) {
      logger.error('Error processing due reminders:', error);
      res.status(500).json({
        error: 'Failed to process due reminders',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Get appointment reminders (for debugging/admin)
  async getAppointmentReminders(req: Request, res: Response) {
    try {
      const { appointmentId } = req.params;
      const userRole = req.user?.role;
      
      if (userRole !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const reminders = await reminderService.getAppointmentReminders(appointmentId);
      
      res.json({
        success: true,
        data: reminders,
      });
    } catch (error) {
      logger.error('Error getting appointment reminders:', error);
      res.status(500).json({
        error: 'Failed to get appointment reminders',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Clean up old jobs (admin only)
  async cleanupOldJobs(req: Request, res: Response) {
    try {
      const userRole = req.user?.role;
      if (userRole !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const daysOld = req.query.daysOld ? parseInt(req.query.daysOld as string) : 30;
      const cleanedCount = await reminderService.cleanupOldJobs(daysOld);
      
      res.json({
        success: true,
        message: `Cleaned up ${cleanedCount} old jobs`,
        data: { cleanedCount },
      });
    } catch (error) {
      logger.error('Error cleaning up old jobs:', error);
      res.status(500).json({
        error: 'Failed to clean up old jobs',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export const notificationController = new NotificationController();