import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { configureStore } from '@reduxjs/toolkit';
import { vi } from 'vitest';
import { describe, it, expect, beforeEach } from 'vitest';

import AppointmentBooking from '../../components/Booking/AppointmentBooking';
import appointmentReducer from '../../store/slices/appointmentSlice';
import authReducer from '../../store/slices/authSlice';

// Mock fetch
global.fetch = vi.fn();

// Create a simple theme for testing
const testTheme = createTheme({
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

const mockDoctor = {
  userId: 'doctor-1',
  name: 'John Smith',
  profilePicture: 'doctor.jpg',
  medicalLicenseNumber: 'MD123456',
  licenseVerificationStatus: 'verified' as const,
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
        <ThemeProvider theme={testTheme}>
          {component}
        </ThemeProvider>
      </BrowserRouter>
    </Provider>
  );
};

describe('Basic Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (fetch as any).mockClear();
  });

  it('should render appointment booking dialog', () => {
    renderWithProviders(
      <AppointmentBooking
        open={true}
        onClose={() => {}}
        doctor={mockDoctor}
      />
    );

    // Check if the dialog is rendered
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    
    // Check if doctor name is displayed
    expect(screen.getByText(/John Smith/)).toBeInTheDocument();
    
    // Check if consultation fee is displayed
    expect(screen.getByText(/₹500/)).toBeInTheDocument();
  });

  it('should allow selecting appointment type', () => {
    renderWithProviders(
      <AppointmentBooking
        open={true}
        onClose={() => {}}
        doctor={mockDoctor}
      />
    );

    // Find radio buttons by their labels
    const onlineOption = screen.getByDisplayValue('online');
    const physicalOption = screen.getByDisplayValue('physical');

    expect(onlineOption).toBeChecked();
    expect(physicalOption).not.toBeChecked();

    // Click physical option
    fireEvent.click(physicalOption);
    expect(physicalOption).toBeChecked();
    expect(onlineOption).not.toBeChecked();
  });

  it('should validate date input requirement', async () => {
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
  });

  it('should show booking guidelines', () => {
    renderWithProviders(
      <AppointmentBooking
        open={true}
        onClose={() => {}}
        doctor={mockDoctor}
      />
    );

    expect(screen.getByText('Booking Guidelines:')).toBeInTheDocument();
    expect(screen.getByText(/Payment must be completed within 15 minutes/)).toBeInTheDocument();
  });

  it('should handle appointment creation API call', async () => {
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

    // Submit appointment
    const bookButton = screen.getByText('Book Appointment');
    fireEvent.click(bookButton);

    // Verify API call was made
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
          notes: '',
        }),
      });
    });

    // Verify dialog closes on success
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('should handle API errors gracefully', async () => {
    (fetch as any).mockRejectedValueOnce(new Error('Network error'));

    renderWithProviders(
      <AppointmentBooking
        open={true}
        onClose={() => {}}
        doctor={mockDoctor}
      />
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
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('should show loading state during submission', async () => {
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

    // Check loading state
    expect(screen.getByText('Booking...')).toBeInTheDocument();
    expect(bookButton).toBeDisabled();
  });

  it('should validate appointment time constraints', async () => {
    renderWithProviders(
      <AppointmentBooking
        open={true}
        onClose={() => {}}
        doctor={mockDoctor}
      />
    );

    // Try to book with a date too far in the future (more than 48 hours)
    const farFutureDate = new Date();
    farFutureDate.setHours(farFutureDate.getHours() + 50); // 50 hours in future
    
    const dateInput = screen.getByLabelText('Select Date and Time');
    fireEvent.change(dateInput, {
      target: { value: farFutureDate.toISOString().slice(0, 16) }
    });

    const bookButton = screen.getByText('Book Appointment');
    fireEvent.click(bookButton);

    await waitFor(() => {
      expect(screen.getByText(/cannot be booked more than 48 hours in advance/)).toBeInTheDocument();
    });
  });
});