import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import appointmentRoutes from './appointmentRoutes';
import paymentRoutes from './paymentRoutes';
import zoomRoutes from './zoomRoutes';
import medicalHistoryRoutes from './medicalHistoryRoutes';
import reviewRoutes from './reviewRoutes';
import notificationRoutes from './notificationRoutes';
import adminRoutes from './adminRoutes';

const router = Router();

// Mount route modules
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/payments', paymentRoutes);
router.use('/zoom', zoomRoutes);
router.use('/medical-history', medicalHistoryRoutes);
router.use('/reviews', reviewRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);

// Health check for API routes
router.get('/health', (_req, res) => {
  res.status(200).json({
    message: 'PatientCare API is healthy',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

export default router;