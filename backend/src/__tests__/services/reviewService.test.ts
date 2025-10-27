import { ReviewService } from '../../services/reviewService';
import { PrismaClient, AppointmentStatus } from '@prisma/client';

// Mock Prisma Client
const mockPrisma = {
  appointment: {
    findUnique: jest.fn(),
  },
  review: {
    findUnique: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    delete: jest.fn(),
  },
  doctorProfile: {
    update: jest.fn(),
  },
} as unknown as PrismaClient;

describe('ReviewService', () => {
  let reviewService: ReviewService;

  beforeEach(() => {
    reviewService = new ReviewService(mockPrisma);
    jest.clearAllMocks();
  });



  describe('createReview', () => {
    const mockPatientId = 'patient-123';
    const mockAppointmentId = 'appointment-123';
    const mockDoctorId = 'doctor-123';
    const mockReviewData = {
      appointmentId: mockAppointmentId,
      rating: 5,
      comment: 'Excellent service!'
    };

    const mockAppointment = {
      doctorId: mockDoctorId,
      patientId: mockPatientId,
      status: AppointmentStatus.COMPLETED
    };

    const mockCreatedReview = {
      id: 'review-123',
      appointmentId: mockAppointmentId,
      patientId: mockPatientId,
      doctorId: mockDoctorId,
      rating: 5,
      comment: 'Excellent service!',
      createdAt: new Date(),
      patient: {
        id: mockPatientId,
        name: 'John Doe'
      },
      doctor: {
        id: mockDoctorId,
        name: 'Dr. Smith',
        specializations: ['Cardiology']
      },
      appointment: {
        id: mockAppointmentId,
        scheduledDateTime: new Date(),
        type: 'ONLINE'
      }
    };

    it('should create a review successfully', async () => {
      // Mock appointment lookup
      (mockPrisma.appointment.findUnique as jest.Mock).mockResolvedValue(mockAppointment);
      
      // Mock existing review check
      (mockPrisma.review.findUnique as jest.Mock).mockResolvedValue(null);
      
      // Mock review creation
      (mockPrisma.review.create as jest.Mock).mockResolvedValue(mockCreatedReview);
      
      // Mock doctor rating update
      (mockPrisma.review.findMany as jest.Mock).mockResolvedValue([
        { rating: 5 },
        { rating: 4 }
      ]);
      (mockPrisma.doctorProfile.update as jest.Mock).mockResolvedValue({} as any);

      const result = await reviewService.createReview(mockPatientId, mockReviewData);

      expect(result).toEqual(mockCreatedReview);
      expect(mockPrisma.appointment.findUnique).toHaveBeenCalledWith({
        where: { id: mockAppointmentId },
        select: { doctorId: true, patientId: true, status: true }
      });
      expect(mockPrisma.review.create).toHaveBeenCalled();
    });

    it('should throw error if appointment not found', async () => {
      (mockPrisma.appointment.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        reviewService.createReview(mockPatientId, mockReviewData)
      ).rejects.toThrow('Appointment not found');
    });

    it('should throw error if appointment not completed', async () => {
      (mockPrisma.appointment.findUnique as jest.Mock).mockResolvedValue({
        ...mockAppointment,
        status: AppointmentStatus.CONFIRMED
      });

      await expect(
        reviewService.createReview(mockPatientId, mockReviewData)
      ).rejects.toThrow('Can only review completed appointments');
    });

    it('should throw error if review already exists', async () => {
      (mockPrisma.appointment.findUnique as jest.Mock).mockResolvedValue(mockAppointment);
      (mockPrisma.review.findUnique as jest.Mock).mockResolvedValue({
        id: 'existing-review',
        appointmentId: mockAppointmentId
      } as any);

      await expect(
        reviewService.createReview(mockPatientId, mockReviewData)
      ).rejects.toThrow('Review already exists for this appointment');
    });

    it('should throw error for invalid rating above 5', async () => {
      const invalidReviewData = {
        ...mockReviewData,
        rating: 6
      };

      await expect(
        reviewService.createReview(mockPatientId, invalidReviewData)
      ).rejects.toThrow('Rating must be between 1 and 5');
    });

    it('should throw error for invalid rating below 1', async () => {
      const invalidReviewData = {
        ...mockReviewData,
        rating: 0
      };

      await expect(
        reviewService.createReview(mockPatientId, invalidReviewData)
      ).rejects.toThrow('Rating must be between 1 and 5');
    });

    it('should throw error for non-integer rating', async () => {
      const invalidReviewData = {
        ...mockReviewData,
        rating: 3.5
      };

      await expect(
        reviewService.createReview(mockPatientId, invalidReviewData)
      ).rejects.toThrow('Rating must be a whole number');
    });

    it('should throw error for comment exceeding character limit', async () => {
      const longComment = 'a'.repeat(1001);
      const invalidReviewData = {
        ...mockReviewData,
        comment: longComment
      };

      await expect(
        reviewService.createReview(mockPatientId, invalidReviewData)
      ).rejects.toThrow('Comment must be less than 1000 characters');
    });

    it('should accept valid comment within character limit', async () => {
      const validComment = 'a'.repeat(1000);
      const validReviewData = {
        ...mockReviewData,
        comment: validComment
      };

      (mockPrisma.appointment.findUnique as jest.Mock).mockResolvedValue(mockAppointment);
      (mockPrisma.review.findUnique as jest.Mock).mockResolvedValue(null);
      (mockPrisma.review.create as jest.Mock).mockResolvedValue({
        ...mockCreatedReview,
        comment: validComment
      });
      (mockPrisma.review.findMany as jest.Mock).mockResolvedValue([{ rating: 5 }]);
      (mockPrisma.doctorProfile.update as jest.Mock).mockResolvedValue({} as any);

      const result = await reviewService.createReview(mockPatientId, validReviewData);

      expect(result.comment).toBe(validComment);
    });

    it('should throw error if patient tries to review another patient\'s appointment', async () => {
      const differentPatientAppointment = {
        ...mockAppointment,
        patientId: 'different-patient-123'
      };

      (mockPrisma.appointment.findUnique as jest.Mock).mockResolvedValue(differentPatientAppointment);

      await expect(
        reviewService.createReview(mockPatientId, mockReviewData)
      ).rejects.toThrow('Unauthorized: You can only review your own appointments');
    });
  });

  describe('getDoctorReviews', () => {
    const mockDoctorId = 'doctor-123';
    const mockReviews = [
      {
        id: 'review-1',
        rating: 5,
        comment: 'Great doctor',
        createdAt: new Date(),
        patient: { id: 'patient-1', name: 'John Doe' },
        doctor: { id: mockDoctorId, name: 'Dr. Smith', specializations: ['Cardiology'] },
        appointment: { id: 'appointment-1', scheduledDateTime: new Date(), type: 'ONLINE' }
      }
    ];

    it('should get doctor reviews successfully', async () => {
      (mockPrisma.review.findMany as jest.Mock).mockResolvedValue(mockReviews);
      (mockPrisma.review.count as jest.Mock).mockResolvedValue(1);

      const result = await reviewService.getDoctorReviews(mockDoctorId);

      expect(result.reviews).toEqual(mockReviews);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should apply rating filters correctly', async () => {
      const filters = { minRating: 4, maxRating: 5 };
      
      (mockPrisma.review.findMany as jest.Mock).mockResolvedValue(mockReviews);
      (mockPrisma.review.count as jest.Mock).mockResolvedValue(1);

      await reviewService.getDoctorReviews(mockDoctorId, filters);

      expect(mockPrisma.review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            doctorId: mockDoctorId,
            rating: { gte: 4, lte: 5 }
          })
        })
      );
    });
  });

  describe('getDoctorReviewStats', () => {
    const mockDoctorId = 'doctor-123';
    const mockReviews = [
      { rating: 5 },
      { rating: 4 },
      { rating: 5 },
      { rating: 3 },
      { rating: 4 }
    ];

    it('should calculate review statistics correctly', async () => {
      (mockPrisma.review.findMany as jest.Mock).mockResolvedValue(mockReviews);

      const result = await reviewService.getDoctorReviewStats(mockDoctorId);

      expect(result.totalReviews).toBe(5);
      expect(result.averageRating).toBe(4.2);
      expect(result.ratingDistribution).toEqual({
        1: 0,
        2: 0,
        3: 1,
        4: 2,
        5: 2
      });
    });

    it('should handle no reviews case', async () => {
      (mockPrisma.review.findMany as jest.Mock).mockResolvedValue([]);

      const result = await reviewService.getDoctorReviewStats(mockDoctorId);

      expect(result.totalReviews).toBe(0);
      expect(result.averageRating).toBe(0);
      expect(result.ratingDistribution).toEqual({
        1: 0, 2: 0, 3: 0, 4: 0, 5: 0
      });
    });

    it('should calculate average rating with proper precision', async () => {
      const mockReviewsWithPrecision = [
        { rating: 5 },
        { rating: 4 },
        { rating: 3 }
      ];

      (mockPrisma.review.findMany as jest.Mock).mockResolvedValue(mockReviewsWithPrecision);

      const result = await reviewService.getDoctorReviewStats(mockDoctorId);

      expect(result.totalReviews).toBe(3);
      expect(result.averageRating).toBe(4); // (5+4+3)/3 = 4.0
    });

    it('should round average rating to 2 decimal places', async () => {
      const mockReviewsWithDecimals = [
        { rating: 5 },
        { rating: 4 },
        { rating: 4 }
      ];

      (mockPrisma.review.findMany as jest.Mock).mockResolvedValue(mockReviewsWithDecimals);

      const result = await reviewService.getDoctorReviewStats(mockDoctorId);

      expect(result.totalReviews).toBe(3);
      expect(result.averageRating).toBe(4.33); // (5+4+4)/3 = 4.333... rounded to 4.33
    });

    it('should handle single review correctly', async () => {
      const singleReview = [{ rating: 3 }];

      (mockPrisma.review.findMany as jest.Mock).mockResolvedValue(singleReview);

      const result = await reviewService.getDoctorReviewStats(mockDoctorId);

      expect(result.totalReviews).toBe(1);
      expect(result.averageRating).toBe(3);
      expect(result.ratingDistribution).toEqual({
        1: 0, 2: 0, 3: 1, 4: 0, 5: 0
      });
    });

    it('should handle all same ratings correctly', async () => {
      const sameRatings = [
        { rating: 5 },
        { rating: 5 },
        { rating: 5 },
        { rating: 5 }
      ];

      (mockPrisma.review.findMany as jest.Mock).mockResolvedValue(sameRatings);

      const result = await reviewService.getDoctorReviewStats(mockDoctorId);

      expect(result.totalReviews).toBe(4);
      expect(result.averageRating).toBe(5);
      expect(result.ratingDistribution).toEqual({
        1: 0, 2: 0, 3: 0, 4: 0, 5: 4
      });
    });
  });

  describe('deleteReview', () => {
    const mockReviewId = 'review-123';
    const mockDoctorId = 'doctor-123';

    it('should delete review and update doctor rating', async () => {
      (mockPrisma.review.findUnique as jest.Mock).mockResolvedValue({
        id: mockReviewId,
        doctorId: mockDoctorId
      } as any);
      
      (mockPrisma.review.delete as jest.Mock).mockResolvedValue({} as any);
      
      // Mock for rating update
      (mockPrisma.review.findMany as jest.Mock).mockResolvedValue([
        { rating: 4 },
        { rating: 5 }
      ]);
      (mockPrisma.doctorProfile.update as jest.Mock).mockResolvedValue({} as any);

      await reviewService.deleteReview(mockReviewId);

      expect(mockPrisma.review.delete).toHaveBeenCalledWith({
        where: { id: mockReviewId }
      });
      expect(mockPrisma.doctorProfile.update).toHaveBeenCalled();
    });

    it('should throw error if review not found', async () => {
      (mockPrisma.review.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        reviewService.deleteReview(mockReviewId)
      ).rejects.toThrow('Review not found');
    });

    it('should recalculate doctor rating correctly after deletion', async () => {
      (mockPrisma.review.findUnique as jest.Mock).mockResolvedValue({
        id: mockReviewId,
        doctorId: mockDoctorId
      } as any);
      
      (mockPrisma.review.delete as jest.Mock).mockResolvedValue({} as any);
      
      // Mock remaining reviews after deletion
      (mockPrisma.review.findMany as jest.Mock).mockResolvedValue([
        { rating: 4 },
        { rating: 5 },
        { rating: 3 }
      ]);
      (mockPrisma.doctorProfile.update as jest.Mock).mockResolvedValue({} as any);

      await reviewService.deleteReview(mockReviewId);

      expect(mockPrisma.doctorProfile.update).toHaveBeenCalledWith({
        where: { id: mockDoctorId },
        data: {
          rating: 4, // (4+5+3)/3 = 4
          totalReviews: 3
        }
      });
    });
  });

  describe('rating validation edge cases', () => {
    const mockPatientId = 'patient-123';
    const mockAppointmentId = 'appointment-123';
    const mockDoctorId = 'doctor-123';

    const mockAppointment = {
      doctorId: mockDoctorId,
      patientId: mockPatientId,
      status: AppointmentStatus.COMPLETED
    };

    it('should validate rating boundaries correctly', async () => {
      // Test rating = 1 (minimum valid)
      const minRatingData = {
        appointmentId: mockAppointmentId,
        rating: 1,
        comment: 'Poor service'
      };

      (mockPrisma.appointment.findUnique as jest.Mock).mockResolvedValue(mockAppointment);
      (mockPrisma.review.findUnique as jest.Mock).mockResolvedValue(null);
      (mockPrisma.review.create as jest.Mock).mockResolvedValue({
        id: 'review-123',
        ...minRatingData,
        patientId: mockPatientId,
        doctorId: mockDoctorId,
        createdAt: new Date(),
        patient: { id: mockPatientId, name: 'John Doe' },
        doctor: { id: mockDoctorId, name: 'Dr. Smith', specializations: ['Cardiology'] },
        appointment: { id: mockAppointmentId, scheduledDateTime: new Date(), type: 'ONLINE' }
      });
      (mockPrisma.review.findMany as jest.Mock).mockResolvedValue([{ rating: 1 }]);
      (mockPrisma.doctorProfile.update as jest.Mock).mockResolvedValue({} as any);

      const result = await reviewService.createReview(mockPatientId, minRatingData);
      expect(result.rating).toBe(1);

      // Test rating = 5 (maximum valid)
      const maxRatingData = {
        appointmentId: mockAppointmentId,
        rating: 5,
        comment: 'Excellent service'
      };

      (mockPrisma.review.create as jest.Mock).mockResolvedValue({
        id: 'review-124',
        ...maxRatingData,
        patientId: mockPatientId,
        doctorId: mockDoctorId,
        createdAt: new Date(),
        patient: { id: mockPatientId, name: 'John Doe' },
        doctor: { id: mockDoctorId, name: 'Dr. Smith', specializations: ['Cardiology'] },
        appointment: { id: mockAppointmentId, scheduledDateTime: new Date(), type: 'ONLINE' }
      });

      const result2 = await reviewService.createReview(mockPatientId, maxRatingData);
      expect(result2.rating).toBe(5);
    });

    it('should handle negative ratings', async () => {
      const negativeRatingData = {
        appointmentId: mockAppointmentId,
        rating: -1,
        comment: 'Invalid rating'
      };

      await expect(
        reviewService.createReview(mockPatientId, negativeRatingData)
      ).rejects.toThrow('Rating must be between 1 and 5');
    });

    it('should handle very large ratings', async () => {
      const largeRatingData = {
        appointmentId: mockAppointmentId,
        rating: 100,
        comment: 'Invalid rating'
      };

      await expect(
        reviewService.createReview(mockPatientId, largeRatingData)
      ).rejects.toThrow('Rating must be between 1 and 5');
    });
  });

  describe('doctor rating update functionality', () => {
    const mockDoctorId = 'doctor-123';

    it('should update doctor profile with correct average rating', async () => {
      const mockReviews = [
        { rating: 5 },
        { rating: 4 },
        { rating: 5 },
        { rating: 3 }
      ];

      (mockPrisma.review.findMany as jest.Mock).mockResolvedValue(mockReviews);
      (mockPrisma.doctorProfile.update as jest.Mock).mockResolvedValue({} as any);

      // Call getDoctorReviewStats to trigger the rating calculation
      const stats = await reviewService.getDoctorReviewStats(mockDoctorId);

      expect(stats.averageRating).toBe(4.25); // (5+4+5+3)/4 = 4.25
      expect(stats.totalReviews).toBe(4);
    });

    it('should handle doctor with no reviews', async () => {
      (mockPrisma.review.findMany as jest.Mock).mockResolvedValue([]);

      const stats = await reviewService.getDoctorReviewStats(mockDoctorId);

      expect(stats.averageRating).toBe(0);
      expect(stats.totalReviews).toBe(0);
      expect(stats.ratingDistribution).toEqual({
        1: 0, 2: 0, 3: 0, 4: 0, 5: 0
      });
    });
  });

  describe('admin review management', () => {
    const mockReviews = [
      {
        id: 'review-1',
        rating: 5,
        comment: 'Great doctor',
        createdAt: new Date(),
        doctorId: 'doctor-1',
        patientId: 'patient-1',
        patient: { id: 'patient-1', name: 'John Doe' },
        doctor: { id: 'doctor-1', name: 'Dr. Smith', specializations: ['Cardiology'] },
        appointment: { id: 'appointment-1', scheduledDateTime: new Date(), type: 'ONLINE' }
      },
      {
        id: 'review-2',
        rating: 2,
        comment: 'Poor service',
        createdAt: new Date(),
        doctorId: 'doctor-2',
        patientId: 'patient-2',
        patient: { id: 'patient-2', name: 'Jane Smith' },
        doctor: { id: 'doctor-2', name: 'Dr. Johnson', specializations: ['Dermatology'] },
        appointment: { id: 'appointment-2', scheduledDateTime: new Date(), type: 'PHYSICAL' }
      }
    ];

    describe('getAllReviews', () => {
      it('should get all reviews for admin management', async () => {
        (mockPrisma.review.findMany as jest.Mock).mockResolvedValue(mockReviews);
        (mockPrisma.review.count as jest.Mock).mockResolvedValue(2);

        const result = await reviewService.getAllReviews();

        expect(result.reviews).toEqual(mockReviews);
        expect(result.total).toBe(2);
        expect(result.page).toBe(1);
        expect(result.limit).toBe(20);
      });

      it('should filter reviews by doctor ID', async () => {
        const filteredReviews = [mockReviews[0]];
        const filters = { doctorId: 'doctor-1' };

        (mockPrisma.review.findMany as jest.Mock).mockResolvedValue(filteredReviews);
        (mockPrisma.review.count as jest.Mock).mockResolvedValue(1);

        await reviewService.getAllReviews(filters);

        expect(mockPrisma.review.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              doctorId: 'doctor-1'
            })
          })
        );
      });

      it('should filter reviews by patient ID', async () => {
        const filteredReviews = [mockReviews[1]];
        const filters = { patientId: 'patient-2' };

        (mockPrisma.review.findMany as jest.Mock).mockResolvedValue(filteredReviews);
        (mockPrisma.review.count as jest.Mock).mockResolvedValue(1);

        await reviewService.getAllReviews(filters);

        expect(mockPrisma.review.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              patientId: 'patient-2'
            })
          })
        );
      });

      it('should filter reviews by rating range', async () => {
        const filters = { minRating: 4, maxRating: 5 };

        (mockPrisma.review.findMany as jest.Mock).mockResolvedValue([mockReviews[0]]);
        (mockPrisma.review.count as jest.Mock).mockResolvedValue(1);

        await reviewService.getAllReviews(filters);

        expect(mockPrisma.review.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              rating: { gte: 4, lte: 5 }
            })
          })
        );
      });

      it('should filter reviews by date range', async () => {
        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-12-31');
        const filters = { startDate, endDate };

        (mockPrisma.review.findMany as jest.Mock).mockResolvedValue(mockReviews);
        (mockPrisma.review.count as jest.Mock).mockResolvedValue(2);

        await reviewService.getAllReviews(filters);

        expect(mockPrisma.review.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              createdAt: { gte: startDate, lte: endDate }
            })
          })
        );
      });

      it('should filter reviews by comment presence', async () => {
        const filtersWithComment = { hasComment: true };
        const filtersWithoutComment = { hasComment: false };

        // Test filtering for reviews with comments
        (mockPrisma.review.findMany as jest.Mock).mockResolvedValue(mockReviews);
        (mockPrisma.review.count as jest.Mock).mockResolvedValue(2);

        await reviewService.getAllReviews(filtersWithComment);

        expect(mockPrisma.review.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              comment: { not: null }
            })
          })
        );

        // Test filtering for reviews without comments
        await reviewService.getAllReviews(filtersWithoutComment);

        expect(mockPrisma.review.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              comment: null
            })
          })
        );
      });

      it('should handle pagination correctly', async () => {
        const page = 2;
        const limit = 5;

        (mockPrisma.review.findMany as jest.Mock).mockResolvedValue([]);
        (mockPrisma.review.count as jest.Mock).mockResolvedValue(10);

        const result = await reviewService.getAllReviews({}, page, limit);

        expect(mockPrisma.review.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            skip: 5, // (page - 1) * limit = (2 - 1) * 5 = 5
            take: 5
          })
        );

        expect(result.page).toBe(2);
        expect(result.limit).toBe(5);
        expect(result.totalPages).toBe(2); // Math.ceil(10 / 5) = 2
      });
    });

    describe('review moderation functionality', () => {
      it('should allow admin to delete inappropriate reviews', async () => {
        const reviewId = 'inappropriate-review-123';
        const doctorId = 'doctor-123';

        (mockPrisma.review.findUnique as jest.Mock).mockResolvedValue({
          id: reviewId,
          doctorId: doctorId
        } as any);
        
        (mockPrisma.review.delete as jest.Mock).mockResolvedValue({} as any);
        
        // Mock remaining reviews after deletion
        (mockPrisma.review.findMany as jest.Mock).mockResolvedValue([
          { rating: 4 },
          { rating: 5 }
        ]);
        (mockPrisma.doctorProfile.update as jest.Mock).mockResolvedValue({} as any);

        await reviewService.deleteReview(reviewId);

        expect(mockPrisma.review.delete).toHaveBeenCalledWith({
          where: { id: reviewId }
        });
        
        // Verify doctor rating is recalculated after moderation
        expect(mockPrisma.doctorProfile.update).toHaveBeenCalledWith({
          where: { id: doctorId },
          data: {
            rating: 4.5, // (4+5)/2 = 4.5
            totalReviews: 2
          }
        });
      });

      it('should maintain data integrity when moderating reviews', async () => {
        const reviewId = 'review-to-moderate';
        const doctorId = 'doctor-123';

        // Mock review exists
        (mockPrisma.review.findUnique as jest.Mock).mockResolvedValue({
          id: reviewId,
          doctorId: doctorId,
          rating: 1 // Low rating being removed
        } as any);
        
        (mockPrisma.review.delete as jest.Mock).mockResolvedValue({} as any);
        
        // Mock remaining reviews after moderation (higher ratings remain)
        (mockPrisma.review.findMany as jest.Mock).mockResolvedValue([
          { rating: 4 },
          { rating: 5 },
          { rating: 4 }
        ]);
        (mockPrisma.doctorProfile.update as jest.Mock).mockResolvedValue({} as any);

        await reviewService.deleteReview(reviewId);

        // Verify the doctor's rating improves after removing the low rating
        expect(mockPrisma.doctorProfile.update).toHaveBeenCalledWith({
          where: { id: doctorId },
          data: {
            rating: 4.33, // (4+5+4)/3 = 4.33
            totalReviews: 3
          }
        });
      });
    });
  });
});