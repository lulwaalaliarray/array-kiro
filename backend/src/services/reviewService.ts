import { PrismaClient, AppointmentStatus } from '@prisma/client';
import { 
  ReviewRequest, 
  ReviewWithDetails, 
  ReviewFilters, 
  ReviewStats,
  DoctorRatingUpdate,
  ReviewValidationResult,
  PaginatedReviewResult
} from '../types/review';
import { logger } from '../utils/logger';

export class ReviewService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Create a new review for a completed appointment
   */
  async createReview(patientId: string, reviewData: ReviewRequest): Promise<ReviewWithDetails> {
    try {
      // Validate the review request
      const validation = await this.validateReviewRequest(patientId, reviewData);
      if (!validation.isValid) {
        throw new Error(`Review validation failed: ${validation.errors.join(', ')}`);
      }

      // Get appointment details to extract doctorId
      const appointment = await this.prisma.appointment.findUnique({
        where: { id: reviewData.appointmentId },
        select: { doctorId: true, patientId: true, status: true }
      });

      if (!appointment) {
        throw new Error('Appointment not found');
      }

      if (appointment.patientId !== patientId) {
        throw new Error('Unauthorized: You can only review your own appointments');
      }

      if (appointment.status !== AppointmentStatus.COMPLETED) {
        throw new Error('Can only review completed appointments');
      }

      // Check if review already exists
      const existingReview = await this.prisma.review.findUnique({
        where: { appointmentId: reviewData.appointmentId }
      });

      if (existingReview) {
        throw new Error('Review already exists for this appointment');
      }

      // Create the review
      const review = await this.prisma.review.create({
        data: {
          appointmentId: reviewData.appointmentId,
          patientId,
          doctorId: appointment.doctorId,
          rating: reviewData.rating,
          comment: reviewData.comment || null
        },
        include: {
          patient: {
            select: {
              id: true,
              name: true
            }
          },
          doctor: {
            select: {
              id: true,
              name: true,
              specializations: true
            }
          },
          appointment: {
            select: {
              id: true,
              scheduledDateTime: true,
              type: true
            }
          }
        }
      });

      // Update doctor's average rating
      await this.updateDoctorRating(appointment.doctorId);

      logger.info(`Review created successfully for appointment ${reviewData.appointmentId}`);
      return review;
    } catch (error) {
      logger.error('Error creating review:', error);
      throw error;
    }
  }

  /**
   * Get reviews for a specific doctor
   */
  async getDoctorReviews(
    doctorId: string, 
    filters: ReviewFilters = {}, 
    page: number = 1, 
    limit: number = 10
  ): Promise<PaginatedReviewResult> {
    try {
      const skip = (page - 1) * limit;
      
      const where: any = {
        doctorId,
        ...(filters.rating && { rating: filters.rating }),
        ...(filters.hasComment !== undefined && {
          comment: filters.hasComment ? { not: null } : null
        })
      };

      // Handle date range filters
      if (filters.startDate || filters.endDate) {
        where.createdAt = {};
        if (filters.startDate) where.createdAt.gte = filters.startDate;
        if (filters.endDate) where.createdAt.lte = filters.endDate;
      }

      // Handle rating range filters
      if (filters.minRating || filters.maxRating) {
        where.rating = {};
        if (filters.minRating) where.rating.gte = filters.minRating;
        if (filters.maxRating) where.rating.lte = filters.maxRating;
      }

      const [reviews, total] = await Promise.all([
        this.prisma.review.findMany({
          where,
          include: {
            patient: {
              select: {
                id: true,
                name: true
              }
            },
            doctor: {
              select: {
                id: true,
                name: true,
                specializations: true
              }
            },
            appointment: {
              select: {
                id: true,
                scheduledDateTime: true,
                type: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        this.prisma.review.count({ where })
      ]);

      return {
        reviews,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      logger.error('Error fetching doctor reviews:', error);
      throw error;
    }
  }

  /**
   * Get reviews by a specific patient
   */
  async getPatientReviews(
    patientId: string, 
    page: number = 1, 
    limit: number = 10
  ): Promise<PaginatedReviewResult> {
    try {
      const skip = (page - 1) * limit;
      
      const [reviews, total] = await Promise.all([
        this.prisma.review.findMany({
          where: { patientId },
          include: {
            patient: {
              select: {
                id: true,
                name: true
              }
            },
            doctor: {
              select: {
                id: true,
                name: true,
                specializations: true
              }
            },
            appointment: {
              select: {
                id: true,
                scheduledDateTime: true,
                type: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        this.prisma.review.count({ where: { patientId } })
      ]);

      return {
        reviews,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      logger.error('Error fetching patient reviews:', error);
      throw error;
    }
  }

  /**
   * Get review statistics for a doctor
   */
  async getDoctorReviewStats(doctorId: string): Promise<ReviewStats> {
    try {
      const reviews = await this.prisma.review.findMany({
        where: { doctorId },
        select: { rating: true }
      });

      const totalReviews = reviews.length;
      const averageRating = totalReviews > 0 
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
        : 0;

      const ratingDistribution: { [key: number]: number } = {
        1: 0, 2: 0, 3: 0, 4: 0, 5: 0
      };

      reviews.forEach(review => {
        if (review.rating >= 1 && review.rating <= 5) {
          ratingDistribution[review.rating] = (ratingDistribution[review.rating] || 0) + 1;
        }
      });

      return {
        totalReviews,
        averageRating: Math.round(averageRating * 100) / 100, // Round to 2 decimal places
        ratingDistribution
      };
    } catch (error) {
      logger.error('Error fetching doctor review stats:', error);
      throw error;
    }
  }

  /**
   * Get a specific review by ID
   */
  async getReviewById(reviewId: string): Promise<ReviewWithDetails | null> {
    try {
      return await this.prisma.review.findUnique({
        where: { id: reviewId },
        include: {
          patient: {
            select: {
              id: true,
              name: true
            }
          },
          doctor: {
            select: {
              id: true,
              name: true,
              specializations: true
            }
          },
          appointment: {
            select: {
              id: true,
              scheduledDateTime: true,
              type: true
            }
          }
        }
      });
    } catch (error) {
      logger.error('Error fetching review by ID:', error);
      throw error;
    }
  }

  /**
   * Update doctor's average rating and total reviews count
   */
  private async updateDoctorRating(doctorId: string): Promise<DoctorRatingUpdate> {
    try {
      const stats = await this.getDoctorReviewStats(doctorId);
      
      await this.prisma.doctorProfile.update({
        where: { id: doctorId },
        data: {
          rating: stats.averageRating,
          totalReviews: stats.totalReviews
        }
      });

      return {
        doctorId,
        newAverageRating: stats.averageRating,
        totalReviews: stats.totalReviews
      };
    } catch (error) {
      logger.error('Error updating doctor rating:', error);
      throw error;
    }
  }

  /**
   * Validate review request
   */
  private async validateReviewRequest(patientId: string, reviewData: ReviewRequest): Promise<ReviewValidationResult> {
    const errors: string[] = [];

    // Validate rating range
    if (reviewData.rating < 1 || reviewData.rating > 5) {
      errors.push('Rating must be between 1 and 5');
    }

    // Validate rating is integer
    if (!Number.isInteger(reviewData.rating)) {
      errors.push('Rating must be a whole number');
    }

    // Validate comment length if provided
    if (reviewData.comment && reviewData.comment.length > 1000) {
      errors.push('Comment must be less than 1000 characters');
    }

    // Validate appointment exists and belongs to patient
    try {
      const appointment = await this.prisma.appointment.findUnique({
        where: { id: reviewData.appointmentId },
        select: { patientId: true, status: true }
      });

      if (!appointment) {
        errors.push('Appointment not found');
      } else {
        if (appointment.patientId !== patientId) {
          errors.push('Unauthorized: You can only review your own appointments');
        }
        if (appointment.status !== AppointmentStatus.COMPLETED) {
          errors.push('Can only review completed appointments');
        }
      }
    } catch (error) {
      errors.push('Error validating appointment');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Delete a review (admin only)
   */
  async deleteReview(reviewId: string): Promise<void> {
    try {
      const review = await this.prisma.review.findUnique({
        where: { id: reviewId },
        select: { doctorId: true }
      });

      if (!review) {
        throw new Error('Review not found');
      }

      await this.prisma.review.delete({
        where: { id: reviewId }
      });

      // Update doctor's rating after deletion
      await this.updateDoctorRating(review.doctorId);

      logger.info(`Review ${reviewId} deleted successfully`);
    } catch (error) {
      logger.error('Error deleting review:', error);
      throw error;
    }
  }

  /**
   * Get all reviews for admin management
   */
  async getAllReviews(
    filters: ReviewFilters = {}, 
    page: number = 1, 
    limit: number = 20
  ): Promise<PaginatedReviewResult> {
    try {
      const skip = (page - 1) * limit;
      
      const where: any = {
        ...(filters.doctorId && { doctorId: filters.doctorId }),
        ...(filters.patientId && { patientId: filters.patientId }),
        ...(filters.rating && { rating: filters.rating }),
        ...(filters.hasComment !== undefined && {
          comment: filters.hasComment ? { not: null } : null
        })
      };

      // Handle date range filters
      if (filters.startDate || filters.endDate) {
        where.createdAt = {};
        if (filters.startDate) where.createdAt.gte = filters.startDate;
        if (filters.endDate) where.createdAt.lte = filters.endDate;
      }

      // Handle rating range filters
      if (filters.minRating || filters.maxRating) {
        where.rating = {};
        if (filters.minRating) where.rating.gte = filters.minRating;
        if (filters.maxRating) where.rating.lte = filters.maxRating;
      }

      const [reviews, total] = await Promise.all([
        this.prisma.review.findMany({
          where,
          include: {
            patient: {
              select: {
                id: true,
                name: true
              }
            },
            doctor: {
              select: {
                id: true,
                name: true,
                specializations: true
              }
            },
            appointment: {
              select: {
                id: true,
                scheduledDateTime: true,
                type: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        this.prisma.review.count({ where })
      ]);

      return {
        reviews,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      logger.error('Error fetching all reviews:', error);
      throw error;
    }
  }
}