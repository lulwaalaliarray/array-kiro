import { PrismaClient, UserRole } from '@prisma/client';
import { 
  MedicalDocumentCreate, 
  MedicalDocumentUpdate, 
  MedicalDocumentWithDetails,
  MedicalDocumentSearchCriteria,
  MedicalDocumentFilters,
  PaginatedMedicalDocuments,
  MedicalDocumentAccessRequest,
  MedicalDocumentAccessResponse,
  MedicalHistorySummary,
  DocumentValidationResult,
  FileValidationOptions
} from '../types/medicalHistory';
import { logger } from '../utils/logger';

export class MedicalHistoryService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  // Create a new medical document record
  async createMedicalDocument(data: MedicalDocumentCreate): Promise<MedicalDocumentWithDetails> {
    try {
      // Validate patient exists
      const patient = await this.prisma.patientProfile.findUnique({
        where: { id: data.patientId }
      });

      if (!patient) {
        throw new Error('Patient not found');
      }

      const document = await this.prisma.medicalDocument.create({
        data: {
          patientId: data.patientId,
          fileName: data.fileName,
          fileUrl: data.fileUrl,
          fileType: data.fileType,
          documentType: data.documentType,
          description: data.description || null
        }
      });

      logger.info(`Medical document created: ${document.id} for patient: ${data.patientId}`);
      
      return document as MedicalDocumentWithDetails;
    } catch (error) {
      logger.error('Error creating medical document:', error);
      throw error;
    }
  }

  // Get medical document by ID with access control
  async getMedicalDocument(
    documentId: string, 
    accessRequest: MedicalDocumentAccessRequest
  ): Promise<MedicalDocumentAccessResponse> {
    try {
      const document = await this.prisma.medicalDocument.findUnique({
        where: { id: documentId },
        include: {
          patient: {
            include: {
              user: true
            }
          }
        }
      });

      if (!document) {
        return {
          hasAccess: false,
          reason: 'Document not found'
        };
      }

      // Check access permissions
      const hasAccess = await this.checkDocumentAccess(document, accessRequest);
      
      if (!hasAccess.hasAccess) {
        return hasAccess;
      }

      return {
        hasAccess: true,
        document: document as MedicalDocumentWithDetails
      };
    } catch (error) {
      logger.error('Error getting medical document:', error);
      throw error;
    }
  }

  // Get medical documents for a patient with filtering and pagination
  async getMedicalDocuments(
    criteria: MedicalDocumentSearchCriteria,
    filters: MedicalDocumentFilters = {}
  ): Promise<PaginatedMedicalDocuments> {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'uploadedAt',
        sortOrder = 'desc'
      } = filters;

      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {
        patientId: criteria.patientId
      };

      if (criteria.documentType) {
        where.documentType = criteria.documentType;
      }

      if (criteria.fileType) {
        where.fileType = criteria.fileType;
      }

      if (criteria.startDate || criteria.endDate) {
        where.uploadedAt = {};
        if (criteria.startDate) {
          where.uploadedAt.gte = criteria.startDate;
        }
        if (criteria.endDate) {
          where.uploadedAt.lte = criteria.endDate;
        }
      }

      if (criteria.searchTerm) {
        where.OR = [
          {
            fileName: {
              contains: criteria.searchTerm,
              mode: 'insensitive'
            }
          },
          {
            description: {
              contains: criteria.searchTerm,
              mode: 'insensitive'
            }
          }
        ];
      }

      // Get total count
      const total = await this.prisma.medicalDocument.count({ where });

      // Get documents
      const documents = await this.prisma.medicalDocument.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder
        }
      });

      const totalPages = Math.ceil(total / limit);

      return {
        data: documents as MedicalDocumentWithDetails[],
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      };
    } catch (error) {
      logger.error('Error getting medical documents:', error);
      throw error;
    }
  }

  // Update medical document
  async updateMedicalDocument(
    documentId: string,
    updates: MedicalDocumentUpdate,
    requesterId: string,
    requesterRole: UserRole
  ): Promise<MedicalDocumentWithDetails> {
    try {
      // Get document with patient info
      const document = await this.prisma.medicalDocument.findUnique({
        where: { id: documentId },
        include: {
          patient: {
            include: {
              user: true
            }
          }
        }
      });

      if (!document) {
        throw new Error('Document not found');
      }

      // Check if requester has permission to update
      if (requesterRole === 'PATIENT' && document.patient.userId !== requesterId) {
        throw new Error('Unauthorized: Can only update your own documents');
      }

      if (requesterRole === 'DOCTOR') {
        throw new Error('Unauthorized: Doctors cannot update patient documents');
      }

      const updatedDocument = await this.prisma.medicalDocument.update({
        where: { id: documentId },
        data: {
          ...(updates.description !== undefined && { description: updates.description }),
          ...(updates.documentType !== undefined && { documentType: updates.documentType })
        }
      });

      logger.info(`Medical document updated: ${documentId} by user: ${requesterId}`);
      
      return updatedDocument as MedicalDocumentWithDetails;
    } catch (error) {
      logger.error('Error updating medical document:', error);
      throw error;
    }
  }

  // Delete medical document
  async deleteMedicalDocument(
    documentId: string,
    requesterId: string,
    requesterRole: UserRole
  ): Promise<void> {
    try {
      // Get document with patient info
      const document = await this.prisma.medicalDocument.findUnique({
        where: { id: documentId },
        include: {
          patient: {
            include: {
              user: true
            }
          }
        }
      });

      if (!document) {
        throw new Error('Document not found');
      }

      // Check if requester has permission to delete
      if (requesterRole === 'PATIENT' && document.patient.userId !== requesterId) {
        throw new Error('Unauthorized: Can only delete your own documents');
      }

      if (requesterRole === 'DOCTOR') {
        throw new Error('Unauthorized: Doctors cannot delete patient documents');
      }

      await this.prisma.medicalDocument.delete({
        where: { id: documentId }
      });

      logger.info(`Medical document deleted: ${documentId} by user: ${requesterId}`);
    } catch (error) {
      logger.error('Error deleting medical document:', error);
      throw error;
    }
  }

  // Get medical history summary for a patient
  async getMedicalHistorySummary(patientId: string): Promise<MedicalHistorySummary> {
    try {
      // Get total count
      const totalDocuments = await this.prisma.medicalDocument.count({
        where: { patientId }
      });

      // Get count by document type manually
      const labReportCount = await this.prisma.medicalDocument.count({
        where: { patientId, documentType: 'LAB_REPORT' }
      });
      const prescriptionCount = await this.prisma.medicalDocument.count({
        where: { patientId, documentType: 'PRESCRIPTION' }
      });
      const scanCount = await this.prisma.medicalDocument.count({
        where: { patientId, documentType: 'SCAN' }
      });
      const otherCount = await this.prisma.medicalDocument.count({
        where: { patientId, documentType: 'OTHER' }
      });

      // Get recent documents (last 5)
      const recentDocuments = await this.prisma.medicalDocument.findMany({
        where: { patientId },
        orderBy: { uploadedAt: 'desc' },
        take: 5
      });

      // Get last upload date
      const lastDocument = await this.prisma.medicalDocument.findFirst({
        where: { patientId },
        orderBy: { uploadedAt: 'desc' },
        select: { uploadedAt: true }
      });

      // Format document counts by type
      const typeCount = {
        LAB_REPORT: labReportCount,
        PRESCRIPTION: prescriptionCount,
        SCAN: scanCount,
        OTHER: otherCount
      };

      return {
        patientId,
        totalDocuments,
        documentsByType: typeCount,
        recentDocuments: recentDocuments as MedicalDocumentWithDetails[],
        lastUploadDate: lastDocument?.uploadedAt
      };
    } catch (error) {
      logger.error('Error getting medical history summary:', error);
      throw error;
    }
  }

  // Check document access permissions
  private async checkDocumentAccess(
    document: any,
    accessRequest: MedicalDocumentAccessRequest
  ): Promise<MedicalDocumentAccessResponse> {
    const { requesterId, requesterRole, appointmentId } = accessRequest;

    // Admin has access to all documents
    if (requesterRole === 'ADMIN') {
      return { hasAccess: true };
    }

    // Patient can access their own documents
    if (requesterRole === 'PATIENT' && document.patient.userId === requesterId) {
      return { hasAccess: true };
    }

    // Doctor can access patient documents only during active appointments
    if (requesterRole === 'DOCTOR') {
      if (!appointmentId) {
        return {
          hasAccess: false,
          reason: 'Appointment ID required for doctor access'
        };
      }

      // Check if doctor has an active appointment with the patient
      const appointment = await this.prisma.appointment.findFirst({
        where: {
          id: appointmentId,
          doctorId: requesterId,
          patientId: document.patientId,
          status: {
            in: ['CONFIRMED', 'COMPLETED']
          }
        }
      });

      if (!appointment) {
        return {
          hasAccess: false,
          reason: 'No active appointment found with this patient'
        };
      }

      return { hasAccess: true };
    }

    return {
      hasAccess: false,
      reason: 'Unauthorized access'
    };
  }

  // Validate file for medical document upload
  validateMedicalDocumentFile(
    file: Express.Multer.File,
    options: FileValidationOptions
  ): DocumentValidationResult {
    const errors: string[] = [];

    // Check file size
    if (file.size > options.maxFileSize) {
      errors.push(`File size exceeds maximum limit of ${options.maxFileSize} bytes`);
    }

    // Check MIME type
    if (!options.allowedMimeTypes.includes(file.mimetype)) {
      errors.push(`File type ${file.mimetype} is not allowed`);
    }

    // Check file extension
    const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
    if (!fileExtension || !options.allowedExtensions.includes(fileExtension)) {
      errors.push(`File extension .${fileExtension} is not allowed`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Search medical documents across multiple patients (admin only)
  async searchMedicalDocuments(
    searchTerm: string,
    documentType?: any,
    filters: MedicalDocumentFilters = {}
  ): Promise<PaginatedMedicalDocuments> {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'uploadedAt',
        sortOrder = 'desc'
      } = filters;

      const skip = (page - 1) * limit;

      const where: any = {
        OR: [
          {
            fileName: {
              contains: searchTerm,
              mode: 'insensitive'
            }
          },
          {
            description: {
              contains: searchTerm,
              mode: 'insensitive'
            }
          },
          {
            patient: {
              name: {
                contains: searchTerm,
                mode: 'insensitive'
              }
            }
          }
        ]
      };

      if (documentType) {
        where.documentType = documentType;
      }

      const total = await this.prisma.medicalDocument.count({ where });

      const documents = await this.prisma.medicalDocument.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder
        },
        include: {
          patient: {
            select: {
              name: true,
              user: {
                select: {
                  email: true
                }
              }
            }
          }
        }
      });

      const totalPages = Math.ceil(total / limit);

      return {
        data: documents as MedicalDocumentWithDetails[],
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      };
    } catch (error) {
      logger.error('Error searching medical documents:', error);
      throw error;
    }
  }
}

export const medicalHistoryService = new MedicalHistoryService();