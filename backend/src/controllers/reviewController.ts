import { Request, Response } from 'express';
import { ReviewService } from '../services/reviewService';
import { db as prisma } from '../services/database';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/auth';

export class ReviewController {
  private reviewService: ReviewService;

  constructor() {
    this.reviewService = new ReviewService(prisma);
  }

  /**
   * Create a new review
   */
  createReview = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { appointmentId, rating, comment } = req.body;
      const userId = req.user!.userId;
      const userRole = req.user!.role;

      if (userRole !== 'PATIENT') {
        res.status(403).json({ error: 'Only patients can create reviews' });
        return;
      }

      // Get patient profile ID
      const patientProfile = await prisma.patientProfile.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (!patientProfile) {
        res.status(404).json({ error: 'Patient profile not found' });
        return;
      }

      const patientId = patientProfile.id;

      // Validate required fields
      if (!appointmentId || !rating) {
        res.status(400).json({ error: 'Appointment ID and rating are required' });
        return;
      }

      // Validate rating range
      if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
        res.status(400).json({ error: 'Rating must be an integer between 1 and 5' });
        return;
      }

      const review = await this.reviewService.createReview(patientId, {
        appointmentId,
        rating,
        comment
      });

      res.status(201).json({
        message: 'Review created successfully',
        review
      });
    } catch (error) {
      logger.error('Error in createReview:', error);
      res.status(400).json({ 
        error: error instanceof Error ? error.message : 'Failed to create review' 
      });
    }
  };

  /**
   * Get reviews for a specific doctor
   */
  getDoctorReviews = async (req: Request, res: Response): Promise<void> => {
    try {
      const doctorId = req.params['doctorId'];
      
      if (!doctorId) {
        res.status(400).json({ error: 'Doctor ID is required' });
        return;
      }
      const { 
        page = '1', 
        limit = '10', 
        rating, 
        minRating, 
        maxRating,
        hasComment 
      } = req.query;

      const filters: any = {};
      if (rating) filters.rating = parseInt(rating as string);
      if (minRating) filters.minRating = parseInt(minRating as string);
      if (maxRating) filters.maxRating = parseInt(maxRating as string);
      if (hasComment !== undefined) filters.hasComment = hasComment === 'true';

      const result = await this.reviewService.getDoctorReviews(
        doctorId,
        filters,
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.json(result);
    } catch (error) {
      logger.error('Error in getDoctorReviews:', error);
      res.status(500).json({ 
        error: 'Failed to fetch doctor reviews' 
      });
    }
  };

  /**
   * Get reviews by the current patient
   */
  getMyReviews = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const userRole = req.user!.role;
      const { page = '1', limit = '10' } = req.query;

      if (userRole !== 'PATIENT') {
        res.status(403).json({ error: 'Only patients can view their reviews' });
        return;
      }

      // Get patient profile ID
      const patientProfile = await prisma.patientProfile.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (!patientProfile) {
        res.status(404).json({ error: 'Patient profile not found' });
        return;
      }

      const patientId = patientProfile.id;

      const result = await this.reviewService.getPatientReviews(
        patientId,
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.json(result);
    } catch (error) {
      logger.error('Error in getMyReviews:', error);
      res.status(500).json({ 
        error: 'Failed to fetch your reviews' 
      });
    }
  };

  /**
   * Get review statistics for a doctor
   */
  getDoctorReviewStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const doctorId = req.params['doctorId'];
      
      if (!doctorId) {
        res.status(400).json({ error: 'Doctor ID is required' });
        return;
      }

      const stats = await this.reviewService.getDoctorReviewStats(doctorId);

      res.json(stats);
    } catch (error) {
      logger.error('Error in getDoctorReviewStats:', error);
      res.status(500).json({ 
        error: 'Failed to fetch doctor review statistics' 
      });
    }
  };

  /**
   * Get a specific review by ID
   */
  getReviewById = async (req: Request, res: Response): Promise<void> => {
    try {
      const reviewId = req.params['reviewId'];
      
      if (!reviewId) {
        res.status(400).json({ error: 'Review ID is required' });
        return;
      }

      const review = await this.reviewService.getReviewById(reviewId);

      if (!review) {
        res.status(404).json({ error: 'Review not found' });
        return;
      }

      res.json(review);
    } catch (error) {
      logger.error('Error in getReviewById:', error);
      res.status(500).json({ 
        error: 'Failed to fetch review' 
      });
    }
  };

  /**
   * Get all reviews (admin only)
   */
  getAllReviews = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (req.user?.role !== 'ADMIN') {
        res.status(403).json({ error: 'Admin access required' });
        return;
      }

      const { 
        page = '1', 
        limit = '20', 
        doctorId,
        patientId,
        rating, 
        minRating, 
        maxRating,
        hasComment,
        startDate,
        endDate
      } = req.query;

      const filters: any = {};
      if (doctorId) filters.doctorId = doctorId as string;
      if (patientId) filters.patientId = patientId as string;
      if (rating) filters.rating = parseInt(rating as string);
      if (minRating) filters.minRating = parseInt(minRating as string);
      if (maxRating) filters.maxRating = parseInt(maxRating as string);
      if (hasComment !== undefined) filters.hasComment = hasComment === 'true';
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);

      const result = await this.reviewService.getAllReviews(
        filters,
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.json(result);
    } catch (error) {
      logger.error('Error in getAllReviews:', error);
      res.status(500).json({ 
        error: 'Failed to fetch reviews' 
      });
    }
  };

  /**
   * Delete a review (admin only)
   */
  deleteReview = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (req.user?.role !== 'ADMIN') {
        res.status(403).json({ error: 'Admin access required' });
        return;
      }

      const reviewId = req.params['reviewId'];
      
      if (!reviewId) {
        res.status(400).json({ error: 'Review ID is required' });
        return;
      }

      await this.reviewService.deleteReview(reviewId);

      res.json({ message: 'Review deleted successfully' });
    } catch (error) {
      logger.error('Error in deleteReview:', error);
      res.status(400).json({ 
        error: error instanceof Error ? error.message : 'Failed to delete review' 
      });
    }
  };
}

export const reviewController = new ReviewController();