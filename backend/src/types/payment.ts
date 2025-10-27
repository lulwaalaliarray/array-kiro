export interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: string;
}

export interface PaymentData {
  appointmentId: string;
  amount: number;
  currency: string;
  paymentMethodId?: string;
  customerId?: string;
}

export interface PaymentResult {
  success: boolean;
  paymentId: string;
  status: string;
  message?: string;
}

export interface RefundResult {
  success: boolean;
  refundId: string;
  amount: number;
  status: string;
  message?: string;
}

export interface EarningsReport {
  doctorId: string;
  totalEarnings: number;
  totalAppointments: number;
  period: {
    startDate: Date;
    endDate: Date;
  };
  monthlyBreakdown: MonthlyEarnings[];
}

export interface MonthlyEarnings {
  month: string;
  year: number;
  earnings: number;
  appointmentCount: number;
}

export interface PaymentHistory {
  id: string;
  appointmentId: string;
  amount: number;
  currency: string;
  status: string;
  processedAt?: Date;
  refundedAt?: Date;
  refundReason?: string;
  createdAt: Date;
  appointment?: {
    id: string;
    scheduledDateTime: Date;
    type: string;
    patient?: {
      name: string;
    };
    doctor?: {
      name: string;
    };
  };
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface WebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
}