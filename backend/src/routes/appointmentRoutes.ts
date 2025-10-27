import { Router } from 'express';
import { appointmentController } from '../controllers/appointmentController';
import { authenticateToken } from '../middleware/auth';
const { body, param, query } = require('express-validator');
import { handleValidationErrors } from '../middleware/errorHandler';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Validation middleware
const appointmentValidation = [
  body('doctorId')
    .isUUID()
    .withMessage('Doctor ID must be a valid UUID'),
  body('scheduledDateTime')
    .isISO8601()
    .withMessage('Scheduled date time must be a valid ISO 8601 date'),
  body('type')
    .isIn(['ONLINE', 'PHYSICAL'])
    .withMessage('Type must be either ONLINE or PHYSICAL'),
  body('notes')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('Notes must be a string with maximum 500 characters'),
];

const statusUpdateValidation = [
  param('appointmentId')
    .isUUID()
    .withMessage('Appointment ID must be a valid UUID'),
  body('status')
    .isIn(['AWAITING_ACCEPTANCE', 'REJECTED', 'PAYMENT_PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'])
    .withMessage('Status must be a valid appointment status'),
  body('notes')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('Notes must be a string with maximum 500 characters'),
];

const cancellationValidation = [
  param('appointmentId')
    .isUUID()
    .withMessage('Appointment ID must be a valid UUID'),
  body('reason')
    .isString()
    .isLength({ min: 1, max: 500 })
    .withMessage('Reason is required and must be between 1 and 500 characters'),
  body('refundRequested')
    .optional()
    .isBoolean()
    .withMessage('Refund requested must be a boolean'),
];

const rescheduleValidation = [
  param('appointmentId')
    .isUUID()
    .withMessage('Appointment ID must be a valid UUID'),
  body('newDateTime')
    .isISO8601()
    .withMessage('New date time must be a valid ISO 8601 date'),
  body('reason')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('Reason must be a string with maximum 500 characters'),
];

const appointmentIdValidation = [
  param('appointmentId')
    .isUUID()
    .withMessage('Appointment ID must be a valid UUID'),
];

const appointmentQueryValidation = [
  query('status')
    .optional()
    .isIn(['AWAITING_ACCEPTANCE', 'REJECTED', 'PAYMENT_PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'])
    .withMessage('Status must be a valid appointment status'),
  query('type')
    .optional()
    .isIn(['ONLINE', 'PHYSICAL'])
    .withMessage('Type must be either ONLINE or PHYSICAL'),
  query('dateFrom')
    .optional()
    .isISO8601()
    .withMessage('Date from must be a valid ISO 8601 date'),
  query('dateTo')
    .optional()
    .isISO8601()
    .withMessage('Date to must be a valid ISO 8601 date'),
  query('doctorId')
    .optional()
    .isUUID()
    .withMessage('Doctor ID must be a valid UUID'),
  query('patientId')
    .optional()
    .isUUID()
    .withMessage('Patient ID must be a valid UUID'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('sortBy')
    .optional()
    .isIn(['scheduledDateTime', 'createdAt', 'status'])
    .withMessage('Sort by must be one of: scheduledDateTime, createdAt, status'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be either asc or desc'),
];

/**
 * @route   POST /api/appointments
 * @desc    Create a new appointment request
 * @access  Private (Patient only)
 */
router.post(
  '/',
  appointmentValidation,
  handleValidationErrors,
  appointmentController.createAppointment
);

/**
 * @route   GET /api/appointments
 * @desc    Get appointments with filtering and pagination
 * @access  Private (Patient, Doctor, Admin)
 */
router.get(
  '/',
  appointmentQueryValidation,
  handleValidationErrors,
  appointmentController.getAppointments
);

/**
 * @route   GET /api/appointments/stats
 * @desc    Get appointment statistics
 * @access  Private (Patient, Doctor, Admin)
 */
router.get(
  '/stats',
  appointmentController.getAppointmentStats
);

/**
 * @route   GET /api/appointments/:appointmentId
 * @desc    Get a single appointment by ID
 * @access  Private (Patient, Doctor, Admin)
 */
router.get(
  '/:appointmentId',
  appointmentIdValidation,
  handleValidationErrors,
  appointmentController.getAppointmentById
);

/**
 * @route   PUT /api/appointments/:appointmentId/status
 * @desc    Update appointment status (accept/reject by doctor)
 * @access  Private (Doctor, Admin)
 */
router.put(
  '/:appointmentId/status',
  statusUpdateValidation,
  handleValidationErrors,
  appointmentController.updateAppointmentStatus
);

/**
 * @route   PUT /api/appointments/:appointmentId/cancel
 * @desc    Cancel an appointment
 * @access  Private (Patient, Doctor, Admin)
 */
router.put(
  '/:appointmentId/cancel',
  cancellationValidation,
  handleValidationErrors,
  appointmentController.cancelAppointment
);

/**
 * @route   PUT /api/appointments/:appointmentId/reschedule
 * @desc    Reschedule an appointment
 * @access  Private (Patient, Doctor, Admin)
 */
router.put(
  '/:appointmentId/reschedule',
  rescheduleValidation,
  handleValidationErrors,
  appointmentController.rescheduleAppointment
);

export default router;