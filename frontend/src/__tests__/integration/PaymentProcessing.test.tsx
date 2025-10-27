import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { configureStore } from '@reduxjs/toolkit';
import { vi } from 'vitest';
import { describe, it, expect, beforeEach } from 'vitest';

import PaymentPage from '../../components/Payment/PaymentPage';
import appointmentReducer from '../../store/slices/appointmentSlice';
import authReducer from '../../store/slices/authSlice';
import { theme } from '../../utils/theme';
import { Appointment } from '../../types';

// Mock fetch
global.fetch = vi.fn();

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockAppointment: Appointment = {
  id: 'appointment-1',
  patientId: 'patient-1',
  doctorId: 'doctor-1',
  scheduledDateTime: '2024-12-25T10:00:00Z',
  type: 'online',
  status: 'payment_pending',
  paymentStatus: 'pending',
  followUpRequired: false,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
  doctor: {
    userId: 'doctor-1',
    name: 'John Smith',
    profilePicture: 'doctor.jpg',
    medicalLicenseNumber: 'MD123456',
    licenseVerificationStatus: 'verified',
    qualifications: ['MBBS', 'MD'],
    yearsOfExperience: 10,
    specializations: ['Cardiology'],
    contactInfo: {
      phone: '+1234567890',
    },
    clinicInfo: {
      name: 'Heart Care Clinic',
      address: {
        street: '123 Medical St',
        city: 'Healthcare City',
        state: 'Medical State',
        zipCode: '12345',
        country: 'USA',
      },
      contactInfo: {
        phone: '+1234567890',
      },
      facilities: ['ECG'],
    },
    consultationFee: 500,
    rating: 4.5,
    totalReviews: 100,
    isAcceptingPatients: true,
  },
};

const createTestStore = (appointments: Appointment[] = []) => {
  return configureStore({
    reducer: {
      appointments: appointmentReducer,
      auth: authReducer,
    },
    preloadedState: {
      auth: {
        user: {
          id: 'patient-1',
          email: 'patient@example.com',
          role: 'patient',
          isVerified: true,
          isActive: true,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
          profile: {
            userId: 'patient-1',
            name: 'Jane Doe',
            age: 30,
            gender: 'female',
            contactInfo: { phone: '+1234567890' },
            address: {
              street: '456 Patient St',
              city: 'Patient City',
              state: 'Patient State',
              zipCode: '54321',
              country: 'USA',
            },
          },
        },
        token: 'mock-token',
        isLoading: false,
        error: null,
        isAuthenticated: true,
      },
      appointments: {
        appointments,
        currentAppointment: null,
        isLoading: false,
        error: null,
      },
    },
  });
};

const renderWithProviders = (component: React.ReactElement, initialEntries = ['/payment/appointment-1']) => {
  const store = createTestStore([mockAppointment]);
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={initialEntries}>
        <ThemeProvider theme={theme}>
          {component}
        </ThemeProvider>
      </MemoryRouter>
    </Provider>
  );
};

describe('PaymentProcessing Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (fetch as any).mockClear();
    mockNavigate.mockClear();
  });

  it('should render payment page with appointment details', () => {
    renderWithProviders(<PaymentPage />);

    expect(screen.getByText('Complete Payment')).toBeInTheDocument();
    expect(screen.getByText('Appointment Details')).toBeInTheDocument();
    expect(screen.getByText('Dr. John Smith')).toBeInTheDocument();
    expect(screen.getByText('Cardiology')).toBeInTheDocument();
    expect(screen.getByText('Heart Care Clinic')).toBeInTheDocument();
  });

  it('should display payment summary with correct calculations', () => {
    renderWithProviders(<PaymentPage />);

    expect(screen.getByText('Payment Summary')).toBeInTheDocument();
    expect(screen.getByText('₹500')).toBeInTheDocument(); // Consultation fee
    expect(screen.getByText('₹25')).toBeInTheDocument(); // Platform fee (5%)
    expect(screen.getByText('₹525')).toBeInTheDocument(); // Total amount
  });

  it('should allow selecting different payment methods', () => {
    renderWithProviders(<PaymentPage />);

    const cardButton = screen.getByText('Credit/Debit Card');
    const upiButton = screen.getByText('UPI');
    const walletButton = screen.getByText('Wallet');

    // Card should be selected by default
    expect(cardButton).toHaveClass('MuiButton-contained');
    expect(upiButton).toHaveClass('MuiButton-outlined');
    expect(walletButton).toHaveClass('MuiButton-outlined');

    // Select UPI
    fireEvent.click(upiButton);
    expect(upiButton).toHaveClass('MuiButton-contained');
    expect(cardButton).toHaveClass('MuiButton-outlined');

    // Select Wallet
    fireEvent.click(walletButton);
    expect(walletButton).toHaveClass('MuiButton-contained');
    expect(upiButton).toHaveClass('MuiButton-outlined');
  });

  it('should process payment successfully', async () => {
    // Mock payment intent creation
    (fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'payment-intent-1',
          clientSecret: 'pi_test_123',
        }),
      })
      // Mock payment processing
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'payment-1',
          status: 'completed',
        }),
      });

    renderWithProviders(<PaymentPage />);

    const payButton = screen.getByText('Pay ₹525');
    fireEvent.click(payButton);

    // Should show processing state
    await waitFor(() => {
      expect(screen.getByText('Processing Payment...')).toBeInTheDocument();
    });

    // Should call payment APIs
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token',
        },
        body: JSON.stringify({
          appointmentId: 'appointment-1',
          amount: 500,
          currency: 'INR',
          paymentMethod: 'card',
        }),
      });
    });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/payments/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token',
        },
        body: JSON.stringify({
          paymentIntentId: 'payment-intent-1',
          appointmentId: 'appointment-1',
        }),
      });
    });

    // Should navigate to appointments page with success message
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/appointments', {
        state: { message: 'Payment successful! Your appointment is confirmed.' }
      });
    });
  });

  it('should handle payment creation errors', async () => {
    (fetch as any).mockRejectedValueOnce(new Error('Payment failed'));

    renderWithProviders(<PaymentPage />);

    const payButton = screen.getByText('Pay ₹525');
    fireEvent.click(payButton);

    await waitFor(() => {
      expect(screen.getByText('Payment failed')).toBeInTheDocument();
    });
  });

  it('should handle payment processing errors', async () => {
    // Mock successful intent creation but failed processing
    (fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'payment-intent-1' }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
      });

    renderWithProviders(<PaymentPage />);

    const payButton = screen.getByText('Pay ₹525');
    fireEvent.click(payButton);

    await waitFor(() => {
      expect(screen.getByText('Payment processing failed')).toBeInTheDocument();
    });
  });

  it('should show already paid state for completed payments', () => {
    const completedAppointment = {
      ...mockAppointment,
      paymentStatus: 'completed' as const,
    };

    const store = createTestStore([completedAppointment]);
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/payment/appointment-1']}>
          <ThemeProvider theme={theme}>
            <PaymentPage />
          </ThemeProvider>
        </MemoryRouter>
      </Provider>
    );

    expect(screen.getByText('Payment Already Completed')).toBeInTheDocument();
    expect(screen.getByText('This appointment has already been paid for.')).toBeInTheDocument();
    expect(screen.getByText('View Appointments')).toBeInTheDocument();
  });

  it('should display security information', () => {
    renderWithProviders(<PaymentPage />);

    expect(screen.getByText(/Your payment information is encrypted and secure/)).toBeInTheDocument();
    expect(screen.getByText(/industry-standard security measures/)).toBeInTheDocument();
  });

  it('should show payment constraints and policies', () => {
    renderWithProviders(<PaymentPage />);

    expect(screen.getByText(/Payment must be completed at least 15 minutes/)).toBeInTheDocument();
    expect(screen.getByText(/Refunds are available if cancelled 24 hours in advance/)).toBeInTheDocument();
  });

  it('should fetch appointment details if not in store', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockAppointment,
    });

    const store = createTestStore([]); // Empty appointments array
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/payment/appointment-1']}>
          <ThemeProvider theme={theme}>
            <PaymentPage />
          </ThemeProvider>
        </MemoryRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/appointments/appointment-1', {
        headers: {
          'Authorization': 'Bearer mock-token',
        },
      });
    });
  });

  it('should handle appointment fetch errors', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    const store = createTestStore([]);
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/payment/appointment-1']}>
          <ThemeProvider theme={theme}>
            <PaymentPage />
          </ThemeProvider>
        </MemoryRouter>
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load appointment details')).toBeInTheDocument();
    });
  });
});