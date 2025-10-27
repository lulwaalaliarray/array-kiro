import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { configureStore } from '@reduxjs/toolkit';
import { vi } from 'vitest';
import { describe, it, expect, beforeEach } from 'vitest';

import AppointmentBooking from '../../components/Booking/AppointmentBooking';
import appointmentReducer from '../../store/slices/appointmentSlice';
import authReducer from '../../store/slices/authSlice';
import { theme } from '../../utils/theme';
import { DoctorProfile } from '../../types';

// Mock fetch
global.fetch = vi.fn();

const mockDoctor: DoctorProfile = {
  userId: 'doctor-1',
  name: 'John Smith',
  profilePicture: 'doctor.jpg',
  medicalLicenseNumber: 'MD123456',
  licenseVerificationStatus: 'verified',
  qualifications: ['MBBS', 'MD'],
  yearsOfExperience: 10,
  specializations: ['Cardiology', 'Internal Medicine'],
  contactInfo: {
    phone: '+1234567890',
    email: 'doctor@example.com',
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
    facilities: ['ECG', 'Echo'],
  },
  consultationFee: 500,
  rating: 4.5,
  totalReviews: 100,
  isAcceptingPatients: true,
};

const createTestStore = () => {
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
        appointments: [],
        currentAppointment: null,
        isLoading: false,
        error: null,
      },
    },
  });
};

const renderWithProviders = (component: React.ReactElement) => {
  const store = createTestStore();
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

describe('AppointmentBooking Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (fetch as any).mockClear();
  });

  it('should render appointment booking dialog with doctor information', () => {
    renderWithProviders(
      <AppointmentBooking
        open={true}
        onClose={() => {}}
        doctor={mockDoctor}
      />
    );

    expect(screen.getByText('Book Appointment with Dr. John Smith')).toBeInTheDocument();
    expect(screen.getByText('Cardiology, Internal Medicine')).toBeInTheDocument();
    expect(screen.getByText('₹500')).toBeInTheDocument();
    expect(screen.getByText('Heart Care Clinic')).toBeInTheDocument();
  });

  it('should allow selecting appointment type (online/physical)', () => {
    renderWithProviders(
      <AppointmentBooking
        open={true}
        onClose={() => {}}
        doctor={mockDoctor}
      />
    );

    const onlineOption = screen.getByLabelText(/Online Consultation/);
    const physicalOption = screen.getByLabelText(/In-Person Visit/);

    expect(onlineOption).toBeChecked();
    expect(physicalOption).not.toBeChecked();

    fireEvent.click(physicalOption);
    expect(physicalOption).toBeChecked();
    expect(onlineOption).not.toBeChecked();
  });

  it('should validate appointment date and time constraints', async () => {
    renderWithProviders(
      <AppointmentBooking
        open={true}
        onClose={() => {}}
        doctor={mockDoctor}
      />
    );

    const bookButton = screen.getByText('Book Appointment');
    
    // Try to book without selecting date
    fireEvent.click(bookButton);
    await waitFor(() => {
      expect(screen.getByText('Please select a date and time')).toBeInTheDocument();
    });

    // Try to book with past date (should be prevented by input constraints)
    const dateInput = screen.getByLabelText('Select Date and Time');
    const pastDate = new Date();
    pastDate.setHours(pastDate.getHours() - 1);
    
    fireEvent.change(dateInput, {
      target: { value: pastDate.toISOString().slice(0, 16) }
    });

    fireEvent.click(bookButton);
    await waitFor(() => {
      expect(screen.getByText(/must be booked at least 24 hours in advance/)).toBeInTheDocument();
    });
  });

  it('should successfully create appointment with valid data', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 'appointment-1',
        patientId: 'patient-1',
        doctorId: 'doctor-1',
        scheduledDateTime: '2024-12-25T10:00:00Z',
        type: 'online',
        status: 'awaiting_acceptance',
        paymentStatus: 'pending',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        followUpRequired: false,
      }),
    });

    const mockOnClose = vi.fn();
    renderWithProviders(
      <AppointmentBooking
        open={true}
        onClose={mockOnClose}
        doctor={mockDoctor}
      />
    );

    // Set valid future date (25 hours from now)
    const futureDate = new Date();
    futureDate.setHours(futureDate.getHours() + 25);
    
    const dateInput = screen.getByLabelText('Select Date and Time');
    fireEvent.change(dateInput, {
      target: { value: futureDate.toISOString().slice(0, 16) }
    });

    // Add notes
    const notesInput = screen.getByLabelText(/Additional Notes/);
    fireEvent.change(notesInput, {
      target: { value: 'Chest pain consultation' }
    });

    // Submit appointment
    const bookButton = screen.getByText('Book Appointment');
    fireEvent.click(bookButton);

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
          notes: 'Chest pain consultation',
        }),
      });
    });

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('should handle appointment creation errors gracefully', async () => {
    (fetch as any).mockRejectedValueOnce(new Error('Network error'));

    renderWithProviders(
      <AppointmentBooking
        open={true}
        onClose={() => {}}
        doctor={mockDoctor}
      />
    );

    // Set valid future date
    const futureDate = new Date();
    futureDate.setHours(futureDate.getHours() + 25);
    
    const dateInput = screen.getByLabelText('Select Date and Time');
    fireEvent.change(dateInput, {
      target: { value: futureDate.toISOString().slice(0, 16) }
    });

    const bookButton = screen.getByText('Book Appointment');
    fireEvent.click(bookButton);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('should display booking guidelines and constraints', () => {
    renderWithProviders(
      <AppointmentBooking
        open={true}
        onClose={() => {}}
        doctor={mockDoctor}
      />
    );

    expect(screen.getByText('Booking Guidelines:')).toBeInTheDocument();
    expect(screen.getByText(/Payment must be completed within 15 minutes/)).toBeInTheDocument();
    expect(screen.getByText(/Cancellations allowed up to 24 hours/)).toBeInTheDocument();
    expect(screen.getByText(/You will receive meeting details after payment/)).toBeInTheDocument();
  });

  it('should show loading state during appointment creation', async () => {
    (fetch as any).mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ id: 'appointment-1' })
      }), 100))
    );

    renderWithProviders(
      <AppointmentBooking
        open={true}
        onClose={() => {}}
        doctor={mockDoctor}
      />
    );

    // Set valid future date
    const futureDate = new Date();
    futureDate.setHours(futureDate.getHours() + 25);
    
    const dateInput = screen.getByLabelText('Select Date and Time');
    fireEvent.change(dateInput, {
      target: { value: futureDate.toISOString().slice(0, 16) }
    });

    const bookButton = screen.getByText('Book Appointment');
    fireEvent.click(bookButton);

    expect(screen.getByText('Booking...')).toBeInTheDocument();
    expect(bookButton).toBeDisabled();
  });
});