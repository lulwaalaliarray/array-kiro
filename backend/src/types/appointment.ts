import { Appointment, AppointmentStatus, AppointmentType, PaymentStatus } from '@prisma/client';

// Extended appointment with relationships
export interface AppointmentWithDetails extends Appointment {
  patient: {
    id: string;
    name: string;
    phone: string;
    age: number;
    gender: string;
  };
  doctor: {
    id: string;
    name: string;
    specializations: string[];
    consultationFee: number | string;
    clinicName: string;
    clinicAddress: string;
  };
  payment?: {
    id: string;
    amount: number | string;
    status: PaymentStatus;
    processedAt?: Date | null;
  } | null;
  zoomMeeting?: {
    id: string;
    meetingId: string;
    topic: string;
    startTime: Date;
    duration: number;
    hostUrl: string;
    joinUrl: string;
    password: string;
    status: string;
  } | null;
}

// Appointment request interfaces
export interface AppointmentRequest {
  doctorId: string;
  scheduledDateTime: Date;
  type: AppointmentType;
  notes?: string;
}

export interface AppointmentResponse {
  id: string;
  patientId: string;
  doctorId: string;
  scheduledDateTime: Date;
  type: AppointmentType;
  status: AppointmentStatus;
  paymentStatus: PaymentStatus;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Appointment filtering and search
export interface AppointmentFilters {
  status?: AppointmentStatus;
  type?: AppointmentType;
  dateFrom?: Date;
  dateTo?: Date;
  doctorId?: string;
  patientId?: string;
  page?: number;
  limit?: number;
  sortBy?: 'scheduledDateTime' | 'createdAt' | 'status';
  sortOrder?: 'asc' | 'desc';
}

// Appointment status update
export interface AppointmentStatusUpdate {
  status: AppointmentStatus;
  notes?: string;
}

// Appointment cancellation
export interface AppointmentCancellation {
  reason: string;
  refundRequested?: boolean;
}

// Appointment rescheduling
export interface AppointmentReschedule {
  newDateTime: Date;
  reason?: string;
}

// Business rule validation results
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Appointment availability check
export interface AvailabilityCheck {
  doctorId: string;
  dateTime: Date;
  duration?: number; // in minutes, default 30
}

export interface AvailabilityResult {
  isAvailable: boolean;
  conflictingAppointments?: string[];
  suggestedTimes?: Date[];
}

// Appointment statistics
export interface AppointmentStats {
  total: number;
  byStatus: Record<AppointmentStatus, number>;
  byType: Record<AppointmentType, number>;
  upcomingCount: number;
  completedCount: number;
}

// Doctor appointment management
export interface DoctorAppointmentSummary {
  todayAppointments: number;
  upcomingAppointments: number;
  pendingAcceptance: number;
  totalEarnings: number;
  monthlyEarnings: number;
}

// Patient appointment summary
export interface PatientAppointmentSummary {
  upcomingAppointments: number;
  completedAppointments: number;
  pendingPayments: number;
  totalSpent: number;
}

// Appointment notification data
export interface AppointmentNotificationData {
  appointmentId: string;
  patientName: string;
  doctorName: string;
  scheduledDateTime: Date;
  type: AppointmentType;
  status: AppointmentStatus;
  meetingLink?: string;
}

// Time slot interface for doctor availability
export interface TimeSlot {
  startTime: string; // HH:MM format
  endTime: string;   // HH:MM format
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  isAvailable: boolean;
}

// Appointment conflict check
export interface ConflictCheck {
  hasConflict: boolean;
  conflictingAppointments: {
    id: string;
    scheduledDateTime: Date;
    status: AppointmentStatus;
  }[];
}

export { AppointmentStatus, AppointmentType, PaymentStatus };