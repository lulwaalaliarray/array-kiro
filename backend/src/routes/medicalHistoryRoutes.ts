import { Router } from 'express';
import { medicalHistoryController } from '../controllers/medicalHistoryController';
import { authenticateToken, requireRole } from '../middleware/auth';
import { fileUploadService } from '../services/fileUploadService';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Upload medical document (patients only)
router.post(
  '/upload',
  requireRole(['PATIENT']),
  fileUploadService.getMulterConfig().single('document'),
  medicalHistoryController.uploadMedicalDocument.bind(medicalHistoryController)
);

// Get medical document by ID (with access control)
router.get(
  '/documents/:documentId',
  medicalHistoryController.getMedicalDocument.bind(medicalHistoryController)
);

// Get medical documents for a patient (with filtering and pagination)
router.get(
  '/patients/:patientId/documents',
  medicalHistoryController.getMedicalDocuments.bind(medicalHistoryController)
);

// Update medical document (patients and admins only)
router.put(
  '/documents/:documentId',
  requireRole(['PATIENT', 'ADMIN']),
  medicalHistoryController.updateMedicalDocument.bind(medicalHistoryController)
);

// Delete medical document (patients and admins only)
router.delete(
  '/documents/:documentId',
  requireRole(['PATIENT', 'ADMIN']),
  medicalHistoryController.deleteMedicalDocument.bind(medicalHistoryController)
);

// Get medical history summary for a patient
router.get(
  '/patients/:patientId/summary',
  medicalHistoryController.getMedicalHistorySummary.bind(medicalHistoryController)
);

// Search medical documents across all patients (admin only)
router.get(
  '/search',
  requireRole(['ADMIN']),
  medicalHistoryController.searchMedicalDocuments.bind(medicalHistoryController)
);

export default router;