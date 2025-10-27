import { Router } from 'express';
import { zoomController } from '../controllers/zoomController';
import { authenticateToken, requireRole } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';

// Import validation functions directly
const expressValidator = require('express-validator');
const { body, param, query } = expressValidator;

const router = Router();

// Validation schemas
const createMeetingValidation = [
  body('appointmentId').isUUID().withMessage('Valid appointment ID is required'),
  body('topic').isString().isLength({ min: 1, max: 200 }).withMessage('Topic must be 1-200 characters'),
  body('startTime').isISO8601().withMessage('Valid start time is required'),
  body('duration').isInt({ min: 15, max: 480 }).withMessage('Duration must be between 15 and 480 minutes'),
  body('hostEmail').isEmail().withMessage('Valid host email is required'),
  body('participantEmail').optional().isEmail().withMessage('Valid participant email required if provided'),
  body('participantName').optional().isString().isLength({ min: 1, max: 100 }).withMessage('Participant name must be 1-100 characters')
];

const updateMeetingValidation = [
  param('meetingId').isUUID().withMessage('Valid meeting ID is required'),
  body('topic').optional().isString().isLength({ min: 1, max: 200 }).withMessage('Topic must be 1-200 characters'),
  body('startTime').optional().isISO8601().withMessage('Valid start time is required'),
  body('duration').optional().isInt({ min: 15, max: 480 }).withMessage('Duration must be between 15 and 480 minutes'),
  body('status').optional().isIn(['scheduled', 'started', 'ended', 'cancelled']).withMessage('Invalid status')
];

const meetingIdValidation = [
  param('meetingId').isUUID().withMessage('Valid meeting ID is required')
];

const appointmentIdValidation = [
  param('appointmentId').isUUID().withMessage('Valid appointment ID is required')
];

const meetingLinkValidation = [
  param('meetingId').isUUID().withMessage('Valid meeting ID is required'),
  query('role').isIn(['host', 'participant']).withMessage('Role must be either host or participant')
];

// Routes

/**
 * @route   POST /api/zoom/meetings
 * @desc    Create a new Zoom meeting for an appointment
 * @access  Private (Doctor, Admin)
 */
router.post(
  '/meetings',
  authenticateToken,
  requireRole(['DOCTOR', 'ADMIN']),
  createMeetingValidation,
  validateRequest,
  zoomController.createMeeting
);

/**
 * @route   GET /api/zoom/meetings/appointment/:appointmentId
 * @desc    Get meeting details by appointment ID
 * @access  Private (Patient, Doctor, Admin)
 */
router.get(
  '/meetings/appointment/:appointmentId',
  authenticateToken,
  requireRole(['PATIENT', 'DOCTOR', 'ADMIN']),
  appointmentIdValidation,
  validateRequest,
  zoomController.getMeetingByAppointmentId
);

/**
 * @route   GET /api/zoom/meetings/:meetingId
 * @desc    Get meeting details by meeting ID
 * @access  Private (Patient, Doctor, Admin)
 */
router.get(
  '/meetings/:meetingId',
  authenticateToken,
  requireRole(['PATIENT', 'DOCTOR', 'ADMIN']),
  meetingIdValidation,
  validateRequest,
  zoomController.getMeetingById
);

/**
 * @route   PUT /api/zoom/meetings/:meetingId
 * @desc    Update meeting details
 * @access  Private (Doctor, Admin)
 */
router.put(
  '/meetings/:meetingId',
  authenticateToken,
  requireRole(['DOCTOR', 'ADMIN']),
  updateMeetingValidation,
  validateRequest,
  zoomController.updateMeeting
);

/**
 * @route   DELETE /api/zoom/meetings/:meetingId
 * @desc    Cancel/Delete a meeting
 * @access  Private (Doctor, Admin)
 */
router.delete(
  '/meetings/:meetingId',
  authenticateToken,
  requireRole(['DOCTOR', 'ADMIN']),
  meetingIdValidation,
  validateRequest,
  zoomController.deleteMeeting
);

/**
 * @route   POST /api/zoom/meetings/:meetingId/start
 * @desc    Start a meeting (update status)
 * @access  Private (Doctor, Admin)
 */
router.post(
  '/meetings/:meetingId/start',
  authenticateToken,
  requireRole(['DOCTOR', 'ADMIN']),
  meetingIdValidation,
  validateRequest,
  zoomController.startMeeting
);

/**
 * @route   POST /api/zoom/meetings/:meetingId/end
 * @desc    End a meeting (update status)
 * @access  Private (Doctor, Admin)
 */
router.post(
  '/meetings/:meetingId/end',
  authenticateToken,
  requireRole(['DOCTOR', 'ADMIN']),
  meetingIdValidation,
  validateRequest,
  zoomController.endMeeting
);

/**
 * @route   GET /api/zoom/meetings/:meetingId/link
 * @desc    Get meeting link for user role
 * @access  Private (Patient, Doctor, Admin)
 */
router.get(
  '/meetings/:meetingId/link',
  authenticateToken,
  requireRole(['PATIENT', 'DOCTOR', 'ADMIN']),
  meetingLinkValidation,
  validateRequest,
  zoomController.getMeetingLink
);

/**
 * @route   GET /api/zoom/stats
 * @desc    Get meeting statistics
 * @access  Private (Admin)
 */
router.get(
  '/stats',
  authenticateToken,
  requireRole(['ADMIN']),
  zoomController.getMeetingStats
);

/**
 * @route   POST /api/zoom/webhook
 * @desc    Handle Zoom webhooks
 * @access  Public (Zoom webhook endpoint)
 */
router.post('/webhook', zoomController.handleWebhook);

export default router;