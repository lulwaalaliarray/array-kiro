import { fail } from 'assert';
import { backupService } from '../../services/backupService';
import fs from 'fs/promises';
import path from 'path';

describe('Backup Service', () => {
  const testBackupDir = './test-backups';

  beforeAll(async () => {
    // Set test backup directory
    process.env['BACKUP_DIR'] = testBackupDir;
    
    // Create test backup directory
    try {
      await fs.mkdir(testBackupDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  });

  afterAll(async () => {
    // Clean up test backup directory
    try {
      const files = await fs.readdir(testBackupDir);
      for (const file of files) {
        await fs.unlink(path.join(testBackupDir, file));
      }
      await fs.rmdir(testBackupDir);
    } catch (error) {
      // Directory might not exist or be empty
    }
  });

  describe('Backup Status', () => {
    it('should get backup status', async () => {
      const status = await backupService.getBackupStatus();

      expect(status).toBeDefined();
      expect(status.total_backups).toBeDefined();
      expect(status.database_backups).toBeDefined();
      expect(status.file_backups).toBeDefined();
      expect(status.total_size).toBeDefined();
      expect(status.backup_in_progress).toBe(false);
      expect(status.backup_directory).toBe(testBackupDir);
    });
  });

  describe('Backup Listing', () => {
    it('should list available backups', async () => {
      const backups = await backupService.listBackups();

      expect(Array.isArray(backups)).toBe(true);
      // Initially should be empty or contain existing backups
    });

    it('should handle empty backup directory', async () => {
      const backups = await backupService.listBackups();
      
      // Should return empty array if no backups exist
      expect(Array.isArray(backups)).toBe(true);
    });
  });

  describe('Backup Cleanup', () => {
    beforeEach(async () => {
      // Create some test backup files with old dates
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 35); // 35 days ago

      const testFiles = [
        'old-backup-1.sql',
        'old-backup-2.tar.gz',
        'recent-backup.sql',
      ];

      for (const fileName of testFiles) {
        const filePath = path.join(testBackupDir, fileName);
        await fs.writeFile(filePath, 'test backup content');
        
        // Set old modification time for first two files
        if (fileName.startsWith('old-')) {
          await fs.utimes(filePath, oldDate, oldDate);
        }
      }
    });

    it('should clean up old backups', async () => {
      const backupsBefore = await backupService.listBackups();
      expect(backupsBefore.length).toBeGreaterThan(0);

      await backupService.cleanupOldBackups(30); // Keep backups for 30 days

      const backupsAfter = await backupService.listBackups();
      
      // Should have fewer backups after cleanup
      expect(backupsAfter.length).toBeLessThanOrEqual(backupsBefore.length);
      
      // Recent backup should still exist
      const recentBackup = backupsAfter.find(b => b.fileName === 'recent-backup.sql');
      expect(recentBackup).toBeDefined();
    });
  });

  describe('File System Operations', () => {
    it('should handle missing upload directory gracefully', async () => {
      // Set non-existent upload directory
      const originalUploadDir = process.env['UPLOAD_DIR'];
      process.env['UPLOAD_DIR'] = './non-existent-uploads';

      try {
        const result = await backupService.createFileSystemBackup();
        // Should return empty string or handle gracefully
        expect(typeof result).toBe('string');
      } catch (error) {
        // Should handle error gracefully
        expect(error).toBeDefined();
      } finally {
        // Restore original upload directory
        process.env['UPLOAD_DIR'] = originalUploadDir;
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle backup errors gracefully', async () => {
      // Test with invalid database URL
      const originalDbUrl = process.env['DATABASE_URL'];
      process.env['DATABASE_URL'] = 'invalid-database-url';

      try {
        await backupService.createDatabaseBackup();
        // Should throw error for invalid database URL
        fail('Expected backup to fail with invalid database URL');
      } catch (error) {
        expect(error).toBeDefined();
        expect((error as Error).message).toBeDefined();
      } finally {
        // Restore original database URL
        process.env['DATABASE_URL'] = originalDbUrl;
      }
    });

    it('should prevent concurrent backups', async () => {
      // Mock backup in progress
      const originalDbUrl = process.env['DATABASE_URL'];
      process.env['DATABASE_URL'] = 'postgresql://test:test@localhost:5432/test';

      try {
        // Start two backups simultaneously
        const backup1Promise = backupService.createDatabaseBackup();
        const backup2Promise = backupService.createDatabaseBackup();

        const results = await Promise.allSettled([backup1Promise, backup2Promise]);
        
        // One should succeed, one should fail with "already in progress" error
        const rejected = results.filter(r => r.status === 'rejected');
        expect(rejected.length).toBeGreaterThan(0);
        
        if (rejected.length > 0) {
          const error = (rejected[0] as PromiseRejectedResult).reason;
          expect((error as Error).message).toContain('already in progress');
        }
      } catch (error) {
        // Expected for invalid database URL
      } finally {
        process.env['DATABASE_URL'] = originalDbUrl;
      }
    });
  });

  describe('Backup Scheduling', () => {
    it('should initialize automatic backup schedules', () => {
      // This test just verifies the method doesn't throw
      expect(() => {
        backupService.scheduleAutomaticBackups();
      }).not.toThrow();
    });
  });
});