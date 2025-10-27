import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { FileUploadRequest, FileUploadResponse } from '../types/user';
import { logger } from '../utils/logger';

export class FileUploadService {
  private uploadDir: string;
  private maxFileSize: number;
  private allowedMimeTypes: string[];

  constructor() {
    this.uploadDir = process.env['UPLOAD_DIR'] || 'uploads';
    this.maxFileSize = parseInt(process.env['MAX_FILE_SIZE'] || '5242880'); // 5MB default
    this.allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'application/pdf'
    ];
    
    this.ensureUploadDirectory();
  }

  // Ensure upload directory exists
  private async ensureUploadDirectory(): Promise<void> {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
      logger.info(`Created upload directory: ${this.uploadDir}`);
    }
  }

  // Configure multer for file uploads
  getMulterConfig() {
    const storage = multer.diskStorage({
      destination: (_req, _file, cb) => {
        cb(null, this.uploadDir);
      },
      filename: (_req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
      }
    });

    const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
      if (this.allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`File type ${file.mimetype} not allowed`));
      }
    };

    return multer({
      storage,
      fileFilter,
      limits: {
        fileSize: this.maxFileSize
      }
    });
  }

  // Upload profile image
  async uploadProfileImage(request: FileUploadRequest): Promise<FileUploadResponse> {
    try {
      const { file, userId } = request;

      // Validate file
      if (!file) {
        throw new Error('No file provided');
      }

      if (!this.allowedMimeTypes.includes(file.mimetype)) {
        throw new Error(`File type ${file.mimetype} not allowed`);
      }

      if (file.size > this.maxFileSize) {
        throw new Error(`File size exceeds limit of ${this.maxFileSize} bytes`);
      }

      // Generate unique filename
      const fileExtension = path.extname(file.originalname);
      const fileName = `profile_${userId}_${uuidv4()}${fileExtension}`;
      const filePath = path.join(this.uploadDir, fileName);

      // Move file to final location
      await fs.rename(file.path, filePath);

      // Generate file URL (this would be your CDN or static file server URL)
      const fileUrl = `${process.env['BASE_URL'] || 'http://localhost:3000'}/uploads/${fileName}`;

      logger.info(`Profile image uploaded for user ${userId}: ${fileName}`);

      return {
        fileName,
        fileUrl,
        fileSize: file.size,
        mimeType: file.mimetype
      };
    } catch (error) {
      logger.error('Error uploading profile image:', error);
      throw error;
    }
  }

  // Upload medical document
  async uploadMedicalDocument(request: FileUploadRequest): Promise<FileUploadResponse> {
    try {
      const { file, userId } = request;

      // Validate file
      if (!file) {
        throw new Error('No file provided');
      }

      if (!this.allowedMimeTypes.includes(file.mimetype)) {
        throw new Error(`File type ${file.mimetype} not allowed`);
      }

      if (file.size > this.maxFileSize) {
        throw new Error(`File size exceeds limit of ${this.maxFileSize} bytes`);
      }

      // Generate unique filename
      const fileExtension = path.extname(file.originalname);
      const fileName = `medical_${userId}_${uuidv4()}${fileExtension}`;
      const filePath = path.join(this.uploadDir, fileName);

      // Move file to final location
      await fs.rename(file.path, filePath);

      // Generate file URL
      const fileUrl = `${process.env['BASE_URL'] || 'http://localhost:3000'}/uploads/${fileName}`;

      logger.info(`Medical document uploaded for user ${userId}: ${fileName}`);

      return {
        fileName,
        fileUrl,
        fileSize: file.size,
        mimeType: file.mimetype
      };
    } catch (error) {
      logger.error('Error uploading medical document:', error);
      throw error;
    }
  }

  // Delete file
  async deleteFile(fileName: string): Promise<void> {
    try {
      const filePath = path.join(this.uploadDir, fileName);
      await fs.unlink(filePath);
      logger.info(`File deleted: ${fileName}`);
    } catch (error) {
      logger.error('Error deleting file:', error);
      throw new Error('Failed to delete file');
    }
  }

  // Get file info
  async getFileInfo(fileName: string): Promise<{ exists: boolean; size?: number; mimeType?: string }> {
    try {
      const filePath = path.join(this.uploadDir, fileName);
      const stats = await fs.stat(filePath);
      
      return {
        exists: true,
        size: stats.size,
        mimeType: this.getMimeTypeFromExtension(path.extname(fileName))
      };
    } catch {
      return { exists: false };
    }
  }

  // Helper method to get MIME type from file extension
  private getMimeTypeFromExtension(extension: string): string {
    const mimeTypes: { [key: string]: string } = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.pdf': 'application/pdf'
    };

    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
  }

  // Validate file type for profile images
  isValidImageFile(file: Express.Multer.File): boolean {
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    return imageTypes.includes(file.mimetype);
  }

  // Validate file type for medical documents
  isValidMedicalDocument(file: Express.Multer.File): boolean {
    const documentTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    return documentTypes.includes(file.mimetype);
  }
}

export const fileUploadService = new FileUploadService();