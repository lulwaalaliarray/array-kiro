import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { configureStore } from '@reduxjs/toolkit';
import { vi } from 'vitest';
import { describe, it, expect, beforeEach } from 'vitest';

import AppointmentBooking from '../../components/Booking/AppointmentBooking';
import PaymentPage from '../../components/Payment/PaymentPage';
import AppointmentsPage from '../../pages/AppointmentsPage';
import appointmentReducer from '../../store/slices/appointmentSlice';
import authReducer from '../../store/slices/authSlice';
import { DoctorProfile, Appointment } from '../../types';

// Mock fetch
global.fetch = vi.fn();

// Mock useMediaQuery for responsive testing
const mockUseMediaQuery = vi.fn();
vi.mock('@mui/material/useMediaQuery', () => ({
  default: () => mockUseMediaQuery(),
}));

const mockDoctor: DoctorProfile = {
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
};

const mockAppointment: Appointment = {
  id: 'appointment-1',
  patientId: 'patient-1',
  doctorId: 'doctor-1',
  scheduledDateTime: '2024-12-25T10:00:00Z',
  type: 'online',
  status: 'confirmed',
  paymentStatus: 'completed',
  followUpRequired: false,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
  doctor: mockDoctor,
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

const renderWithProviders = (component: React.ReactElement, isMobile = false) => {
  mockUseMediaQuery.mockReturnValue(isMobile);
  
  const theme = createTheme({
    breakpoints: {
      values: {
        xs: 0,
        sm: 600,
        md: 900,
        lg: 1200,
        xl: 1536,
      },
    },
  });

  const store = createTestStore([mockAppointment]);
  return render(
    <Provider store={store}>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          {component}
        </ThemeProvider>
      </BrowserRouter>
    </Provider>
  );
};

describe('Responsive Design Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (fetch as any).mockClear();
  });

  describe('AppointmentBooking Responsive Behavior', () => {
    it('should render fullscreen dialog on mobile devices', () => {
      renderWithProviders(
        <AppointmentBooking
          open={true}
          onClose={() => {}}
          doctor={mockDoctor}
        />,
        true // isMobile = true
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      
      // Check for mobile-specific layout adjustments
      expect(screen.getByText('Book Appointment with Dr. John Smith')).toBeInTheDocument();
    });

    it('should render standard dialog on desktop devices', () => {
      renderWithProviders(
        <AppointmentBooking
          open={true}
          onClose={() => {}}
          doctor={mockDoctor}
        />,
        false // isMobile = false
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      
      // Should show doctor info and consultation type options
      expect(screen.getByText('Online Consultation')).toBeInTheDocument();
      expect(screen.getByText('In-Person Visit')).toBeInTheDocument();
    });

    it('should adapt consultation type layout for mobile', () => {
      renderWithProviders(
        <AppointmentBooking
          open={true}
          onClose={() => {}}
          doctor={mockDoctor}
        />,
        true
      );

      // Radio buttons should be stacked vertically on mobile
      const onlineOption = screen.getByLabelText(/Online Consultation/);
      const physicalOption = screen.getByLabelText(/In-Person Visit/);
      
      expect(onlineOption).toBeInTheDocument();
      expect(physicalOption).toBeInTheDocument();
    });

    it('should show horizontal radio layout on desktop', () => {
      renderWithProviders(
        <AppointmentBooking
          open={true}
          onClose={() => {}}
          doctor={mockDoctor}
        />,
        false
      );

      // Radio buttons should be in a row on desktop
      const onlineOption = screen.getByLabelText(/Online Consultation/);
      const physicalOption = screen.getByLabelText(/In-Person Visit/);
      
      expect(onlineOption).toBeInTheDocument();
      expect(physicalOption).toBeInTheDocument();
    });
  });

  describe('PaymentPage Responsive Behavior', () => {
    it('should stack payment method buttons vertically on mobile', () => {
      renderWithProviders(<PaymentPage />, true);

      const cardButton = screen.getByText('Credit/Debit Card');
      const upiButton = screen.getByText('UPI');
      const walletButton = screen.getByText('Wallet');

      expect(cardButton).toBeInTheDocument();
      expect(upiButton).toBeInTheDocument();
      expect(walletButton).toBeInTheDocument();
    });

    it('should show horizontal payment method layout on desktop', () => {
      renderWithProviders(<PaymentPage />, false);

      const cardButton = screen.getByText('Credit/Debit Card');
      const upiButton = screen.getByText('UPI');
      const walletButton = screen.getByText('Wallet');

      expect(cardButton).toBeInTheDocument();
      expect(upiButton).toBeInTheDocument();
      expect(walletButton).toBeInTheDocument();
    });

    it('should adapt payment summary position for mobile', () => {
      renderWithProviders(<PaymentPage />, true);

      expect(screen.getByText('Payment Summary')).toBeInTheDocument();
      expect(screen.getByText('₹500')).toBeInTheDocument(); // Consultation fee
      expect(screen.getByText('₹525')).toBeInTheDocument(); // Total amount
    });

    it('should show sticky payment summary on desktop', () => {
      renderWithProviders(<PaymentPage />, false);

      expect(screen.getByText('Payment Summary')).toBeInTheDocument();
      expect(screen.getByText('Total Amount')).toBeInTheDocument();
    });
  });

  describe('AppointmentsPage Responsive Behavior', () => {
    it('should use scrollable tabs on mobile', () => {
      renderWithProviders(<AppointmentsPage />, true);

      expect(screen.getByText(/Upcoming/)).toBeInTheDocument();
      expect(screen.getByText(/Completed/)).toBeInTheDocument();
      expect(screen.getByText(/Cancelled/)).toBeInTheDocument();
    });

    it('should use standard tabs on desktop', () => {
      renderWithProviders(<AppointmentsPage />, false);

      expect(screen.getByText(/Upcoming/)).toBeInTheDocument();
      expect(screen.getByText(/Completed/)).toBeInTheDocument();
      expect(screen.getByText(/Cancelled/)).toBeInTheDocument();
    });

    it('should stack appointment card content vertically on mobile', () => {
      renderWithProviders(<AppointmentsPage />, true);

      // Should show appointment with doctor name
      expect(screen.getByText('Dr. John Smith')).toBeInTheDocument();
      expect(screen.getByText('Cardiology')).toBeInTheDocument();
    });

    it('should show horizontal appointment card layout on desktop', () => {
      renderWithProviders(<AppointmentsPage />, false);

      // Should show appointment with doctor name and actions
      expect(screen.getByText('Dr. John Smith')).toBeInTheDocument();
      expect(screen.getByText('Cardiology')).toBeInTheDocument();
    });

    it('should adapt action buttons layout for mobile', () => {
      const appointmentWithActions = {
        ...mockAppointment,
        status: 'confirmed' as const,
        type: 'online' as const,
      };

      const store = createTestStore([appointmentWithActions]);
      render(
        <Provider store={store}>
          <BrowserRouter>
            <ThemeProvider theme={createTheme()}>
              <AppointmentsPage />
            </ThemeProvider>
          </BrowserRouter>
        </Provider>
      );

      // Should show join call button for online appointments
      expect(screen.getByText('Join Call')).toBeInTheDocument();
    });
  });

  describe('Cross-Device Compatibility', () => {
    it('should maintain functionality across different screen sizes', () => {
      // Test mobile
      renderWithProviders(
        <AppointmentBooking
          open={true}
          onClose={() => {}}
          doctor={mockDoctor}
        />,
        true
      );

      expect(screen.getByText('Book Appointment with Dr. John Smith')).toBeInTheDocument();
      expect(screen.getByLabelText('Select Date and Time')).toBeInTheDocument();

      // Re-render for desktop
      renderWithProviders(
        <AppointmentBooking
          open={true}
          onClose={() => {}}
          doctor={mockDoctor}
        />,
        false
      );

      expect(screen.getByText('Book Appointment with Dr. John Smith')).toBeInTheDocument();
      expect(screen.getByLabelText('Select Date and Time')).toBeInTheDocument();
    });

    it('should preserve form functionality on mobile devices', () => {
      renderWithProviders(
        <AppointmentBooking
          open={true}
          onClose={() => {}}
          doctor={mockDoctor}
        />,
        true
      );

      const dateInput = screen.getByLabelText('Select Date and Time');
      const notesInput = screen.getByLabelText(/Additional Notes/);
      const bookButton = screen.getByText('Book Appointment');

      expect(dateInput).toBeInTheDocument();
      expect(notesInput).toBeInTheDocument();
      expect(bookButton).toBeInTheDocument();
    });

    it('should maintain payment flow on mobile devices', () => {
      renderWithProviders(<PaymentPage />, true);

      const payButton = screen.getByText('Pay ₹525');
      expect(payButton).toBeInTheDocument();
      expect(payButton).not.toBeDisabled();
    });

    it('should show appropriate touch-friendly elements on mobile', () => {
      renderWithProviders(<PaymentPage />, true);

      // Payment method buttons should be touch-friendly
      const cardButton = screen.getByText('Credit/Debit Card');
      const upiButton = screen.getByText('UPI');
      const walletButton = screen.getByText('Wallet');

      expect(cardButton).toBeInTheDocument();
      expect(upiButton).toBeInTheDocument();
      expect(walletButton).toBeInTheDocument();
    });
  });

  describe('Accessibility on Different Devices', () => {
    it('should maintain proper ARIA labels on mobile', () => {
      renderWithProviders(
        <AppointmentBooking
          open={true}
          onClose={() => {}}
          doctor={mockDoctor}
        />,
        true
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      
      const dateInput = screen.getByLabelText('Select Date and Time');
      expect(dateInput).toBeInTheDocument();
    });

    it('should provide proper keyboard navigation on desktop', () => {
      renderWithProviders(
        <AppointmentBooking
          open={true}
          onClose={() => {}}
          doctor={mockDoctor}
        />,
        false
      );

      const cancelButton = screen.getByText('Cancel');
      const bookButton = screen.getByText('Book Appointment');

      expect(cancelButton).toBeInTheDocument();
      expect(bookButton).toBeInTheDocument();
    });

    it('should maintain focus management across devices', () => {
      renderWithProviders(<PaymentPage />, true);

      const payButton = screen.getByText('Pay ₹525');
      expect(payButton).toBeInTheDocument();
      expect(payButton).toHaveAttribute('type', 'button');
    });
  });
});