import type { MedicalDocument } from '@prisma/client';

// Medical document types (matching Prisma enum)
export type DocumentType = 'LAB_REPORT' | 'PRESCRIPTION' | 'SCAN' | 'OTHER';

// Medical document interfaces
export interface MedicalDocumentCreate {
  patientId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  documentType: DocumentType;
  description?: string;
}

export interface MedicalDocumentUpdate {
  description?: string;
  documentType?: DocumentType;
}

export interface MedicalDocumentWithDetails extends MedicalDocument {
  documentType: DocumentType;
}

// Search and filtering interfaces
export interface MedicalDocumentSearchCriteria {
  patientId: string;
  documentType?: DocumentType;
  fileType?: string;
  startDate?: Date;
  endDate?: Date;
  searchTerm?: string; // Search in description or fileName
}

export interface MedicalDocumentFilters {
  page?: number;
  limit?: number;
  sortBy?: 'uploadedAt' | 'fileName' | 'documentType';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedMedicalDocuments {
  data: MedicalDocumentWithDetails[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// File upload request for medical documents
export interface MedicalDocumentUploadRequest {
  file: Express.Multer.File;
  patientId: string;
  documentType: DocumentType;
  description?: string;
}

export interface MedicalDocumentUploadResponse {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  documentType: DocumentType;
  description?: string;
  uploadedAt: Date;
}

// Access control interfaces
export interface MedicalDocumentAccessRequest {
  documentId: string;
  requesterId: string;
  requesterRole: 'PATIENT' | 'DOCTOR' | 'ADMIN';
  appointmentId?: string; // Required for doctor access
}

export interface MedicalDocumentAccessResponse {
  hasAccess: boolean;
  reason?: string;
  document?: MedicalDocumentWithDetails;
}

// Medical history summary
export interface MedicalHistorySummary {
  patientId: string;
  totalDocuments: number;
  documentsByType: {
    LAB_REPORT: number;
    PRESCRIPTION: number;
    SCAN: number;
    OTHER: number;
  };
  recentDocuments: MedicalDocumentWithDetails[];
  lastUploadDate?: Date | undefined;
}

// Validation interfaces
export interface DocumentValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface FileValidationOptions {
  maxFileSize: number;
  allowedMimeTypes: string[];
  allowedExtensions: string[];
}