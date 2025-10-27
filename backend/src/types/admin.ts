import { UserRole, AppointmentStatus, PaymentStatus } from '@prisma/client';

// Admin dashboard analytics interfaces
export interface SystemAnalytics {
  users: UserAnalytics;
  appointments: AppointmentAnalytics;
  payments: PaymentAnalytics;
  ratings: RatingAnalytics;
}

export interface UserAnalytics {
  totalUsers: number;
  usersByRole: Record<UserRole, number>;
  newUsersThisMonth: number;
  activeUsers: number;
  pendingVerifications: number;
}

export interface AppointmentAnalytics {
  totalAppointments: number;
  appointmentsByStatus: Record<AppointmentStatus, number>;
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
  paymentsByStatus: Record<PaymentStatus, number>;
  monthlyRevenue: MonthlyRevenue[];
}

export interface RatingAnalytics {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>; // rating (1-5) -> count
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
  role?: UserRole;
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
  role: UserRole;
  isActive: boolean;
  isVerified: boolean;
  createdAt: Date;
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
  profilePicture?: string | undefined;
  licenseVerified: boolean;
  createdAt: Date;
  submittedDocuments?: string[] | undefined;
}

export interface DoctorVerificationAction {
  doctorId: string;
  action: 'approve' | 'reject';
  adminNotes?: string | undefined;
}

// Payment transaction monitoring interfaces
export interface PaymentTransactionFilters {
  status?: PaymentStatus;
  dateFrom?: Date;
  dateTo?: Date;
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
  status: PaymentStatus;
  createdAt: Date;
  processedAt?: Date | undefined;
  refundedAt?: Date | undefined;
  refundReason?: string | undefined;
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
    scheduledDateTime: Date;
    type: string;
    status: AppointmentStatus;
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

// Dispute resolution interfaces
export interface DisputeCase {
  id: string;
  type: 'payment_dispute' | 'service_complaint' | 'refund_request' | 'other';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  subject: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  reporter: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
  relatedAppointment?: {
    id: string;
    scheduledDateTime: Date;
    doctor: { name: string };
    patient: { name: string };
  };
  relatedPayment?: {
    id: string;
    amount: number;
    status: PaymentStatus;
  };
  assignedAdmin?: {
    id: string;
    name: string;
  };
  resolution?: string;
  resolvedAt?: Date;
}

export interface DisputeFilters {
  type?: string;
  status?: string;
  priority?: string;
  assignedAdminId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'priority';
  sortOrder?: 'asc' | 'desc';
}

export interface DisputeAction {
  disputeId: string;
  action: 'assign' | 'update_status' | 'add_note' | 'resolve';
  assignedAdminId?: string;
  status?: string;
  priority?: string;
  notes?: string;
  resolution?: string;
}

// Support ticket interfaces
export interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  category: 'technical' | 'billing' | 'account' | 'appointment' | 'other';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
  assignedAdmin?: {
    id: string;
    name: string;
  };
  messages: SupportMessage[];
}

export interface SupportMessage {
  id: string;
  content: string;
  createdAt: Date;
  sender: {
    id: string;
    name: string;
    role: UserRole;
  };
  attachments?: string[];
}

export interface SupportTicketFilters {
  category?: string;
  status?: string;
  priority?: string;
  assignedAdminId?: string;
  userId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'priority';
  sortOrder?: 'asc' | 'desc';
}

// Admin activity log interfaces
export interface AdminActivity {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  resourceType: 'user' | 'appointment' | 'payment' | 'dispute' | 'ticket';
  resourceId: string;
  details: Record<string, any>;
  createdAt: Date;
}

export interface AdminActivityFilters {
  adminId?: string;
  action?: string;
  resourceType?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
}

// System configuration interfaces
export interface SystemConfiguration {
  appointmentSettings: {
    minAdvanceBookingHours: number;
    maxAdvanceBookingHours: number;
    defaultAppointmentDuration: number;
    businessHours: {
      start: string;
      end: string;
    };
    workingDays: number[];
  };
  paymentSettings: {
    paymentTimeoutMinutes: number;
    refundPolicy: string;
    platformFeePercentage: number;
  };
  notificationSettings: {
    reminderTimes: number[];
    enableEmailNotifications: boolean;
    enablePushNotifications: boolean;
  };
}