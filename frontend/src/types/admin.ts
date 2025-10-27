// Admin dashboard analytics interfaces
export interface SystemAnalytics {
  users: UserAnalytics;
  appointments: AppointmentAnalytics;
  payments: PaymentAnalytics;
  ratings: RatingAnalytics;
}

export interface UserAnalytics {
  totalUsers: number;
  usersByRole: Record<string, number>;
  newUsersThisMonth: number;
  activeUsers: number;
  pendingVerifications: number;
}

export interface AppointmentAnalytics {
  totalAppointments: number;
  appointmentsByStatus: Record<string, number>;
  appointmentsThisMonth: number;
  upcomingAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  averageAppointmentsPerDay: number;
}

export interface PaymentAnalytics {
  totalRevenue: number;
  revenueThisMonth: number;
  averageTransactionValue: number;
  totalTransactions: number;
  paymentsByStatus: Record<string, number>;
  monthlyRevenue: MonthlyRevenue[];
}

export interface RatingAnalytics {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
  topRatedDoctors: TopRatedDoctor[];
}

export interface MonthlyRevenue {
  month: string;
  year: number;
  revenue: number;
  transactionCount: number;
}

export interface TopRatedDoctor {
  id: string;
  name: string;
  specializations: string[];
  rating: number;
  totalReviews: number;
}

// User management interfaces
export interface UserManagementFilters {
  role?: string;
  isActive?: boolean;
  isVerified?: boolean;
  searchTerm?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'name' | 'email';
  sortOrder?: 'asc' | 'desc';
}

export interface UserManagementResult {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  profile: {
    name: string;
    phone?: string;
    specializations?: string[];
    licenseVerified?: boolean;
  };
}

export interface UserStatusUpdate {
  isActive?: boolean;
  isVerified?: boolean;
}

// Doctor verification interfaces
export interface DoctorVerificationDetails {
  id: string;
  name: string;
  email: string;
  phone: string;
  medicalLicenseNumber: string;
  qualifications: string[];
  yearsOfExperience: number;
  specializations: string[];
  clinicName: string;
  clinicAddress: string;
  consultationFee: number;
  profilePicture?: string;
  licenseVerified: boolean;
  createdAt: string;
  submittedDocuments?: string[];
}

export interface DoctorVerificationAction {
  doctorId: string;
  action: 'approve' | 'reject';
  adminNotes?: string;
}

// Payment transaction monitoring interfaces
export interface PaymentTransactionFilters {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  doctorId?: string;
  patientId?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'amount' | 'processedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface PaymentTransactionResult {
  id: string;
  appointmentId: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  processedAt?: string;
  refundedAt?: string;
  refundReason?: string;
  patient: {
    id: string;
    name: string;
    email: string;
  };
  doctor: {
    id: string;
    name: string;
    email: string;
  };
  appointment: {
    scheduledDateTime: string;
    type: string;
    status: string;
  };
}

export interface PaymentReconciliation {
  totalTransactions: number;
  totalAmount: number;
  completedTransactions: number;
  completedAmount: number;
  refundedTransactions: number;
  refundedAmount: number;
  pendingTransactions: number;
  pendingAmount: number;
  discrepancies: PaymentDiscrepancy[];
}

export interface PaymentDiscrepancy {
  id: string;
  type: 'missing_payment' | 'duplicate_payment' | 'amount_mismatch';
  description: string;
  appointmentId: string;
  expectedAmount?: number;
  actualAmount?: number;
}

// System health interfaces
export interface SystemHealth {
  status: string;
  timestamp: string;
  services: {
    database: string;
    redis: string;
    email: string;
    zoom: string;
    payments: string;
  };
  metrics: {
    uptime: number;
    memoryUsage: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
    };
    cpuUsage: {
      user: number;
      system: number;
    };
  };
}

// Pagination interface
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}