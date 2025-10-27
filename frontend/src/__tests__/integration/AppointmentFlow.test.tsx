import { screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { describe, it, expect, beforeEach } from 'vitest';

import AppointmentBooking from '../../components/Booking/AppointmentBooking';
import PaymentPage from '../../components/Payment/PaymentPage';
import AppointmentsPage from '../../pages/AppointmentsPage';
import { 
  renderWithProviders, 
  createMockUser, 
  createMockAppointment,
  mockFetchSuccess,
  TEST_APPOINTMENT_DATA,
  TEST_PAYMENT_DATA 
} from '../utils/test-utils';
import { DoctorProfile } from '../../types';

// Mock fetch
global.fetch = vi.fn();

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ appointmentId: 'appointment-1' }),
  };
});

const mockDoctor: DoctorProfile = {
  userId: 'doctor-1',
  name: 'Dr. Sarah Johnson',
  profilePicture: 'doctor.jpg',
  medicalLicenseNumber: 'MD789012',
  licenseVerificationStatus: 'verified',
  qualifications: ['MBBS', 'MD Cardiology'],
  yearsOfExperience: 15,
  specializations: ['Cardiology', 'Internal Medicine'],
  contactInfo: {
    phone: '+1234567890',
    email: 'dr.johnson@example.com',
  },
  clinicInfo: {
    name: 'Advanced Heart Care Center',
    address: {
      street: '456 Medical Plaza',
      city: 'Healthcare City',
      state: 'Medical State',
      zipCode: '54321',
      country: 'USA',
    },
    contactInfo: {
      phone: '+1234567890',
    },
    facilities: ['ECG', 'Echocardiogram', 'Stress Test'],
  },
  consultationFee: 750,
  rating: 4.8,
  totalReviews: 250,
  isAcceptingPatients: true,
};

describe('Complete Appointment Booking Flow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (fetch as any).mockClear();
    mockNavigate.mockClear();
  });

  it('should complete the full appointment booking to payment flow', async () => {
    const mockUser = createMockUser({ role: 'patient' });
    
    // Mock appointment creation
    const createdAppointment = createMockAppointment({
      status: 'awaiting_acceptance',
      paymentStatus: 'pending',
      doctor: mockDoctor,
    });

    (fetch as any).mockResolvedValueOnce(mockFetchSuccess(createdAppointment));

    const mockOnClose = vi.fn();
    
    // Step 1: Render appointment booking dialog
    renderWithProviders(
      <AppointmentBooking
        open={true}
        onClose={mockOnClose}
        doctor={mockDoctor}
      />,
      {
        preloadedState: {
          auth: {
            user: mockUser,
            token: 'mock-token',
            isLoading: false,
            error: null,
            isAuthenticated: true,
          },
          appointments: {
            appointments: [],
            currentAppointment: null,
            isLoading: false,
            error: null,
          },
        },
      }
    );

    // Verify doctor information is displayed
    expect(screen.getByText('Book Appointment with Dr. Sarah Johnson')).toBeInTheDocument();
    expect(screen.getByText('Cardiology, Internal Medicine')).toBeInTheDocument();
    expect(screen.getByText('₹750')).toBeInTheDocument();

    // Step 2: Fill out appointment form
    const futureDate = new Date();
    futureDate.setHours(futureDate.getHours() + 25);
    
    const dateInput = screen.getByLabelText('Select Date and Time');
    fireEvent.change(dateInput, {
      target: { value: futureDate.toISOString().slice(0, 16) }
    });

    const notesInput = screen.getByLabelText(/Additional Notes/);
    fireEvent.change(notesInput, {
      target: { value: 'Experiencing chest pain and shortness of breath' }
    });

    // Step 3: Submit appointment
    const bookButton = screen.getByText('Book Appointment');
    fireEvent.click(bookButton);

    // Verify appointment creation API call
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token',
        },
        body: JSON.stringify({
          doctorId: 'doctor-1',
          scheduledDateTime: futureDate.toISOString(),
          type: 'online',
          notes: 'Experiencing chest pain and shortness of breath',
        }),
      });
    });

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('should handle doctor acceptance and payment flow', async () => {
    const mockUser = createMockUser({ role: 'patient' });
    
    // Mock appointment with payment pending status
    const appointmentWithPaymentPending = createMockAppointment({
      status: 'payment_pending',
      paymentStatus: 'pending',
      doctor: mockDoctor,
    });

    // Mock payment intent creation and processing
    (fetch as any)
      .mockResolvedValueOnce(mockFetchSuccess({
        id: 'payment-intent-1',
        clientSecret: 'pi_test_123',
      }))
      .mockResolvedValueOnce(mockFetchSuccess({
        id: 'payment-1',
        status: 'completed',
      }));

    // Render payment page
    renderWithProviders(<PaymentPage />, {
      preloadedState: {
        auth: {
          user: mockUser,
          token: 'mock-token',
          isLoading: false,
          error: null,
          isAuthenticated: true,
        },
        appointments: {
          appointments: [appointmentWithPaymentPending],
          currentAppointment: appointmentWithPaymentPending,
          isLoading: false,
          error: null,
        },
      },
    });

    // Verify payment page displays appointment details
    expect(screen.getByText('Complete Payment')).toBeInTheDocument();
    expect(screen.getByText('Dr. Sarah Johnson')).toBeInTheDocument();
    expect(screen.getByText('₹750')).toBeInTheDocument(); // Consultation fee
    expect(screen.getByText('₹38')).toBeInTheDocument(); // Platform fee (5%)
    expect(screen.getByText('₹788')).toBeInTheDocument(); // Total amount

    // Select payment method
    const upiButton = screen.getByText('UPI');
    fireEvent.click(upiButton);

    // Process payment
    const payButton = screen.getByText('Pay ₹788');
    fireEvent.click(payButton);

    // Verify payment processing
    await waitFor(() => {
      expect(screen.getByText('Processing Payment...')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token',
        },
        body: JSON.stringify({
          appointmentId: 'appointment-1',
          amount: 750,
          currency: 'INR',
          paymentMethod: 'upi',
        }),
      });
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/appointments', {
        state: { message: 'Payment successful! Your appointment is confirmed.' }
      });
    });
  });

  it('should display confirmed appointment in appointments list', async () => {
    const mockUser = createMockUser({ role: 'patient' });
    
    // Mock confirmed appointment
    const confirmedAppointment = createMockAppointment({
      status: 'confirmed',
      paymentStatus: 'completed',
      type: 'online',
      doctor: mockDoctor,
    });

    // Mock fetch appointments API
    (fetch as any).mockResolvedValueOnce(mockFetchSuccess([confirmedAppointment]));

    renderWithProviders(<AppointmentsPage />, {
      preloadedState: {
        auth: {
          user: mockUser,
          token: 'mock-token',
          isLoading: false,
          error: null,
          isAuthenticated: true,
        },
        appointments: {
          appointments: [confirmedAppointment],
          currentAppointment: null,
          isLoading: false,
          error: null,
        },
      },
    });

    // Verify appointment is displayed in upcoming tab
    expect(screen.getByText('My Appointments')).toBeInTheDocument();
    expect(screen.getByText('Dr. Sarah Johnson')).toBeInTheDocument();
    expect(screen.getByText('Cardiology, Internal Medicine')).toBeInTheDocument();
    expect(screen.getByText('Confirmed')).toBeInTheDocument();

    // Verify join call button for online appointment
    expect(screen.getByText('Join Call')).toBeInTheDocument();
  });

  it('should handle appointment cancellation flow', async () => {
    const mockUser = createMockUser({ role: 'patient' });
    
    // Mock confirmed appointment that can be cancelled
    const cancellableAppointment = createMockAppointment({
      status: 'confirmed',
      paymentStatus: 'completed',
      doctor: mockDoctor,
    });

    // Mock cancellation API
    const cancelledAppointment = { ...cancellableAppointment, status: 'cancelled' };
    (fetch as any).mockResolvedValueOnce(mockFetchSuccess(cancelledAppointment));

    // Mock window.confirm
    const originalConfirm = window.confirm;
    window.confirm = vi.fn(() => true);

    renderWithProviders(<AppointmentsPage />, {
      preloadedState: {
        auth: {
          user: mockUser,
          token: 'mock-token',
          isLoading: false,
          error: null,
          isAuthenticated: true,
        },
        appointments: {
          appointments: [cancellableAppointment],
          currentAppointment: null,
          isLoading: false,
          error: null,
        },
      },
    });

    // Find and click cancel button
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    // Verify cancellation API call
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/appointments/appointment-1/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token',
        },
        body: JSON.stringify({ reason: 'Cancelled by user' }),
      });
    });

    // Restore original confirm
    window.confirm = originalConfirm;
  });

  it('should handle error scenarios gracefully throughout the flow', async () => {
    const mockUser = createMockUser({ role: 'patient' });

    // Test appointment booking error
    (fetch as any).mockRejectedValueOnce(new Error('Booking failed'));

    renderWithProviders(
      <AppointmentBooking
        open={true}
        onClose={() => {}}
        doctor={mockDoctor}
      />,
      {
        preloadedState: {
          auth: {
            user: mockUser,
            token: 'mock-token',
            isLoading: false,
            error: null,
            isAuthenticated: true,
          },
          appointments: {
            appointments: [],
            currentAppointment: null,
            isLoading: false,
            error: null,
          },
        },
      }
    );

    // Set valid date and submit
    const futureDate = new Date();
    futureDate.setHours(futureDate.getHours() + 25);
    
    const dateInput = screen.getByLabelText('Select Date and Time');
    fireEvent.change(dateInput, {
      target: { value: futureDate.toISOString().slice(0, 16) }
    });

    const bookButton = screen.getByText('Book Appointment');
    fireEvent.click(bookButton);

    // Verify error is displayed
    await waitFor(() => {
      expect(screen.getByText('Booking failed')).toBeInTheDocument();
    });
  });

  it('should maintain data consistency across components', async () => {
    const mockUser = createMockUser({ role: 'patient' });
    
    const appointment = createMockAppointment({
      id: 'consistent-appointment',
      status: 'payment_pending',
      paymentStatus: 'pending',
      doctor: mockDoctor,
    });

    // Test that appointment data is consistent between payment page and appointments page
    const { store } = renderWithProviders(<PaymentPage />, {
      preloadedState: {
        auth: {
          user: mockUser,
          token: 'mock-token',
          isLoading: false,
          error: null,
          isAuthenticated: true,
        },
        appointments: {
          appointments: [appointment],
          currentAppointment: appointment,
          isLoading: false,
          error: null,
        },
      },
    });

    // Verify appointment data is displayed correctly
    expect(screen.getByText('Dr. Sarah Johnson')).toBeInTheDocument();
    expect(screen.getByText('₹750')).toBeInTheDocument();

    // Check that store state is consistent
    const state = store.getState();
    expect(state.appointments.appointments).toHaveLength(1);
    expect(state.appointments.appointments[0].id).toBe('consistent-appointment');
    expect(state.appointments.appointments[0].doctor?.name).toBe('Dr. Sarah Johnson');
  });
});