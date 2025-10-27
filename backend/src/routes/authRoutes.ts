import { Router } from 'express';
import { AuthController } from '@/controllers/authController';
import { authenticate, authorize } from '@/middleware/auth';
import { validateRequest } from '@/utils/validation';
import {
  patientRegistrationSchema,
  doctorRegistrationSchema,
  adminRegistrationSchema,
  loginSchema,
  refreshTokenSchema,
} from '@/utils/validation';
import { UserRole } from '@prisma/client';

const router = Router();

// Public routes
router.post('/register/patient', validateRequest(patientRegistrationSchema), AuthController.registerPatient);
router.post('/register/doctor', validateRequest(doctorRegistrationSchema), AuthController.registerDoctor);
router.post('/login', validateRequest(loginSchema), AuthController.login);
router.post('/refresh-token', validateRequest(refreshTokenSchema), AuthController.refreshToken);

// Protected routes
router.get('/profile', authenticate, AuthController.getProfile);
router.post('/logout', authenticate, AuthController.logout);
router.put('/password', authenticate, AuthController.updatePassword);

// Admin-only routes
router.post('/register/admin', authenticate, authorize(UserRole.ADMIN), validateRequest(adminRegistrationSchema), AuthController.registerAdmin);

export default router;