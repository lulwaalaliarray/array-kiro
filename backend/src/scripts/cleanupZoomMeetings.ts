#!/usr/bin/env ts-node

/**
 * Cleanup script for old Zoom meetings
 * This script should be run periodically (e.g., via cron job) to clean up old meeting records
 */

import { zoomService } from '../services/zoomService';
import { logger } from '../utils/logger';

async function cleanupOldMeetings() {
  try {
    logger.info('Starting Zoom meetings cleanup...');
    
    const archivedCount = await zoomService.cleanupOldMeetings();
    
    if (archivedCount > 0) {
      logger.info(`Successfully archived ${archivedCount} old meetings`);
    } else {
      logger.info('No old meetings found for cleanup');
    }
    
    // Get current stats
    const stats = await zoomService.getMeetingStats();
    logger.info('Current meeting statistics:', stats);
    
  } catch (error) {
    logger.error('Error during cleanup:', error);
    process.exit(1);
  }
}

// Run the cleanup if this script is executed directly
if (require.main === module) {
  cleanupOldMeetings()
    .then(() => {
      logger.info('Cleanup completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Cleanup failed:', error);
      process.exit(1);
    });
}

export { cleanupOldMeetings };