import { Router } from 'express';
import { notificationController } from '../controllers/notificationController';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
const { body, param, query } = require('express-validator');

const router = Router();

// Validation schemas
const notificationPreferencesSchema = [
  body('emailEnabled').optional().isBoolean(),
  body('pushEnabled').optional().isBoolean(),
  body('inAppEnabled').optional().isBoolean(),
  body('appointmentReminders').optional().isBoolean(),
  body('appointmentUpdates').optional().isBoolean(),
  body('paymentNotifications').optional().isBoolean(),
  body('marketingEmails').optional().isBoolean(),
];

const createNotificationSchema = [
  body('userId').isUUID().withMessage('Valid user ID is required'),
  body('type').isIn([
    'APPOINTMENT_BOOKED',
    'APPOINTMENT_ACCEPTED', 
    'APPOINTMENT_REJECTED',
    'PAYMENT_CONFIRMED',
    'APPOINTMENT_REMINDER',
    'MEETING_LINK_READY',
    'APPOINTMENT_CANCELLED',
    'APPOINTMENT_RESCHEDULED'
  ]).withMessage('Valid notification type is required'),
  body('title').isString().isLength({ min: 1, max: 200 }).withMessage('Title is required (1-200 characters)'),
  body('message').isString().isLength({ min: 1, max: 1000 }).withMessage('Message is required (1-1000 characters)'),
  body('channels').isArray().withMessage('Channels must be an array'),
  body('channels.*').isIn(['IN_APP', 'EMAIL', 'PUSH']).withMessage('Invalid notification channel'),
  body('data').optional().isObject(),
  body('scheduledAt').optional().isISO8601().withMessage('Scheduled date must be valid ISO 8601 format'),
];

const bulkNotificationSchema = [
  body('userIds').isArray({ min: 1 }).withMessage('User IDs array is required'),
  body('userIds.*').isUUID().withMessage('All user IDs must be valid UUIDs'),
  body('type').isIn([
    'APPOINTMENT_BOOKED',
    'APPOINTMENT_ACCEPTED', 
    'APPOINTMENT_REJECTED',
    'PAYMENT_CONFIRMED',
    'APPOINTMENT_REMINDER',
    'MEETING_LINK_READY',
    'APPOINTMENT_CANCELLED',
    'APPOINTMENT_RESCHEDULED'
  ]).withMessage('Valid notification type is required'),
  body('title').isString().isLength({ min: 1, max: 200 }).withMessage('Title is required (1-200 characters)'),
  body('message').isString().isLength({ min: 1, max: 1000 }).withMessage('Message is required (1-1000 characters)'),
  body('channels').isArray().withMessage('Channels must be an array'),
  body('channels.*').isIn(['IN_APP', 'EMAIL', 'PUSH']).withMessage('Invalid notification channel'),
  body('data').optional().isObject(),
];

const uuidParamSchema = [
  param('notificationId').isUUID().withMessage('Valid notification ID is required'),
];

const appointmentIdParamSchema = [
  param('appointmentId').isUUID().withMessage('Valid appointment ID is required'),
];

// User notification routes
router.get(
  '/',
  authenticateToken,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('unreadOnly').optional().isBoolean(),
  validateRequest,
  notificationController.getUserNotifications
);

router.get(
  '/stats',
  authenticateToken,
  notificationController.getNotificationStats
);

router.patch(
  '/:notificationId/read',
  authenticateToken,
  uuidParamSchema,
  validateRequest,
  notificationController.markAsRead
);

router.patch(
  '/read-all',
  authenticateToken,
  notificationController.markAllAsRead
);

// Notification preferences routes
router.get(
  '/preferences',
  authenticateToken,
  notificationController.getNotificationPreferences
);

router.patch(
  '/preferences',
  authenticateToken,
  notificationPreferencesSchema,
  validateRequest,
  notificationController.updateNotificationPreferences
);

// Admin routes
router.post(
  '/create',
  authenticateToken,
  createNotificationSchema,
  validateRequest,
  notificationController.createNotification
);

router.post(
  '/bulk',
  authenticateToken,
  bulkNotificationSchema,
  validateRequest,
  notificationController.sendBulkNotification
);

router.get(
  '/appointments/:appointmentId/reminders',
  authenticateToken,
  appointmentIdParamSchema,
  validateRequest,
  notificationController.getAppointmentReminders
);

// System/cron job routes
router.post(
  '/process-scheduled',
  notificationController.processScheduledNotifications
);

router.post(
  '/process-reminders',
  notificationController.processDueReminders
);

router.delete(
  '/cleanup-jobs',
  authenticateToken,
  query('daysOld').optional().isInt({ min: 1 }).withMessage('Days old must be a positive integer'),
  validateRequest,
  notificationController.cleanupOldJobs
);

export default router;