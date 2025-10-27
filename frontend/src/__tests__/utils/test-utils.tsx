import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { configureStore, PreloadedState } from '@reduxjs/toolkit';

import appointmentReducer from '../../store/slices/appointmentSlice';
import authReducer from '../../store/slices/authSlice';
import { theme } from '../../utils/theme';
import { User, Appointment } from '../../types';

// Define the root state type
export interface RootState {
  auth: {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    error: string | null;
    isAuthenticated: boolean;
  };
  appointments: {
    appointments: Appointment[];
    currentAppointment: Appointment | null;
    isLoading: boolean;
    error: string | null;
  };
}

// Create a custom render function that includes providers
interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
  preloadedState?: PreloadedState<RootState>;
  store?: ReturnType<typeof configureStore>;
}

export function renderWithProviders(
  ui: ReactElement,
  {
    preloadedState = {},
    store = configureStore({
      reducer: {
        appointments: appointmentReducer,
        auth: authReducer,
      },
      preloadedState,
    }),
    ...renderOptions
  }: ExtendedRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <Provider store={store}>
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            {children}
          </ThemeProvider>
        </BrowserRouter>
      </Provider>
    );
  }

  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}

// Mock data factories
export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-1',
  email: 'test@example.com',
  role: 'patient',
  isVerified: true,
  isActive: true,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
  profile: {
    userId: 'user-1',
    name: 'Test User',
    age: 30,
    gender: 'female',
    contactInfo: { phone: '+1234567890' },
    address: {
      street: '123 Test St',
      city: 'Test City',
      state: 'Test State',
      zipCode: '12345',
      country: 'USA',
    },
  },
  ...overrides,
});

export const createMockAppointment = (overrides: Partial<Appointment> = {}): Appointment => ({
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
  doctor: {
    userId: 'doctor-1',
    name: 'Test Doctor',
    profilePicture: 'doctor.jpg',
    medicalLicenseNumber: 'MD123456',
    licenseVerificationStatus: 'verified',
    qualifications: ['MBBS', 'MD'],
    yearsOfExperience: 10,
    specializations: ['General Medicine'],
    contactInfo: {
      phone: '+1234567890',
    },
    clinicInfo: {
      name: 'Test Clinic',
      address: {
        street: '123 Medical St',
        city: 'Medical City',
        state: 'Medical State',
        zipCode: '12345',
        country: 'USA',
      },
      contactInfo: {
        phone: '+1234567890',
      },
      facilities: ['General Consultation'],
    },
    consultationFee: 500,
    rating: 4.5,
    totalReviews: 100,
    isAcceptingPatients: true,
  },
  ...overrides,
});

// Mock fetch responses
export const mockFetchSuccess = (data: any) => {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(data),
  });
};

export const mockFetchError = (error: string) => {
  return Promise.reject(new Error(error));
};

// Viewport size utilities for responsive testing
export const setViewportSize = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
  window.dispatchEvent(new Event('resize'));
};

export const VIEWPORT_SIZES = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1200, height: 800 },
  largeDesktop: { width: 1920, height: 1080 },
};

// Common test data
export const TEST_APPOINTMENT_DATA = {
  doctorId: 'doctor-1',
  scheduledDateTime: '2024-12-25T10:00:00Z',
  type: 'online' as const,
  notes: 'Test consultation',
};

export const TEST_PAYMENT_DATA = {
  appointmentId: 'appointment-1',
  amount: 500,
  currency: 'INR',
  paymentMethod: 'card' as const,
};

// Re-export everything from testing-library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';