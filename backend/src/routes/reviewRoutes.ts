import { Router } from 'express';
import { reviewController } from '../controllers/reviewController';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
const { body, param, query } = require('express-validator');

const router = Router();

// Validation schemas
const createReviewValidation = [
  body('appointmentId')
    .isUUID()
    .withMessage('Valid appointment ID is required'),
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be an integer between 1 and 5'),
  body('comment')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Comment must be less than 1000 characters')
];

const doctorIdValidation = [
  param('doctorId')
    .isUUID()
    .withMessage('Valid doctor ID is required')
];

const reviewIdValidation = [
  param('reviewId')
    .isUUID()
    .withMessage('Valid review ID is required')
];

const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

const reviewFiltersValidation = [
  query('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  query('minRating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Minimum rating must be between 1 and 5'),
  query('maxRating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Maximum rating must be between 1 and 5'),
  query('hasComment')
    .optional()
    .isBoolean()
    .withMessage('hasComment must be a boolean'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date')
];

// Routes

/**
 * @route POST /api/reviews
 * @desc Create a new review for a completed appointment
 * @access Private (Patient only)
 */
router.post(
  '/',
  authenticateToken,
  createReviewValidation,
  validateRequest,
  reviewController.createReview
);

/**
 * @route GET /api/reviews/my
 * @desc Get reviews created by the current patient
 * @access Private (Patient only)
 */
router.get(
  '/my',
  authenticateToken,
  paginationValidation,
  validateRequest,
  reviewController.getMyReviews
);

/**
 * @route GET /api/reviews/doctor/:doctorId
 * @desc Get all reviews for a specific doctor
 * @access Public
 */
router.get(
  '/doctor/:doctorId',
  doctorIdValidation,
  paginationValidation,
  reviewFiltersValidation,
  validateRequest,
  reviewController.getDoctorReviews
);

/**
 * @route GET /api/reviews/doctor/:doctorId/stats
 * @desc Get review statistics for a specific doctor
 * @access Public
 */
router.get(
  '/doctor/:doctorId/stats',
  doctorIdValidation,
  validateRequest,
  reviewController.getDoctorReviewStats
);

/**
 * @route GET /api/reviews/:reviewId
 * @desc Get a specific review by ID
 * @access Public
 */
router.get(
  '/:reviewId',
  reviewIdValidation,
  validateRequest,
  reviewController.getReviewById
);

/**
 * @route GET /api/reviews
 * @desc Get all reviews (admin only)
 * @access Private (Admin only)
 */
router.get(
  '/',
  authenticateToken,
  paginationValidation,
  reviewFiltersValidation,
  validateRequest,
  reviewController.getAllReviews
);

/**
 * @route DELETE /api/reviews/:reviewId
 * @desc Delete a review (admin only)
 * @access Private (Admin only)
 */
router.delete(
  '/:reviewId',
  authenticateToken,
  reviewIdValidation,
  validateRequest,
  reviewController.deleteReview
);

export default router;