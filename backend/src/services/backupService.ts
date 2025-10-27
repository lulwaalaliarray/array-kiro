import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { logger } from '@/utils/logger';
import { cacheService } from './cacheService';

const execAsync = promisify(exec);

/**
 * Backup and disaster recovery service
 */
export class BackupService {
  private static instance: BackupService;
  private backupDir: string;
  private isBackupInProgress: boolean = false;

  private constructor() {
    this.backupDir = process.env['BACKUP_DIR'] || './backups';
    this.ensureBackupDirectory();
  }

  public static getInstance(): BackupService {
    if (!BackupService.instance) {
      BackupService.instance = new BackupService();
    }
    return BackupService.instance;
  }

  /**
   * Ensure backup directory exists
   */
  private async ensureBackupDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
    } catch (error) {
      logger.error('Failed to create backup directory:', error);
    }
  }

  /**
   * Create database backup
   */
  public async createDatabaseBackup(): Promise<string> {
    if (this.isBackupInProgress) {
      throw new Error('Backup already in progress');
    }

    this.isBackupInProgress = true;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `db-backup-${timestamp}.sql`;
    const backupPath = path.join(this.backupDir, backupFileName);

    try {
      logger.info('Starting database backup...');

      const databaseUrl = process.env['DATABASE_URL'];
      if (!databaseUrl) {
        throw new Error('DATABASE_URL environment variable not set');
      }

      // Extract database connection details from URL
      const url = new URL(databaseUrl);
      const dbName = url.pathname.slice(1);
      const host = url.hostname;
      const port = url.port || '5432';
      const username = url.username;
      const password = url.password;

      // Set PGPASSWORD environment variable for pg_dump
      const env = { ...process.env, PGPASSWORD: password };

      // Create pg_dump command
      const dumpCommand = `pg_dump -h ${host} -p ${port} -U ${username} -d ${dbName} --no-password --verbose --clean --if-exists --create > "${backupPath}"`;

      await execAsync(dumpCommand, { env });

      // Verify backup file was created and has content
      const stats = await fs.stat(backupPath);
      if (stats.size === 0) {
        throw new Error('Backup file is empty');
      }

      logger.info(`Database backup completed: ${backupFileName} (${this.formatFileSize(stats.size)})`);

      // Store backup metadata in cache
      await cacheService.set(`backup:${timestamp}`, {
        fileName: backupFileName,
        filePath: backupPath,
        size: stats.size,
        createdAt: new Date().toISOString(),
        type: 'database',
      }, 86400 * 30); // Keep metadata for 30 days

      return backupPath;
    } catch (error) {
      logger.error('Database backup failed:', error);
      
      // Clean up failed backup file
      try {
        await fs.unlink(backupPath);
      } catch (cleanupError) {
        logger.error('Failed to clean up backup file:', cleanupError);
      }
      
      throw error;
    } finally {
      this.isBackupInProgress = false;
    }
  }

  /**
   * Create file system backup (uploaded files)
   */
  public async createFileSystemBackup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `files-backup-${timestamp}.tar.gz`;
    const backupPath = path.join(this.backupDir, backupFileName);

    try {
      logger.info('Starting file system backup...');

      const uploadDir = process.env['UPLOAD_DIR'] || './uploads';
      
      // Check if upload directory exists
      try {
        await fs.access(uploadDir);
      } catch (error) {
        logger.warn('Upload directory does not exist, skipping file backup');
        return '';
      }

      // Create tar.gz archive of upload directory
      const tarCommand = `tar -czf "${backupPath}" -C "${path.dirname(uploadDir)}" "${path.basename(uploadDir)}"`;
      await execAsync(tarCommand);

      // Verify backup file was created
      const stats = await fs.stat(backupPath);
      logger.info(`File system backup completed: ${backupFileName} (${this.formatFileSize(stats.size)})`);

      // Store backup metadata in cache
      await cacheService.set(`backup:files:${timestamp}`, {
        fileName: backupFileName,
        filePath: backupPath,
        size: stats.size,
        createdAt: new Date().toISOString(),
        type: 'filesystem',
      }, 86400 * 30); // Keep metadata for 30 days

      return backupPath;
    } catch (error) {
      logger.error('File system backup failed:', error);
      
      // Clean up failed backup file
      try {
        await fs.unlink(backupPath);
      } catch (cleanupError) {
        logger.error('Failed to clean up backup file:', cleanupError);
      }
      
      throw error;
    }
  }

  /**
   * Create complete system backup
   */
  public async createCompleteBackup(): Promise<{ database: string; files: string }> {
    try {
      logger.info('Starting complete system backup...');

      const [databaseBackup, filesBackup] = await Promise.all([
        this.createDatabaseBackup(),
        this.createFileSystemBackup(),
      ]);

      logger.info('Complete system backup finished successfully');

      return {
        database: databaseBackup,
        files: filesBackup,
      };
    } catch (error) {
      logger.error('Complete system backup failed:', error);
      throw error;
    }
  }

  /**
   * Restore database from backup
   */
  public async restoreDatabase(backupPath: string): Promise<void> {
    try {
      logger.info(`Starting database restore from: ${backupPath}`);

      // Verify backup file exists
      await fs.access(backupPath);

      const databaseUrl = process.env['DATABASE_URL'];
      if (!databaseUrl) {
        throw new Error('DATABASE_URL environment variable not set');
      }

      // Extract database connection details from URL
      const url = new URL(databaseUrl);
      const dbName = url.pathname.slice(1);
      const host = url.hostname;
      const port = url.port || '5432';
      const username = url.username;
      const password = url.password;

      // Set PGPASSWORD environment variable for psql
      const env = { ...process.env, PGPASSWORD: password };

      // Create psql restore command
      const restoreCommand = `psql -h ${host} -p ${port} -U ${username} -d ${dbName} --no-password < "${backupPath}"`;

      await execAsync(restoreCommand, { env });

      logger.info('Database restore completed successfully');
    } catch (error) {
      logger.error('Database restore failed:', error);
      throw error;
    }
  }

  /**
   * List available backups
   */
  public async listBackups(): Promise<any[]> {
    try {
      const files = await fs.readdir(this.backupDir);
      const backups: any[] = [];

      for (const file of files) {
        if (file.endsWith('.sql') || file.endsWith('.tar.gz')) {
          const filePath = path.join(this.backupDir, file);
          const stats = await fs.stat(filePath);
          
          backups.push({
            fileName: file,
            filePath,
            size: stats.size,
            sizeFormatted: this.formatFileSize(stats.size),
            createdAt: stats.birthtime,
            type: file.endsWith('.sql') ? 'database' : 'filesystem',
          });
        }
      }

      // Sort by creation date (newest first)
      backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      return backups;
    } catch (error) {
      logger.error('Failed to list backups:', error);
      return [];
    }
  }

  /**
   * Clean up old backups
   */
  public async cleanupOldBackups(retentionDays: number = 30): Promise<void> {
    try {
      logger.info(`Cleaning up backups older than ${retentionDays} days...`);

      const files = await fs.readdir(this.backupDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      let deletedCount = 0;
      let freedSpace = 0;

      for (const file of files) {
        if (file.endsWith('.sql') || file.endsWith('.tar.gz')) {
          const filePath = path.join(this.backupDir, file);
          const stats = await fs.stat(filePath);
          
          if (stats.birthtime < cutoffDate) {
            await fs.unlink(filePath);
            deletedCount++;
            freedSpace += stats.size;
            logger.debug(`Deleted old backup: ${file}`);
          }
        }
      }

      if (deletedCount > 0) {
        logger.info(`Cleanup completed: ${deletedCount} files deleted, ${this.formatFileSize(freedSpace)} freed`);
      } else {
        logger.info('No old backups to clean up');
      }
    } catch (error) {
      logger.error('Backup cleanup failed:', error);
    }
  }

  /**
   * Schedule automatic backups
   */
  public scheduleAutomaticBackups(): void {
    // Daily database backup at 2 AM
    setInterval(async () => {
      const now = new Date();
      if (now.getHours() === 2) { // 2 AM
        try {
          await this.createDatabaseBackup();
          logger.info('Scheduled database backup completed');
        } catch (error) {
          logger.error('Scheduled database backup failed:', error);
        }
      }
    }, 60 * 60 * 1000); // Check every hour

    // Weekly file system backup on Sundays at 3 AM
    const weeklyBackupInterval = 60 * 60 * 1000; // Check every hour
    setInterval(async () => {
      const now = new Date();
      if (now.getDay() === 0 && now.getHours() === 3) { // Sunday at 3 AM
        try {
          await this.createFileSystemBackup();
          logger.info('Scheduled file system backup completed');
        } catch (error) {
          logger.error('Scheduled file system backup failed:', error);
        }
      }
    }, weeklyBackupInterval);

    // Monthly cleanup on the 1st at 4 AM
    const monthlyCleanupInterval = 60 * 60 * 1000; // Check every hour
    setInterval(async () => {
      const now = new Date();
      if (now.getDate() === 1 && now.getHours() === 4) { // 1st of month at 4 AM
        try {
          await this.cleanupOldBackups(30);
          logger.info('Scheduled backup cleanup completed');
        } catch (error) {
          logger.error('Scheduled backup cleanup failed:', error);
        }
      }
    }, monthlyCleanupInterval);

    logger.info('Automatic backup schedules initialized');
  }

  /**
   * Get backup status and statistics
   */
  public async getBackupStatus(): Promise<any> {
    try {
      const backups = await this.listBackups();
      const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0);
      
      const databaseBackups = backups.filter(b => b.type === 'database');
      const fileBackups = backups.filter(b => b.type === 'filesystem');

      return {
        total_backups: backups.length,
        database_backups: databaseBackups.length,
        file_backups: fileBackups.length,
        total_size: totalSize,
        total_size_formatted: this.formatFileSize(totalSize),
        latest_database_backup: databaseBackups[0] || null,
        latest_file_backup: fileBackups[0] || null,
        backup_in_progress: this.isBackupInProgress,
        backup_directory: this.backupDir,
      };
    } catch (error) {
      logger.error('Failed to get backup status:', error);
      return {
        error: 'Failed to retrieve backup status',
      };
    }
  }

  /**
   * Format file size in human-readable format
   */
  private formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
}

// Export singleton instance
export const backupService = BackupService.getInstance();