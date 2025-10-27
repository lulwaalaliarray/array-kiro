import { Response } from 'express';
import { medicalHistoryService } from '../services/medicalHistoryService';
import { fileUploadService } from '../services/fileUploadService';
import { 
  MedicalDocumentSearchCriteria,
  MedicalDocumentFilters,
  MedicalDocumentAccessRequest,
  DocumentType
} from '../types/medicalHistory';
import { AuthenticatedRequest } from '../types/auth';
import { logger } from '../utils/logger';

export class MedicalHistoryController {
  // Upload medical document
  async uploadMedicalDocument(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { documentType, description } = req.body;
      const file = req.file;
      const userId = req.user?.userId;

      if (!file) {
        res.status(400).json({
          error: {
            code: 'MISSING_FILE',
            message: 'No file provided'
          }
        });
        return;
      }

      if (!userId) {
        res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated'
          }
        });
        return;
      }

      if (!documentType || !Object.values(['LAB_REPORT', 'PRESCRIPTION', 'SCAN', 'OTHER']).includes(documentType)) {
        res.status(400).json({
          error: {
            code: 'INVALID_DOCUMENT_TYPE',
            message: 'Valid document type is required'
          }
        });
        return;
      }

      // Get patient profile
      const user = await medicalHistoryService['prisma'].user.findUnique({
        where: { id: userId },
        include: { patientProfile: true }
      });

      if (!user?.patientProfile) {
        res.status(403).json({
          error: {
            code: 'PATIENT_PROFILE_REQUIRED',
            message: 'Only patients can upload medical documents'
          }
        });
        return;
      }

      // Validate file
      const validationOptions = {
        maxFileSize: 10 * 1024 * 1024, // 10MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
        allowedExtensions: ['jpg', 'jpeg', 'png', 'gif', 'pdf']
      };

      const validation = medicalHistoryService.validateMedicalDocumentFile(file, validationOptions);
      if (!validation.isValid) {
        res.status(400).json({
          error: {
            code: 'INVALID_FILE',
            message: 'File validation failed',
            details: validation.errors
          }
        });
        return;
      }

      // Upload file
      const uploadResult = await fileUploadService.uploadMedicalDocument({
        file,
        userId
      });

      // Create medical document record
      const document = await medicalHistoryService.createMedicalDocument({
        patientId: user.patientProfile.id,
        fileName: uploadResult.fileName,
        fileUrl: uploadResult.fileUrl,
        fileType: uploadResult.mimeType,
        documentType: documentType as DocumentType,
        description
      });

      res.status(201).json({
        id: document.id,
        fileName: document.fileName,
        fileUrl: document.fileUrl,
        fileSize: uploadResult.fileSize,
        mimeType: uploadResult.mimeType,
        documentType: document.documentType,
        description: document.description,
        uploadedAt: document.uploadedAt
      });

      logger.info(`Medical document uploaded: ${document.id} by user: ${userId}`);
    } catch (error) {
      logger.error('Error uploading medical document:', error);
      res.status(500).json({
        error: {
          code: 'UPLOAD_FAILED',
          message: 'Failed to upload medical document'
        }
      });
    }
  }

  // Get medical document by ID
  async getMedicalDocument(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { documentId } = req.params;
      const { appointmentId } = req.query;
      const userId = req.user?.userId;
      const userRole = req.user?.role;

      if (!documentId) {
        res.status(400).json({
          error: {
            code: 'MISSING_DOCUMENT_ID',
            message: 'Document ID is required'
          }
        });
        return;
      }

      if (!userId || !userRole) {
        res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated'
          }
        });
        return;
      }

      const accessRequest: MedicalDocumentAccessRequest = {
        documentId,
        requesterId: userId,
        requesterRole: userRole,
        appointmentId: appointmentId as string
      };

      const result = await medicalHistoryService.getMedicalDocument(documentId, accessRequest);

      if (!result.hasAccess) {
        res.status(403).json({
          error: {
            code: 'ACCESS_DENIED',
            message: result.reason || 'Access denied'
          }
        });
        return;
      }

      res.json(result.document);
    } catch (error) {
      logger.error('Error getting medical document:', error);
      res.status(500).json({
        error: {
          code: 'FETCH_FAILED',
          message: 'Failed to fetch medical document'
        }
      });
    }
  }

  // Get medical documents for a patient
  async getMedicalDocuments(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { patientId } = req.params;
      const {
        documentType,
        fileType,
        startDate,
        endDate,
        searchTerm,
        page = '1',
        limit = '10',
        sortBy = 'uploadedAt',
        sortOrder = 'desc'
      } = req.query;

      const userId = req.user?.userId;
      const userRole = req.user?.role;

      if (!patientId) {
        res.status(400).json({
          error: {
            code: 'MISSING_PATIENT_ID',
            message: 'Patient ID is required'
          }
        });
        return;
      }

      if (!userId || !userRole) {
        res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated'
          }
        });
        return;
      }

      // Check if user has access to this patient's documents
      if (userRole === 'PATIENT') {
        const user = await medicalHistoryService['prisma'].user.findUnique({
          where: { id: userId },
          include: { patientProfile: true }
        });

        if (!user?.patientProfile || user.patientProfile.id !== patientId) {
          res.status(403).json({
            error: {
              code: 'ACCESS_DENIED',
              message: 'Can only access your own medical documents'
            }
          });
          return;
        }
      }

      const criteria: MedicalDocumentSearchCriteria = {
        patientId,
        ...(documentType && { documentType: documentType as DocumentType }),
        ...(fileType && { fileType: fileType as string }),
        ...(startDate && { startDate: new Date(startDate as string) }),
        ...(endDate && { endDate: new Date(endDate as string) }),
        ...(searchTerm && { searchTerm: searchTerm as string })
      };

      const filters: MedicalDocumentFilters = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        sortBy: sortBy as 'uploadedAt' | 'fileName' | 'documentType',
        sortOrder: sortOrder as 'asc' | 'desc'
      };

      const result = await medicalHistoryService.getMedicalDocuments(criteria, filters);
      res.json(result);
    } catch (error) {
      logger.error('Error getting medical documents:', error);
      res.status(500).json({
        error: {
          code: 'FETCH_FAILED',
          message: 'Failed to fetch medical documents'
        }
      });
    }
  }

  // Update medical document
  async updateMedicalDocument(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { documentId } = req.params;
      const { description, documentType } = req.body;
      const userId = req.user?.userId;
      const userRole = req.user?.role;

      if (!documentId) {
        res.status(400).json({
          error: {
            code: 'MISSING_DOCUMENT_ID',
            message: 'Document ID is required'
          }
        });
        return;
      }

      if (!userId || !userRole) {
        res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated'
          }
        });
        return;
      }

      const updates = {
        description,
        documentType: documentType as DocumentType
      };

      const document = await medicalHistoryService.updateMedicalDocument(
        documentId,
        updates,
        userId,
        userRole
      );

      res.json(document);
    } catch (error) {
      logger.error('Error updating medical document:', error);
      
      if (error instanceof Error && error.message.includes('Unauthorized')) {
        res.status(403).json({
          error: {
            code: 'ACCESS_DENIED',
            message: error.message
          }
        });
        return;
      }

      res.status(500).json({
        error: {
          code: 'UPDATE_FAILED',
          message: 'Failed to update medical document'
        }
      });
    }
  }

  // Delete medical document
  async deleteMedicalDocument(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { documentId } = req.params;
      const userId = req.user?.userId;
      const userRole = req.user?.role;

      if (!documentId) {
        res.status(400).json({
          error: {
            code: 'MISSING_DOCUMENT_ID',
            message: 'Document ID is required'
          }
        });
        return;
      }

      if (!userId || !userRole) {
        res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated'
          }
        });
        return;
      }

      await medicalHistoryService.deleteMedicalDocument(documentId, userId, userRole);

      res.status(204).send();
    } catch (error) {
      logger.error('Error deleting medical document:', error);
      
      if (error instanceof Error && error.message.includes('Unauthorized')) {
        res.status(403).json({
          error: {
            code: 'ACCESS_DENIED',
            message: error.message
          }
        });
        return;
      }

      res.status(500).json({
        error: {
          code: 'DELETE_FAILED',
          message: 'Failed to delete medical document'
        }
      });
    }
  }

  // Get medical history summary
  async getMedicalHistorySummary(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { patientId } = req.params;
      const userId = req.user?.userId;
      const userRole = req.user?.role;

      if (!patientId) {
        res.status(400).json({
          error: {
            code: 'MISSING_PATIENT_ID',
            message: 'Patient ID is required'
          }
        });
        return;
      }

      if (!userId || !userRole) {
        res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated'
          }
        });
        return;
      }

      // Check access permissions
      if (userRole === 'PATIENT') {
        const user = await medicalHistoryService['prisma'].user.findUnique({
          where: { id: userId },
          include: { patientProfile: true }
        });

        if (!user?.patientProfile || user.patientProfile.id !== patientId) {
          res.status(403).json({
            error: {
              code: 'ACCESS_DENIED',
              message: 'Can only access your own medical history'
            }
          });
          return;
        }
      }

      const summary = await medicalHistoryService.getMedicalHistorySummary(patientId);
      res.json(summary);
    } catch (error) {
      logger.error('Error getting medical history summary:', error);
      res.status(500).json({
        error: {
          code: 'FETCH_FAILED',
          message: 'Failed to fetch medical history summary'
        }
      });
    }
  }

  // Search medical documents (admin only)
  async searchMedicalDocuments(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const {
        searchTerm,
        documentType,
        page = '1',
        limit = '10',
        sortBy = 'uploadedAt',
        sortOrder = 'desc'
      } = req.query;

      const userRole = req.user?.role;

      if (userRole !== 'ADMIN') {
        res.status(403).json({
          error: {
            code: 'ACCESS_DENIED',
            message: 'Admin access required'
          }
        });
        return;
      }

      if (!searchTerm) {
        res.status(400).json({
          error: {
            code: 'MISSING_SEARCH_TERM',
            message: 'Search term is required'
          }
        });
        return;
      }

      const filters: MedicalDocumentFilters = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        sortBy: sortBy as 'uploadedAt' | 'fileName' | 'documentType',
        sortOrder: sortOrder as 'asc' | 'desc'
      };

      const result = await medicalHistoryService.searchMedicalDocuments(
        searchTerm as string,
        documentType as DocumentType,
        filters
      );

      res.json(result);
    } catch (error) {
      logger.error('Error searching medical documents:', error);
      res.status(500).json({
        error: {
          code: 'SEARCH_FAILED',
          message: 'Failed to search medical documents'
        }
      });
    }
  }
}

export const medicalHistoryController = new MedicalHistoryController();