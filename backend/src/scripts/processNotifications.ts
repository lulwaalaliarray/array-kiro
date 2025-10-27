#!/usr/bin/env node

/**
 * Scheduled job processor for notifications and reminders
 * This script should be run periodically (e.g., every minute) via cron job
 */

import { notificationService } from '../services/notificationService';
import { reminderService } from '../services/reminderService';
import { logger } from '../utils/logger';

async function processNotifications() {
  try {
    logger.info('Starting notification processing job...');

    // Process scheduled notifications
    const scheduledCount = await notificationService.processScheduledNotifications();
    logger.info(`Processed ${scheduledCount} scheduled notifications`);

    // Process due reminders
    const reminderCount = await reminderService.processDueReminders();
    logger.info(`Processed ${reminderCount} reminder jobs`);

    // Clean up old jobs (run once daily)
    const now = new Date();
    const isCleanupTime = now.getHours() === 2 && now.getMinutes() === 0; // 2 AM
    
    if (isCleanupTime) {
      const cleanedCount = await reminderService.cleanupOldJobs(30);
      logger.info(`Cleaned up ${cleanedCount} old jobs`);
    }

    logger.info('Notification processing job completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Error in notification processing job:', error);
    process.exit(1);
  }
}

// Run the job
processNotifications();