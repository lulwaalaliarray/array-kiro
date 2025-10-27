import { Router } from 'express';
import { paymentController } from '../controllers/paymentController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Create payment intent for appointment
router.post(
  '/create-intent',
  authenticateToken,
  requireRole(['PATIENT']),
  paymentController.createPaymentIntent.bind(paymentController)
);

// Confirm payment completion
router.post(
  '/confirm',
  authenticateToken,
  requireRole(['PATIENT']),
  paymentController.confirmPayment.bind(paymentController)
);

// Process refund
router.post(
  '/:paymentId/refund',
  authenticateToken,
  requireRole(['ADMIN', 'DOCTOR']),
  paymentController.refundPayment.bind(paymentController)
);

// Get payment history for current user
router.get(
  '/history',
  authenticateToken,
  requireRole(['PATIENT', 'DOCTOR']),
  paymentController.getPaymentHistory.bind(paymentController)
);

// Get doctor earnings
router.get(
  '/earnings',
  authenticateToken,
  requireRole(['DOCTOR']),
  paymentController.getDoctorEarnings.bind(paymentController)
);

// Admin payment statistics
router.get(
  '/admin/stats',
  authenticateToken,
  requireRole(['ADMIN']),
  paymentController.getAdminPaymentStats.bind(paymentController)
);

// Stripe webhook endpoint (no authentication required)
router.post(
  '/webhook',
  paymentController.handleWebhook.bind(paymentController)
);

export default router;