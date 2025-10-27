export interface User {
  id: string;
  email: string;
  role: 'patient' | 'doctor' | 'admin';
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  profile: PatientProfile | DoctorProfile | AdminProfile;
}

export interface PatientProfile {
  userId: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  contactInfo: ContactInfo;
  address: Address;
  emergencyContact?: ContactInfo;
}

export interface DoctorProfile {
  userId: string;
  name: string;
  profilePicture?: string;
  medicalLicenseNumber: string;
  licenseVerificationStatus: 'pending' | 'verified' | 'rejected';
  qualifications: string[];
  yearsOfExperience: number;
  specializations: string[];
  contactInfo: ContactInfo;
  clinicInfo: ClinicInfo;
  consultationFee: number;
  rating: number;
  totalReviews: number;
  isAcceptingPatients: boolean;
}

export interface AdminProfile {
  userId: string;
  name: string;
  contactInfo: ContactInfo;
}

export interface ContactInfo {
  phone: string;
  email?: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface ClinicInfo {
  name: string;
  address: Address;
  contactInfo: ContactInfo;
  facilities: string[];
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  patient?: PatientProfile;
  doctor?: DoctorProfile;
  scheduledDateTime: string;
  type: 'online' | 'physical';
  status: AppointmentStatus;
  paymentId?: string;
  paymentStatus: PaymentStatus;
  zoomMeetingId?: string;
  consultationNotes?: string;
  followUpRequired: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AppointmentStatus = 
  | 'awaiting_acceptance' 
  | 'rejected' 
  | 'payment_pending' 
  | 'confirmed' 
  | 'completed' 
  | 'cancelled';

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface Payment {
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  transactionId: string;
  processedAt?: string;
  refundedAt?: string;
  refundReason?: string;
}

export interface Review {
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  data?: Record<string, any>;
}

export type NotificationType = 
  | 'appointment_booked' 
  | 'appointment_accepted' 
  | 'appointment_rejected'
  | 'payment_confirmed' 
  | 'appointment_reminder' 
  | 'meeting_link_ready';

export interface SearchFilters {
  specialization?: string;
  location?: string;
  rating?: number;
  consultationFee?: {
    min: number;
    max: number;
  };
  availability?: string;
  distance?: number;
}

export interface DoctorSearchResult extends DoctorProfile {
  distance?: number;
  nextAvailableSlot?: string;
}