import { MedicalHistoryService } from '../../services/medicalHistoryService';
import { UserRole, DocumentType } from '@prisma/client';
import {
  MedicalDocumentCreate,
  MedicalDocumentUpdate,
  MedicalDocumentSearchCriteria,
  MedicalDocumentFilters,
  MedicalDocumentAccessRequest,
  FileValidationOptions
} from '../../types/medicalHistory';

// Mock the PrismaClient
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    medicalDocument: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findFirst: jest.fn(),
    },
    patientProfile: {
      findUnique: jest.fn(),
    },
    appointment: {
      findFirst: jest.fn(),
    },
  })),
  UserRole: {
    PATIENT: 'PATIENT',
    DOCTOR: 'DOCTOR',
    ADMIN: 'ADMIN'
  },
  DocumentType: {
    LAB_REPORT: 'LAB_REPORT',
    PRESCRIPTION: 'PRESCRIPTION',
    SCAN: 'SCAN',
    OTHER: 'OTHER'
  }
}));

// Mock the logger
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('MedicalHistoryService', () => {
  let medicalHistoryService: MedicalHistoryService;
  let mockPrisma: any;

  beforeEach(() => {
    medicalHistoryService = new MedicalHistoryService();
    mockPrisma = medicalHistoryService['prisma'];
    jest.clearAllMocks();
  });

  describe('File Upload and Storage Operations', () => {
    describe('createMedicalDocument', () => {
      it('should create medical document successfully', async () => {
        const mockPatient = {
          id: 'patient-1',
          userId: 'user-1',
          name: 'John Doe'
        };

        const mockDocument = {
          id: 'doc-1',
          patientId: 'patient-1',
          fileName: 'test-report.pdf',
          fileUrl: 'https://storage.com/test-report.pdf',
          fileType: 'application/pdf',
          documentType: DocumentType.LAB_REPORT,
          description: 'Blood test results',
          uploadedAt: new Date()
        };

        const createData: MedicalDocumentCreate = {
          patientId: 'patient-1',
          fileName: 'test-report.pdf',
          fileUrl: 'https://storage.com/test-report.pdf',
          fileType: 'application/pdf',
          documentType: DocumentType.LAB_REPORT,
          description: 'Blood test results'
        };

        mockPrisma.patientProfile.findUnique.mockResolvedValue(mockPatient);
        mockPrisma.medicalDocument.create.mockResolvedValue(mockDocument);

        const result = await medicalHistoryService.createMedicalDocument(createData);

        expect(result).toEqual(mockDocument);
        expect(mockPrisma.patientProfile.findUnique).toHaveBeenCalledWith({
          where: { id: 'patient-1' }
        });
        expect(mockPrisma.medicalDocument.create).toHaveBeenCalledWith({
          data: {
            patientId: 'patient-1',
            fileName: 'test-report.pdf',
            fileUrl: 'https://storage.com/test-report.pdf',
            fileType: 'application/pdf',
            documentType: DocumentType.LAB_REPORT,
            description: 'Blood test results'
          }
        });
      });

      it('should throw error when patient not found', async () => {
        const createData: MedicalDocumentCreate = {
          patientId: 'non-existent',
          fileName: 'test.pdf',
          fileUrl: 'https://storage.com/test.pdf',
          fileType: 'application/pdf',
          documentType: DocumentType.OTHER
        };

        mockPrisma.patientProfile.findUnique.mockResolvedValue(null);

        await expect(medicalHistoryService.createMedicalDocument(createData))
          .rejects.toThrow('Patient not found');
      });

      it('should handle database errors during creation', async () => {
        const createData: MedicalDocumentCreate = {
          patientId: 'patient-1',
          fileName: 'test.pdf',
          fileUrl: 'https://storage.com/test.pdf',
          fileType: 'application/pdf',
          documentType: DocumentType.OTHER
        };

        mockPrisma.patientProfile.findUnique.mockResolvedValue({ id: 'patient-1' });
        mockPrisma.medicalDocument.create.mockRejectedValue(new Error('Database error'));

        await expect(medicalHistoryService.createMedicalDocument(createData))
          .rejects.toThrow('Database error');
      });
    });

    describe('validateMedicalDocumentFile', () => {
      it('should validate file successfully when all criteria met', () => {
        const mockFile = {
          originalname: 'test-report.pdf',
          mimetype: 'application/pdf',
          size: 1024 * 1024 // 1MB
        } as Express.Multer.File;

        const options: FileValidationOptions = {
          maxFileSize: 10 * 1024 * 1024, // 10MB
          allowedMimeTypes: ['application/pdf', 'image/jpeg'],
          allowedExtensions: ['pdf', 'jpg', 'jpeg']
        };

        const result = medicalHistoryService.validateMedicalDocumentFile(mockFile, options);

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should reject file when size exceeds limit', () => {
        const mockFile = {
          originalname: 'large-file.pdf',
          mimetype: 'application/pdf',
          size: 15 * 1024 * 1024 // 15MB
        } as Express.Multer.File;

        const options: FileValidationOptions = {
          maxFileSize: 10 * 1024 * 1024, // 10MB
          allowedMimeTypes: ['application/pdf'],
          allowedExtensions: ['pdf']
        };

        const result = medicalHistoryService.validateMedicalDocumentFile(mockFile, options);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('File size exceeds maximum limit of 10485760 bytes');
      });

      it('should reject file with invalid MIME type', () => {
        const mockFile = {
          originalname: 'test.txt',
          mimetype: 'text/plain',
          size: 1024
        } as Express.Multer.File;

        const options: FileValidationOptions = {
          maxFileSize: 10 * 1024 * 1024,
          allowedMimeTypes: ['application/pdf', 'image/jpeg'],
          allowedExtensions: ['pdf', 'jpg']
        };

        const result = medicalHistoryService.validateMedicalDocumentFile(mockFile, options);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('File type text/plain is not allowed');
      });

      it('should reject file with invalid extension', () => {
        const mockFile = {
          originalname: 'test.exe',
          mimetype: 'application/pdf',
          size: 1024
        } as Express.Multer.File;

        const options: FileValidationOptions = {
          maxFileSize: 10 * 1024 * 1024,
          allowedMimeTypes: ['application/pdf'],
          allowedExtensions: ['pdf', 'jpg']
        };

        const result = medicalHistoryService.validateMedicalDocumentFile(mockFile, options);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('File extension .exe is not allowed');
      });

      it('should handle multiple validation errors', () => {
        const mockFile = {
          originalname: 'test.exe',
          mimetype: 'text/plain',
          size: 15 * 1024 * 1024
        } as Express.Multer.File;

        const options: FileValidationOptions = {
          maxFileSize: 10 * 1024 * 1024,
          allowedMimeTypes: ['application/pdf'],
          allowedExtensions: ['pdf']
        };

        const result = medicalHistoryService.validateMedicalDocumentFile(mockFile, options);

        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(3);
        expect(result.errors).toContain('File size exceeds maximum limit of 10485760 bytes');
        expect(result.errors).toContain('File type text/plain is not allowed');
        expect(result.errors).toContain('File extension .exe is not allowed');
      });
    });
  });

  describe('Access Control for Medical Documents', () => {
    describe('getMedicalDocument with access control', () => {
      const mockDocument = {
        id: 'doc-1',
        patientId: 'patient-1',
        fileName: 'test.pdf',
        fileUrl: 'https://storage.com/test.pdf',
        fileType: 'application/pdf',
        documentType: DocumentType.LAB_REPORT,
        uploadedAt: new Date(),
        patient: {
          id: 'patient-1',
          userId: 'user-1',
          name: 'John Doe',
          user: {
            id: 'user-1',
            email: 'patient@example.com',
            role: UserRole.PATIENT
          }
        }
      };

      it('should allow admin access to any document', async () => {
        const accessRequest: MedicalDocumentAccessRequest = {
          documentId: 'doc-1',
          requesterId: 'admin-1',
          requesterRole: UserRole.ADMIN
        };

        mockPrisma.medicalDocument.findUnique.mockResolvedValue(mockDocument);

        const result = await medicalHistoryService.getMedicalDocument('doc-1', accessRequest);

        expect(result.hasAccess).toBe(true);
        expect(result.document).toEqual(mockDocument);
      });

      it('should allow patient access to their own documents', async () => {
        const accessRequest: MedicalDocumentAccessRequest = {
          documentId: 'doc-1',
          requesterId: 'user-1',
          requesterRole: UserRole.PATIENT
        };

        mockPrisma.medicalDocument.findUnique.mockResolvedValue(mockDocument);

        const result = await medicalHistoryService.getMedicalDocument('doc-1', accessRequest);

        expect(result.hasAccess).toBe(true);
        expect(result.document).toEqual(mockDocument);
      });

      it('should deny patient access to other patients documents', async () => {
        const accessRequest: MedicalDocumentAccessRequest = {
          documentId: 'doc-1',
          requesterId: 'other-user',
          requesterRole: UserRole.PATIENT
        };

        mockPrisma.medicalDocument.findUnique.mockResolvedValue(mockDocument);

        const result = await medicalHistoryService.getMedicalDocument('doc-1', accessRequest);

        expect(result.hasAccess).toBe(false);
        expect(result.reason).toBe('Unauthorized access');
      });

      it('should allow doctor access with valid appointment', async () => {
        const accessRequest: MedicalDocumentAccessRequest = {
          documentId: 'doc-1',
          requesterId: 'doctor-1',
          requesterRole: UserRole.DOCTOR,
          appointmentId: 'appointment-1'
        };

        const mockAppointment = {
          id: 'appointment-1',
          doctorId: 'doctor-1',
          patientId: 'patient-1',
          status: 'CONFIRMED'
        };

        mockPrisma.medicalDocument.findUnique.mockResolvedValue(mockDocument);
        mockPrisma.appointment.findFirst.mockResolvedValue(mockAppointment);

        const result = await medicalHistoryService.getMedicalDocument('doc-1', accessRequest);

        expect(result.hasAccess).toBe(true);
        expect(result.document).toEqual(mockDocument);
      });

      it('should deny doctor access without appointment ID', async () => {
        const accessRequest: MedicalDocumentAccessRequest = {
          documentId: 'doc-1',
          requesterId: 'doctor-1',
          requesterRole: UserRole.DOCTOR
        };

        mockPrisma.medicalDocument.findUnique.mockResolvedValue(mockDocument);

        const result = await medicalHistoryService.getMedicalDocument('doc-1', accessRequest);

        expect(result.hasAccess).toBe(false);
        expect(result.reason).toBe('Appointment ID required for doctor access');
      });

      it('should deny doctor access without valid appointment', async () => {
        const accessRequest: MedicalDocumentAccessRequest = {
          documentId: 'doc-1',
          requesterId: 'doctor-1',
          requesterRole: UserRole.DOCTOR,
          appointmentId: 'appointment-1'
        };

        mockPrisma.medicalDocument.findUnique.mockResolvedValue(mockDocument);
        mockPrisma.appointment.findFirst.mockResolvedValue(null);

        const result = await medicalHistoryService.getMedicalDocument('doc-1', accessRequest);

        expect(result.hasAccess).toBe(false);
        expect(result.reason).toBe('No active appointment found with this patient');
      });

      it('should return access denied when document not found', async () => {
        const accessRequest: MedicalDocumentAccessRequest = {
          documentId: 'non-existent',
          requesterId: 'user-1',
          requesterRole: UserRole.PATIENT
        };

        mockPrisma.medicalDocument.findUnique.mockResolvedValue(null);

        const result = await medicalHistoryService.getMedicalDocument('non-existent', accessRequest);

        expect(result.hasAccess).toBe(false);
        expect(result.reason).toBe('Document not found');
      });
    });

    describe('updateMedicalDocument with access control', () => {
      const mockDocument = {
        id: 'doc-1',
        patientId: 'patient-1',
        patient: {
          userId: 'user-1',
          user: { id: 'user-1' }
        }
      };

      it('should allow patient to update their own documents', async () => {
        const updates: MedicalDocumentUpdate = {
          description: 'Updated description',
          documentType: DocumentType.PRESCRIPTION
        };

        const updatedDocument = {
          ...mockDocument,
          description: 'Updated description',
          documentType: DocumentType.PRESCRIPTION
        };

        mockPrisma.medicalDocument.findUnique.mockResolvedValue(mockDocument);
        mockPrisma.medicalDocument.update.mockResolvedValue(updatedDocument);

        const result = await medicalHistoryService.updateMedicalDocument(
          'doc-1',
          updates,
          'user-1',
          UserRole.PATIENT
        );

        expect(result).toEqual(updatedDocument);
        expect(mockPrisma.medicalDocument.update).toHaveBeenCalledWith({
          where: { id: 'doc-1' },
          data: {
            description: 'Updated description',
            documentType: DocumentType.PRESCRIPTION
          }
        });
      });

      it('should deny patient updating other patients documents', async () => {
        const updates: MedicalDocumentUpdate = {
          description: 'Updated description'
        };

        mockPrisma.medicalDocument.findUnique.mockResolvedValue(mockDocument);

        await expect(medicalHistoryService.updateMedicalDocument(
          'doc-1',
          updates,
          'other-user',
          UserRole.PATIENT
        )).rejects.toThrow('Unauthorized: Can only update your own documents');
      });

      it('should deny doctor updating patient documents', async () => {
        const updates: MedicalDocumentUpdate = {
          description: 'Updated description'
        };

        mockPrisma.medicalDocument.findUnique.mockResolvedValue(mockDocument);

        await expect(medicalHistoryService.updateMedicalDocument(
          'doc-1',
          updates,
          'doctor-1',
          UserRole.DOCTOR
        )).rejects.toThrow('Unauthorized: Doctors cannot update patient documents');
      });

      it('should throw error when document not found', async () => {
        const updates: MedicalDocumentUpdate = {
          description: 'Updated description'
        };

        mockPrisma.medicalDocument.findUnique.mockResolvedValue(null);

        await expect(medicalHistoryService.updateMedicalDocument(
          'non-existent',
          updates,
          'user-1',
          UserRole.PATIENT
        )).rejects.toThrow('Document not found');
      });
    });

    describe('deleteMedicalDocument with access control', () => {
      const mockDocument = {
        id: 'doc-1',
        patientId: 'patient-1',
        patient: {
          userId: 'user-1',
          user: { id: 'user-1' }
        }
      };

      it('should allow patient to delete their own documents', async () => {
        mockPrisma.medicalDocument.findUnique.mockResolvedValue(mockDocument);
        mockPrisma.medicalDocument.delete.mockResolvedValue({});

        await medicalHistoryService.deleteMedicalDocument('doc-1', 'user-1', UserRole.PATIENT);

        expect(mockPrisma.medicalDocument.delete).toHaveBeenCalledWith({
          where: { id: 'doc-1' }
        });
      });

      it('should deny patient deleting other patients documents', async () => {
        mockPrisma.medicalDocument.findUnique.mockResolvedValue(mockDocument);

        await expect(medicalHistoryService.deleteMedicalDocument(
          'doc-1',
          'other-user',
          UserRole.PATIENT
        )).rejects.toThrow('Unauthorized: Can only delete your own documents');
      });

      it('should deny doctor deleting patient documents', async () => {
        mockPrisma.medicalDocument.findUnique.mockResolvedValue(mockDocument);

        await expect(medicalHistoryService.deleteMedicalDocument(
          'doc-1',
          'doctor-1',
          UserRole.DOCTOR
        )).rejects.toThrow('Unauthorized: Doctors cannot delete patient documents');
      });
    });
  });

  describe('Document Categorization and Search', () => {
    describe('getMedicalDocuments with filtering', () => {
      const mockDocuments = [
        {
          id: 'doc-1',
          patientId: 'patient-1',
          fileName: 'blood-test.pdf',
          fileType: 'application/pdf',
          documentType: DocumentType.LAB_REPORT,
          description: 'Blood test results',
          uploadedAt: new Date('2024-01-15')
        },
        {
          id: 'doc-2',
          patientId: 'patient-1',
          fileName: 'prescription.jpg',
          fileType: 'image/jpeg',
          documentType: DocumentType.PRESCRIPTION,
          description: 'Medication prescription',
          uploadedAt: new Date('2024-01-10')
        }
      ];

      it('should search documents by document type', async () => {
        const criteria: MedicalDocumentSearchCriteria = {
          patientId: 'patient-1',
          documentType: DocumentType.LAB_REPORT
        };

        const filters: MedicalDocumentFilters = {
          page: 1,
          limit: 10
        };

        mockPrisma.medicalDocument.count.mockResolvedValue(1);
        mockPrisma.medicalDocument.findMany.mockResolvedValue([mockDocuments[0]]);

        const result = await medicalHistoryService.getMedicalDocuments(criteria, filters);

        expect(result.data).toHaveLength(1);
        expect(result.data[0]?.documentType).toBe(DocumentType.LAB_REPORT);
        expect(mockPrisma.medicalDocument.findMany).toHaveBeenCalledWith({
          where: expect.objectContaining({
            patientId: 'patient-1',
            documentType: DocumentType.LAB_REPORT
          }),
          skip: 0,
          take: 10,
          orderBy: { uploadedAt: 'desc' }
        });
      });

      it('should search documents by file type', async () => {
        const criteria: MedicalDocumentSearchCriteria = {
          patientId: 'patient-1',
          fileType: 'application/pdf'
        };

        mockPrisma.medicalDocument.count.mockResolvedValue(1);
        mockPrisma.medicalDocument.findMany.mockResolvedValue([mockDocuments[0]]);

        const result = await medicalHistoryService.getMedicalDocuments(criteria);

        expect(result.data).toHaveLength(1);
        expect(result.data[0]?.fileType).toBe('application/pdf');
        expect(mockPrisma.medicalDocument.findMany).toHaveBeenCalledWith({
          where: expect.objectContaining({
            patientId: 'patient-1',
            fileType: 'application/pdf'
          }),
          skip: 0,
          take: 10,
          orderBy: { uploadedAt: 'desc' }
        });
      });

      it('should search documents by date range', async () => {
        const criteria: MedicalDocumentSearchCriteria = {
          patientId: 'patient-1',
          startDate: new Date('2024-01-12'),
          endDate: new Date('2024-01-20')
        };

        mockPrisma.medicalDocument.count.mockResolvedValue(1);
        mockPrisma.medicalDocument.findMany.mockResolvedValue([mockDocuments[0]]);

        const result = await medicalHistoryService.getMedicalDocuments(criteria);

        expect(result.data).toHaveLength(1);
        expect(mockPrisma.medicalDocument.findMany).toHaveBeenCalledWith({
          where: expect.objectContaining({
            patientId: 'patient-1',
            uploadedAt: {
              gte: new Date('2024-01-12'),
              lte: new Date('2024-01-20')
            }
          }),
          skip: 0,
          take: 10,
          orderBy: { uploadedAt: 'desc' }
        });
      });

      it('should search documents by search term', async () => {
        const criteria: MedicalDocumentSearchCriteria = {
          patientId: 'patient-1',
          searchTerm: 'blood'
        };

        mockPrisma.medicalDocument.count.mockResolvedValue(1);
        mockPrisma.medicalDocument.findMany.mockResolvedValue([mockDocuments[0]]);

        const result = await medicalHistoryService.getMedicalDocuments(criteria);

        expect(result.data).toHaveLength(1);
        expect(mockPrisma.medicalDocument.findMany).toHaveBeenCalledWith({
          where: expect.objectContaining({
            patientId: 'patient-1',
            OR: [
              {
                fileName: {
                  contains: 'blood',
                  mode: 'insensitive'
                }
              },
              {
                description: {
                  contains: 'blood',
                  mode: 'insensitive'
                }
              }
            ]
          }),
          skip: 0,
          take: 10,
          orderBy: { uploadedAt: 'desc' }
        });
      });

      it('should apply pagination correctly', async () => {
        const criteria: MedicalDocumentSearchCriteria = {
          patientId: 'patient-1'
        };

        const filters: MedicalDocumentFilters = {
          page: 2,
          limit: 5,
          sortBy: 'fileName',
          sortOrder: 'asc'
        };

        mockPrisma.medicalDocument.count.mockResolvedValue(15);
        mockPrisma.medicalDocument.findMany.mockResolvedValue(mockDocuments);

        const result = await medicalHistoryService.getMedicalDocuments(criteria, filters);

        expect(result.pagination.page).toBe(2);
        expect(result.pagination.limit).toBe(5);
        expect(result.pagination.total).toBe(15);
        expect(result.pagination.totalPages).toBe(3);
        expect(mockPrisma.medicalDocument.findMany).toHaveBeenCalledWith({
          where: expect.objectContaining({
            patientId: 'patient-1'
          }),
          skip: 5, // (page - 1) * limit
          take: 5,
          orderBy: { fileName: 'asc' }
        });
      });

      it('should combine multiple search criteria', async () => {
        const criteria: MedicalDocumentSearchCriteria = {
          patientId: 'patient-1',
          documentType: DocumentType.LAB_REPORT,
          fileType: 'application/pdf',
          searchTerm: 'blood',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31')
        };

        mockPrisma.medicalDocument.count.mockResolvedValue(1);
        mockPrisma.medicalDocument.findMany.mockResolvedValue([mockDocuments[0]]);

        await medicalHistoryService.getMedicalDocuments(criteria);

        expect(mockPrisma.medicalDocument.findMany).toHaveBeenCalledWith({
          where: expect.objectContaining({
            patientId: 'patient-1',
            documentType: DocumentType.LAB_REPORT,
            fileType: 'application/pdf',
            uploadedAt: {
              gte: new Date('2024-01-01'),
              lte: new Date('2024-01-31')
            },
            OR: [
              {
                fileName: {
                  contains: 'blood',
                  mode: 'insensitive'
                }
              },
              {
                description: {
                  contains: 'blood',
                  mode: 'insensitive'
                }
              }
            ]
          }),
          skip: 0,
          take: 10,
          orderBy: { uploadedAt: 'desc' }
        });
      });
    });

    describe('getMedicalHistorySummary', () => {
      it('should generate medical history summary correctly', async () => {
        const mockRecentDocuments = [
          {
            id: 'doc-1',
            patientId: 'patient-1',
            fileName: 'recent-test.pdf',
            documentType: DocumentType.LAB_REPORT,
            uploadedAt: new Date('2024-01-15')
          }
        ];

        const mockLastDocument = {
          uploadedAt: new Date('2024-01-15')
        };

        // Mock count queries for each document type
        mockPrisma.medicalDocument.count
          .mockResolvedValueOnce(5) // total documents
          .mockResolvedValueOnce(2) // LAB_REPORT count
          .mockResolvedValueOnce(1) // PRESCRIPTION count
          .mockResolvedValueOnce(1) // SCAN count
          .mockResolvedValueOnce(1); // OTHER count

        mockPrisma.medicalDocument.findMany.mockResolvedValue(mockRecentDocuments);
        mockPrisma.medicalDocument.findFirst.mockResolvedValue(mockLastDocument);

        const result = await medicalHistoryService.getMedicalHistorySummary('patient-1');

        expect(result.patientId).toBe('patient-1');
        expect(result.totalDocuments).toBe(5);
        expect(result.documentsByType).toEqual({
          LAB_REPORT: 2,
          PRESCRIPTION: 1,
          SCAN: 1,
          OTHER: 1
        });
        expect(result.recentDocuments).toHaveLength(1);
        expect(result.lastUploadDate).toEqual(new Date('2024-01-15'));
      });

      it('should handle empty medical history', async () => {
        mockPrisma.medicalDocument.count
          .mockResolvedValueOnce(0) // total documents
          .mockResolvedValueOnce(0) // LAB_REPORT count
          .mockResolvedValueOnce(0) // PRESCRIPTION count
          .mockResolvedValueOnce(0) // SCAN count
          .mockResolvedValueOnce(0); // OTHER count

        mockPrisma.medicalDocument.findMany.mockResolvedValue([]);
        mockPrisma.medicalDocument.findFirst.mockResolvedValue(null);

        const result = await medicalHistoryService.getMedicalHistorySummary('patient-1');

        expect(result.totalDocuments).toBe(0);
        expect(result.documentsByType).toEqual({
          LAB_REPORT: 0,
          PRESCRIPTION: 0,
          SCAN: 0,
          OTHER: 0
        });
        expect(result.recentDocuments).toHaveLength(0);
        expect(result.lastUploadDate).toBeUndefined();
      });
    });

    describe('searchMedicalDocuments (admin only)', () => {
      it('should search across all patients documents', async () => {
        const mockDocuments = [
          {
            id: 'doc-1',
            patientId: 'patient-1',
            fileName: 'blood-test.pdf',
            description: 'Blood test results',
            documentType: DocumentType.LAB_REPORT,
            uploadedAt: new Date(),
            patient: {
              name: 'John Doe',
              user: {
                email: 'john@example.com'
              }
            }
          }
        ];

        mockPrisma.medicalDocument.count.mockResolvedValue(1);
        mockPrisma.medicalDocument.findMany.mockResolvedValue(mockDocuments);

        const result = await medicalHistoryService.searchMedicalDocuments('blood');

        expect(result.data).toHaveLength(1);
        expect(result.data[0]?.fileName).toBe('blood-test.pdf');
        expect(mockPrisma.medicalDocument.findMany).toHaveBeenCalledWith({
          where: expect.objectContaining({
            OR: [
              {
                fileName: {
                  contains: 'blood',
                  mode: 'insensitive'
                }
              },
              {
                description: {
                  contains: 'blood',
                  mode: 'insensitive'
                }
              },
              {
                patient: {
                  name: {
                    contains: 'blood',
                    mode: 'insensitive'
                  }
                }
              }
            ]
          }),
          skip: 0,
          take: 10,
          orderBy: { uploadedAt: 'desc' },
          include: expect.objectContaining({
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
          })
        });
      });

      it('should filter by document type in admin search', async () => {
        mockPrisma.medicalDocument.count.mockResolvedValue(0);
        mockPrisma.medicalDocument.findMany.mockResolvedValue([]);

        await medicalHistoryService.searchMedicalDocuments('test', DocumentType.LAB_REPORT);

        expect(mockPrisma.medicalDocument.findMany).toHaveBeenCalledWith({
          where: expect.objectContaining({
            documentType: DocumentType.LAB_REPORT,
            OR: expect.any(Array)
          }),
          skip: 0,
          take: 10,
          orderBy: { uploadedAt: 'desc' },
          include: expect.any(Object)
        });
      });
    });
  });
});