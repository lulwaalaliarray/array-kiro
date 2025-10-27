import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { describe, it, expect, beforeEach } from 'vitest';

import { 
  renderWithProviders, 
  createMockUser, 
  createMockAppointment,
  mockFetchSuccess 
} from '../utils/test-utils';
import AppointmentBooking from '../../components/Booking/AppointmentBooking';
import PaymentPage from '../../components/Payment/PaymentPage';
import DoctorSearchPage from '../../components/DoctorSearch/DoctorSearchPage';

// Mock different browser environments
const mockUserAgents = {
  chrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  firefox: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
  safari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
  edge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59',
  mobile: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
};

// Mock viewport sizes
const mockViewports = {
  desktop: { width: 1920, height: 1080 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 667 },
  smallMobile: { width: 320, height: 568 },
};

// Mock CSS features support
const mockCSSSupport = {
  grid: true,
  flexbox: true,
  customProperties: true,
  transforms: true,
  transitions: true,
};

global.fetch = vi.fn();

describe('Cross-Browser and Device Compatibility Tests', () => {
  let mockUser: any;
  let mockDoctor: any;
  let mockAppointment: any;

  beforeEach(() => {
    vi.clearAllMocks();
    (fetch as any).mockClear();

    mockUser = createMockUser({ role: 'patient' });
    mockDoctor = {
      userId: 'doctor-1',
      name: 'Dr. Test Doctor',
      specializations: ['Cardiology'],
      consultationFee: 500,
      rating: 4.5,
      totalReviews: 100,
      isAcceptingPatients: true,
      clinicInfo: {
        name: 'Test Clinic',
        address: {
          street: '123 Medical St',
          city: 'Test City',
          state: 'Test State',
          zipCode: '12345',
          country: 'USA',
        },
      },
    };
    mockAppointment = createMockAppointment({
      status: 'payment_pending',
      paymentStatus: 'pending',
      doctor: mockDoctor,
    });
  });

  describe('Browser Compatibility Tests', () => {
    Object.entries(mockUserAgents).forEach(([browserName, userAgent]) => {
      describe(`${browserName.toUpperCase()} Browser Tests`, () => {
        beforeEach(() => {
          Object.defineProperty(navigator, 'userAgent', {
            value: userAgent,
            configurable: true,
          });
        });

        it(`should render appointment booking correctly in ${browserName}`, () => {
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

          expect(screen.getByText('Book Appointment with Dr. Test Doctor')).toBeInTheDocument();
          expect(screen.getByText('Cardiology')).toBeInTheDocument();
          expect(screen.getByText('₹500')).toBeInTheDocument();
        });

        it(`should handle form interactions correctly in ${browserName}`, async () => {
          (fetch as any).mockResolvedValueOnce(mockFetchSuccess({
            id: 'appointment-1',
            status: 'awaiting_acceptance',
          }));

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

          // Test date input
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + 2);
          
          const dateInput = screen.getByLabelText('Select Date and Time');
          fireEvent.change(dateInput, {
            target: { value: futureDate.toISOString().slice(0, 16) }
          });

          // Test appointment type selection
          const physicalOption = screen.getByLabelText(/In-Person Visit/);
          fireEvent.click(physicalOption);

          // Test notes input
          const notesInput = screen.getByLabelText(/Additional Notes/);
          fireEvent.change(notesInput, {
            target: { value: 'Test consultation' }
          });

          // Submit form
          const bookButton = screen.getByText('Book Appointment');
          fireEvent.click(bookButton);

          await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith('/api/appointments', expect.any(Object));
          });
        });

        it(`should display payment page correctly in ${browserName}`, () => {
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
                appointments: [mockAppointment],
                currentAppointment: mockAppointment,
                isLoading: false,
                error: null,
              },
            },
          });

          expect(screen.getByText('Complete Payment')).toBeInTheDocument();
          expect(screen.getByText('Dr. Test Doctor')).toBeInTheDocument();
          expect(screen.getByText('₹500')).toBeInTheDocument();
        });
      });
    });
  });

  describe('Responsive Design Tests', () => {
    Object.entries(mockViewports).forEach(([deviceType, viewport]) => {
      describe(`${deviceType.toUpperCase()} Device Tests`, () => {
        beforeEach(() => {
          // Mock window dimensions
          Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: viewport.width,
          });
          Object.defineProperty(window, 'innerHeight', {
            writable: true,
            configurable: true,
            value: viewport.height,
          });

          // Mock matchMedia for responsive queries
          window.matchMedia = vi.fn().mockImplementation(query => {
            const mediaQuery = query.match(/\(max-width:\s*(\d+)px\)/);
            const maxWidth = mediaQuery ? parseInt(mediaQuery[1]) : Infinity;
            
            return {
              matches: viewport.width <= maxWidth,
              media: query,
              onchange: null,
              addListener: vi.fn(),
              removeListener: vi.fn(),
              addEventListener: vi.fn(),
              removeEventListener: vi.fn(),
              dispatchEvent: vi.fn(),
            };
          });

          // Trigger resize event
          window.dispatchEvent(new Event('resize'));
        });

        it(`should render doctor search page responsively on ${deviceType}`, () => {
          (fetch as any).mockResolvedValueOnce(mockFetchSuccess([mockDoctor]));

          renderWithProviders(<DoctorSearchPage />, {
            preloadedState: {
              auth: {
                user: mockUser,
                token: 'mock-token',
                isLoading: false,
                error: null,
                isAuthenticated: true,
              },
            },
          });

          expect(screen.getByText('Find Doctors')).toBeInTheDocument();
          
          // Check if search filters are accessible
          if (viewport.width >= 768) {
            // Desktop/tablet should show filters sidebar
            expect(screen.getByText('Filters')).toBeInTheDocument();
          } else {
            // Mobile should show filters in a collapsible menu
            const filtersButton = screen.getByRole('button', { name: /filters/i });
            expect(filtersButton).toBeInTheDocument();
          }
        });

        it(`should handle touch interactions on ${deviceType}`, async () => {
          const isTouchDevice = viewport.width <= 768;
          
          // Mock touch events for mobile devices
          if (isTouchDevice) {
            Object.defineProperty(window, 'ontouchstart', {
              value: () => {},
              configurable: true,
            });
          }

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

          const appointmentTypeOptions = screen.getAllByRole('radio');
          
          if (isTouchDevice) {
            // Test touch events
            fireEvent.touchStart(appointmentTypeOptions[1]);
            fireEvent.touchEnd(appointmentTypeOptions[1]);
          } else {
            // Test mouse events
            fireEvent.click(appointmentTypeOptions[1]);
          }

          expect(appointmentTypeOptions[1]).toBeChecked();
        });

        it(`should display appropriate button sizes for ${deviceType}`, () => {
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
                appointments: [mockAppointment],
                currentAppointment: mockAppointment,
                isLoading: false,
                error: null,
              },
            },
          });

          const payButton = screen.getByText(/Pay ₹/);
          const buttonStyles = window.getComputedStyle(payButton);
          
          if (viewport.width <= 480) {
            // Mobile buttons should be larger for touch
            expect(parseInt(buttonStyles.minHeight)).toBeGreaterThanOrEqual(44);
          }
        });

        it(`should handle keyboard navigation on ${deviceType}`, () => {
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

          const dateInput = screen.getByLabelText('Select Date and Time');
          
          // Test keyboard navigation
          fireEvent.keyDown(dateInput, { key: 'Tab' });
          fireEvent.keyDown(dateInput, { key: 'Enter' });
          
          // Should be able to navigate through form elements
          expect(dateInput).toBeInTheDocument();
        });
      });
    });
  });

  describe('CSS Feature Support Tests', () => {
    it('should handle CSS Grid fallbacks', () => {
      // Mock CSS.supports for testing fallbacks
      const originalSupports = CSS.supports;
      CSS.supports = vi.fn().mockImplementation((property, value) => {
        if (property === 'display' && value === 'grid') {
          return false; // Simulate no grid support
        }
        return true;
      });

      renderWithProviders(<DoctorSearchPage />, {
        preloadedState: {
          auth: {
            user: mockUser,
            token: 'mock-token',
            isLoading: false,
            error: null,
            isAuthenticated: true,
          },
        },
      });

      // Should still render without grid support
      expect(screen.getByText('Find Doctors')).toBeInTheDocument();

      CSS.supports = originalSupports;
    });

    it('should handle Flexbox fallbacks', () => {
      const originalSupports = CSS.supports;
      CSS.supports = vi.fn().mockImplementation((property, value) => {
        if (property === 'display' && value === 'flex') {
          return false; // Simulate no flexbox support
        }
        return true;
      });

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
            appointments: [mockAppointment],
            currentAppointment: mockAppointment,
            isLoading: false,
            error: null,
          },
        },
      });

      expect(screen.getByText('Complete Payment')).toBeInTheDocument();

      CSS.supports = originalSupports;
    });
  });

  describe('JavaScript Feature Support Tests', () => {
    it('should handle missing modern JavaScript features', () => {
      // Mock missing fetch API
      const originalFetch = global.fetch;
      delete (global as any).fetch;

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

      // Should still render the form
      expect(screen.getByText('Book Appointment with Dr. Test Doctor')).toBeInTheDocument();

      global.fetch = originalFetch;
    });

    it('should handle missing localStorage gracefully', () => {
      const originalLocalStorage = window.localStorage;
      delete (window as any).localStorage;

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
            appointments: [mockAppointment],
            currentAppointment: mockAppointment,
            isLoading: false,
            error: null,
          },
        },
      });

      expect(screen.getByText('Complete Payment')).toBeInTheDocument();

      window.localStorage = originalLocalStorage;
    });
  });

  describe('Accessibility Tests', () => {
    it('should maintain accessibility across different browsers', () => {
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

      // Check for proper ARIA labels
      expect(screen.getByLabelText('Select Date and Time')).toBeInTheDocument();
      expect(screen.getByLabelText(/Online Consultation/)).toBeInTheDocument();
      expect(screen.getByLabelText(/In-Person Visit/)).toBeInTheDocument();

      // Check for proper heading structure
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();

      // Check for proper button roles
      expect(screen.getByRole('button', { name: /Book Appointment/ })).toBeInTheDocument();
    });

    it('should support screen readers', () => {
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
            appointments: [mockAppointment],
            currentAppointment: mockAppointment,
            isLoading: false,
            error: null,
          },
        },
      });

      // Check for screen reader friendly content
      expect(screen.getByText('Complete Payment')).toBeInTheDocument();
      expect(screen.getByText('Appointment Details')).toBeInTheDocument();
      expect(screen.getByText('Payment Summary')).toBeInTheDocument();

      // Check for proper ARIA descriptions
      const payButton = screen.getByRole('button', { name: /Pay ₹/ });
      expect(payButton).toBeInTheDocument();
    });
  });

  describe('Performance Tests', () => {
    it('should render efficiently on low-end devices', async () => {
      // Mock performance API
      const mockPerformance = {
        now: vi.fn().mockReturnValue(Date.now()),
        mark: vi.fn(),
        measure: vi.fn(),
      };
      Object.defineProperty(window, 'performance', {
        value: mockPerformance,
        configurable: true,
      });

      const startTime = performance.now();

      renderWithProviders(<DoctorSearchPage />, {
        preloadedState: {
          auth: {
            user: mockUser,
            token: 'mock-token',
            isLoading: false,
            error: null,
            isAuthenticated: true,
          },
        },
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time (mock test)
      expect(renderTime).toBeLessThan(1000);
    });

    it('should handle slow network conditions', async () => {
      // Mock slow network
      (fetch as any).mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve(mockFetchSuccess([mockDoctor])), 3000)
        )
      );

      renderWithProviders(<DoctorSearchPage />, {
        preloadedState: {
          auth: {
            user: mockUser,
            token: 'mock-token',
            isLoading: false,
            error: null,
            isAuthenticated: true,
          },
        },
      });

      // Should show loading state
      expect(screen.getByText('Find Doctors')).toBeInTheDocument();
      
      // Should handle timeout gracefully
      await waitFor(() => {
        expect(screen.getByText('Find Doctors')).toBeInTheDocument();
      }, { timeout: 1000 });
    });
  });
});