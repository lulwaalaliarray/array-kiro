import { Router } from 'express';
import { adminController } from '../controllers/adminController';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
const { body, param, query } = require('express-validator');

const router = Router();

// Apply authentication middleware to all admin routes
router.use(authenticateToken);

// System analytics and dashboard
router.get('/analytics', adminController.getSystemAnalytics);
router.get('/health', adminController.getSystemHealth);

// User management routes
router.get('/users', 
  [
    query('role').optional().isIn(['PATIENT', 'DOCTOR', 'ADMIN']),
    query('isActive').optional().isBoolean(),
    query('isVerified').optional().isBoolean(),
    query('searchTerm').optional().isString().trim(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('sortBy').optional().isIn(['createdAt', 'name', 'email']),
    query('sortOrder').optional().isIn(['asc', 'desc'])
  ],
  validateRequest,
  adminController.getUsers
);

router.patch('/users/:userId/status',
  [
    param('userId').isUUID().withMessage('Valid user ID is required'),
    body('isActive').optional().isBoolean(),
    body('isVerified').optional().isBoolean()
  ],
  validateRequest,
  adminController.updateUserStatus
);

// Doctor verification routes
router.get('/doctors/pending-verification', adminController.getDoctorsPendingVerification);

router.post('/doctors/:doctorId/verify',
  [
    param('doctorId').isUUID().withMessage('Valid doctor ID is required'),
    body('action').isIn(['approve', 'reject']).withMessage('Action must be approve or reject'),
    body('adminNotes').optional().isString().trim()
  ],
  validateRequest,
  adminController.processDoctorVerification
);

// Payment transaction monitoring routes
router.get('/payments/transactions',
  [
    query('status').optional().isIn(['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED']),
    query('dateFrom').optional().isISO8601(),
    query('dateTo').optional().isISO8601(),
    query('minAmount').optional().isFloat({ min: 0 }),
    query('maxAmount').optional().isFloat({ min: 0 }),
    query('doctorId').optional().isUUID(),
    query('patientId').optional().isUUID(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('sortBy').optional().isIn(['createdAt', 'amount', 'processedAt']),
    query('sortOrder').optional().isIn(['asc', 'desc'])
  ],
  validateRequest,
  adminController.getPaymentTransactions
);

router.get('/payments/reconciliation',
  [
    query('dateFrom').optional().isISO8601(),
    query('dateTo').optional().isISO8601()
  ],
  validateRequest,
  adminController.getPaymentReconciliation
);

// Appointment management routes (admin view)
router.get('/appointments',
  [
    query('status').optional().isIn(['AWAITING_ACCEPTANCE', 'REJECTED', 'PAYMENT_PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']),
    query('type').optional().isIn(['ONLINE', 'PHYSICAL']),
    query('dateFrom').optional().isISO8601(),
    query('dateTo').optional().isISO8601(),
    query('doctorId').optional().isUUID(),
    query('patientId').optional().isUUID(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('sortBy').optional().isIn(['scheduledDateTime', 'createdAt', 'status']),
    query('sortOrder').optional().isIn(['asc', 'desc'])
  ],
  validateRequest,
  adminController.getAllAppointments
);

export default router;