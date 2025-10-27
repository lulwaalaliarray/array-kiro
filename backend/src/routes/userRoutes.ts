import { Router } from 'express';
import { userController } from '../controllers/userController';
import { authenticate } from '../middleware/auth';
import { fileUploadService } from '../services/fileUploadService';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Profile management routes
router.get('/profile', userController.getProfile.bind(userController));
router.put('/profile/patient', userController.updatePatientProfile.bind(userController));
router.put('/profile/doctor', userController.updateDoctorProfile.bind(userController));
router.put('/profile/admin', userController.updateAdminProfile.bind(userController));

// File upload routes
const upload = fileUploadService.getMulterConfig();
router.post('/profile/image', upload.single('profileImage'), userController.uploadProfileImage.bind(userController));

// Doctor search and management routes
router.get('/doctors/search', userController.searchDoctors.bind(userController));
router.get('/doctors/:doctorId', userController.getDoctorById.bind(userController));

// Admin-only routes for doctor verification
router.get('/doctors/pending-verification', userController.getDoctorsPendingVerification.bind(userController));
router.put('/doctors/:doctorId/verify', userController.verifyDoctorLicense.bind(userController));

// Location-based search routes (Google Maps integration)
router.get('/providers/nearby', userController.searchNearbyProviders.bind(userController));
router.get('/geocode', userController.geocodeAddress.bind(userController));

export default router;