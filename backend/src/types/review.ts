import { Review } from '@prisma/client';

// Extended review with relationships
export interface ReviewWithDetails extends Review {
  patient: {
    id: string;
    name: string;
  };
  doctor: {
    id: string;
    name: string;
    specializations: string[];
  };
  appointment: {
    id: string;
    scheduledDateTime: Date;
    type: string;
  };
}

// Review request interfaces
export interface ReviewRequest {
  appointmentId: string;
  rating: number; // 1-5 stars
  comment?: string;
}

export interface ReviewResponse {
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  rating: number;
  comment?: string;
  createdAt: Date;
}

// Review filters for querying
export interface ReviewFilters {
  doctorId?: string;
  patientId?: string;
  rating?: number;
  minRating?: number;
  maxRating?: number;
  startDate?: Date;
  endDate?: Date;
  hasComment?: boolean;
}

// Review statistics
export interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    [key: number]: number; // rating -> count
  };
}

// Doctor rating update
export interface DoctorRatingUpdate {
  doctorId: string;
  newAverageRating: number;
  totalReviews: number;
}

// Review moderation
export interface ReviewModerationAction {
  reviewId: string;
  action: 'approve' | 'reject' | 'flag';
  reason?: string;
  moderatorId: string;
}

// Validation result
export interface ReviewValidationResult {
  isValid: boolean;
  errors: string[];
}

// Paginated review result
export interface PaginatedReviewResult {
  reviews: ReviewWithDetails[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}