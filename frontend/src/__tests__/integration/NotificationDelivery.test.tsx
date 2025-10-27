import { render, screen, waitFor, act } from '@testing-library/react';
import { vi } from 'vitest';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { 
  renderWithProviders, 
  createMockUser, 
  createMockAppointment,
  mockFetchSuccess 
} from '../utils/test-utils';
import AppointmentsPage from '../../pages/AppointmentsPage';
import { NotificationProvider } from '../../contexts/NotificationContext';

// Mock fetch
global.fetch = vi.fn();

// Mock Notification API
const mockNotification = {
  requestPermission: vi.fn().mockResolvedValue('granted'),
  permission: 'granted',
};

Object.defineProperty(window, 'Notification', {
  value: vi.fn().mockImplementation((title, options) => ({
    title,
    body: options?.body,
    icon: options?.icon,
    close: vi.fn(),
    onclick: null,
    onshow: null,
    onclose: null,
    onerror: null,
  })),
  configurable: true,
});

Object.defineProperty(window.Notification, 'requestPermission', {
  value: mockNotification.requestPermission,
});

Object.defineProperty(window.Notification, 'permission', {
  value: mockNotification.permission,
  configurable: true,
});

// Mock Service Worker for push notifications
const mockServiceWorker = {
  register: vi.fn().mockResolvedValue({
    showNotification: vi.fn(),
    pushManager: {
      subscribe: vi.fn().mockResolvedValue({
        endpoint: 'https://fcm.googleapis.com/fcm/send/test',
        keys: {
          p256dh: 'test-p256dh-key',
          auth: 'test-auth-key',
        },
      }),
    },
  }),
};

Object.defineProperty(navigator, 'serviceWorker', {
  value: mockServiceWorker,
  configurable: true,
});

// Mock WebSocket for real-time notifications
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(public url: string) {
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 100);
  }

  send(data: string) {
    // Mock sending data
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close'));
    }
  }

  // Helper method to simulate receiving messages
  simulateMessage(data: any) {
    if (this.onmessage && this.readyState === MockWebSocket.OPEN) {
      this.onmessage(new MessageEvent('message', { data: JSON.stringify(data) }));
    }
  }
}

global.WebSocket = MockWebSocket as any;

describe('Notification Delivery Integration Tests', () => {
  let mockUser: any;
  let mockAppointment: any;
  let mockWebSocket: MockWebSocket;

  beforeEach(() => {
    vi.clearAllMocks();
    (fetch as any).mockClear();

    mockUser = createMockUser({ role: 'patient' });
    mockAppointment = createMockAppointment({
      status: 'confirmed',
      paymentStatus: 'completed',
    });

    // Mock WebSocket connection
    mockWebSocket = new MockWebSocket('ws://localhost:3001/notifications');
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('In-App Notifications', () => {
    it('should display in-app notifications for appointment updates', async () => {
      (fetch as any).mockResolvedValueOnce(mockFetchSuccess([mockAppointment]));

      const { container } = renderWithProviders(
        <NotificationProvider>
          <AppointmentsPage />
        </NotificationProvider>,
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
              appointments: [mockAppointment],
              currentAppointment: null,
              isLoading: false,
              error: null,
            },
          },
        }
      );

      // Wait for WebSocket connection
      await waitFor(() => {
        expect(mockWebSocket.readyState).toBe(MockWebSocket.OPEN);
      });

      // Simulate receiving a notification
      act(() => {
        mockWebSocket.simulateMessage({
          type: 'appointment_reminder',
          title: 'Appointment Reminder',
          message: 'Your appointment with Dr. John Smith is in 1 hour',
          appointmentId: mockAppointment.id,
          timestamp: new Date().toISOString(),
        });
      });

      // Check if notification appears in UI
      await waitFor(() => {
        expect(screen.getByText('Appointment Reminder')).toBeInTheDocument();
        expect(screen.getByText(/Your appointment with Dr. John Smith is in 1 hour/)).toBeInTheDocument();
      });
    });

    it('should handle notification click actions', async () => {
      (fetch as any).mockResolvedValueOnce(mockFetchSuccess([mockAppointment]));

      renderWithProviders(
        <NotificationProvider>
          <AppointmentsPage />
        </NotificationProvider>,
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
              appointments: [mockAppointment],
              currentAppointment: null,
              isLoading: false,
              error: null,
            },
          },
        }
      );

      await waitFor(() => {
        expect(mockWebSocket.readyState).toBe(MockWebSocket.OPEN);
      });

      // Simulate notification with action
      act(() => {
        mockWebSocket.simulateMessage({
          type: 'appointment_accepted',
          title: 'Appointment Accepted',
          message: 'Dr. John Smith has accepted your appointment',
          appointmentId: mockAppointment.id,
          action: {
            type: 'navigate',
            url: '/payment/' + mockAppointment.id,
          },
        });
      });

      await waitFor(() => {
        expect(screen.getByText('Appointment Accepted')).toBeInTheDocument();
      });

      // Click on notification should trigger action
      const notification = screen.getByText('Appointment Accepted');
      notification.click();

      // Verify navigation or action was triggered
      await waitFor(() => {
        expect(window.location.pathname).toContain('/payment');
      });
    });

    it('should display notification badge count', async () => {
      (fetch as any).mockResolvedValueOnce(mockFetchSuccess([mockAppointment]));

      renderWithProviders(
        <NotificationProvider>
          <AppointmentsPage />
        </NotificationProvider>,
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
              appointments: [mockAppointment],
              currentAppointment: null,
              isLoading: false,
              error: null,
            },
          },
        }
      );

      await waitFor(() => {
        expect(mockWebSocket.readyState).toBe(MockWebSocket.OPEN);
      });

      // Send multiple notifications
      act(() => {
        mockWebSocket.simulateMessage({
          type: 'appointment_reminder',
          title: 'Reminder 1',
          message: 'First reminder',
        });
      });

      act(() => {
        mockWebSocket.simulateMessage({
          type: 'appointment_reminder',
          title: 'Reminder 2',
          message: 'Second reminder',
        });
      });

      // Check notification badge
      await waitFor(() => {
        const badge = screen.getByTestId('notification-badge');
        expect(badge).toHaveTextContent('2');
      });
    });
  });

  describe('Browser Push Notifications', () => {
    it('should request permission and register for push notifications', async () => {
      (fetch as any).mockResolvedValueOnce(mockFetchSuccess([mockAppointment]));

      renderWithProviders(
        <NotificationProvider>
          <AppointmentsPage />
        </NotificationProvider>,
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
              appointments: [mockAppointment],
              currentAppointment: null,
              isLoading: false,
              error: null,
            },
          },
        }
      );

      // Verify permission was requested
      await waitFor(() => {
        expect(mockNotification.requestPermission).toHaveBeenCalled();
      });

      // Verify service worker registration
      await waitFor(() => {
        expect(mockServiceWorker.register).toHaveBeenCalledWith('/sw.js');
      });
    });

    it('should display browser notifications for important events', async () => {
      (fetch as any).mockResolvedValueOnce(mockFetchSuccess([mockAppointment]));

      renderWithProviders(
        <NotificationProvider>
          <AppointmentsPage />
        </NotificationProvider>,
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
              appointments: [mockAppointment],
              currentAppointment: null,
              isLoading: false,
              error: null,
            },
          },
        }
      );

      await waitFor(() => {
        expect(mockWebSocket.readyState).toBe(MockWebSocket.OPEN);
      });

      // Simulate high-priority notification
      act(() => {
        mockWebSocket.simulateMessage({
          type: 'appointment_cancelled',
          title: 'Appointment Cancelled',
          message: 'Your appointment has been cancelled by the doctor',
          priority: 'high',
          showBrowserNotification: true,
        });
      });

      // Verify browser notification was created
      await waitFor(() => {
        expect(window.Notification).toHaveBeenCalledWith(
          'Appointment Cancelled',
          expect.objectContaining({
            body: 'Your appointment has been cancelled by the doctor',
            icon: expect.any(String),
          })
        );
      });
    });

    it('should handle notification permission denied gracefully', async () => {
      // Mock permission denied
      Object.defineProperty(window.Notification, 'permission', {
        value: 'denied',
        configurable: true,
      });

      mockNotification.requestPermission.mockResolvedValueOnce('denied');

      (fetch as any).mockResolvedValueOnce(mockFetchSuccess([mockAppointment]));

      renderWithProviders(
        <NotificationProvider>
          <AppointmentsPage />
        </NotificationProvider>,
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
              appointments: [mockAppointment],
              currentAppointment: null,
              isLoading: false,
              error: null,
            },
          },
        }
      );

      // Should still show in-app notifications even if browser notifications are denied
      await waitFor(() => {
        expect(mockWebSocket.readyState).toBe(MockWebSocket.OPEN);
      });

      act(() => {
        mockWebSocket.simulateMessage({
          type: 'appointment_reminder',
          title: 'Appointment Reminder',
          message: 'Your appointment is coming up',
        });
      });

      await waitFor(() => {
        expect(screen.getByText('Appointment Reminder')).toBeInTheDocument();
      });
    });
  });

  describe('Email Notifications', () => {
    it('should send email notifications for appointment events', async () => {
      (fetch as any)
        .mockResolvedValueOnce(mockFetchSuccess([mockAppointment]))
        .mockResolvedValueOnce(mockFetchSuccess({ sent: true, messageId: 'email-123' }));

      renderWithProviders(
        <NotificationProvider>
          <AppointmentsPage />
        </NotificationProvider>,
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
              appointments: [mockAppointment],
              currentAppointment: null,
              isLoading: false,
              error: null,
            },
          },
        }
      );

      // Trigger email notification
      await waitFor(() => {
        expect(mockWebSocket.readyState).toBe(MockWebSocket.OPEN);
      });

      act(() => {
        mockWebSocket.simulateMessage({
          type: 'appointment_confirmed',
          title: 'Appointment Confirmed',
          message: 'Your appointment has been confirmed',
          sendEmail: true,
          emailTemplate: 'appointment_confirmation',
        });
      });

      // Verify email API was called
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/notifications/email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token',
          },
          body: JSON.stringify({
            to: mockUser.email,
            template: 'appointment_confirmation',
            data: expect.any(Object),
          }),
        });
      });
    });

    it('should handle email delivery failures', async () => {
      (fetch as any)
        .mockResolvedValueOnce(mockFetchSuccess([mockAppointment]))
        .mockRejectedValueOnce(new Error('Email service unavailable'));

      renderWithProviders(
        <NotificationProvider>
          <AppointmentsPage />
        </NotificationProvider>,
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
              appointments: [mockAppointment],
              currentAppointment: null,
              isLoading: false,
              error: null,
            },
          },
        }
      );

      await waitFor(() => {
        expect(mockWebSocket.readyState).toBe(MockWebSocket.OPEN);
      });

      act(() => {
        mockWebSocket.simulateMessage({
          type: 'email_delivery_failed',
          title: 'Email Delivery Failed',
          message: 'Failed to send email notification',
          error: 'Email service unavailable',
        });
      });

      // Should show error notification in UI
      await waitFor(() => {
        expect(screen.getByText('Email Delivery Failed')).toBeInTheDocument();
        expect(screen.getByText(/Failed to send email notification/)).toBeInTheDocument();
      });
    });
  });

  describe('SMS Notifications', () => {
    it('should send SMS notifications for urgent events', async () => {
      (fetch as any)
        .mockResolvedValueOnce(mockFetchSuccess([mockAppointment]))
        .mockResolvedValueOnce(mockFetchSuccess({ sent: true, messageId: 'sms-123' }));

      renderWithProviders(
        <NotificationProvider>
          <AppointmentsPage />
        </NotificationProvider>,
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
              appointments: [mockAppointment],
              currentAppointment: null,
              isLoading: false,
              error: null,
            },
          },
        }
      );

      await waitFor(() => {
        expect(mockWebSocket.readyState).toBe(MockWebSocket.OPEN);
      });

      act(() => {
        mockWebSocket.simulateMessage({
          type: 'appointment_reminder',
          title: 'Urgent Reminder',
          message: 'Your appointment is in 10 minutes',
          sendSMS: true,
          priority: 'urgent',
        });
      });

      // Verify SMS API was called
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/notifications/sms', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token',
          },
          body: JSON.stringify({
            to: mockUser.profile.contactInfo.phone,
            message: 'Your appointment is in 10 minutes',
          }),
        });
      });
    });
  });

  describe('Notification Preferences', () => {
    it('should respect user notification preferences', async () => {
      const userWithPreferences = {
        ...mockUser,
        notificationPreferences: {
          email: true,
          sms: false,
          push: true,
          inApp: true,
        },
      };

      (fetch as any).mockResolvedValueOnce(mockFetchSuccess([mockAppointment]));

      renderWithProviders(
        <NotificationProvider>
          <AppointmentsPage />
        </NotificationProvider>,
        {
          preloadedState: {
            auth: {
              user: userWithPreferences,
              token: 'mock-token',
              isLoading: false,
              error: null,
              isAuthenticated: true,
            },
            appointments: {
              appointments: [mockAppointment],
              currentAppointment: null,
              isLoading: false,
              error: null,
            },
          },
        }
      );

      await waitFor(() => {
        expect(mockWebSocket.readyState).toBe(MockWebSocket.OPEN);
      });

      act(() => {
        mockWebSocket.simulateMessage({
          type: 'appointment_reminder',
          title: 'Appointment Reminder',
          message: 'Your appointment is coming up',
          respectPreferences: true,
        });
      });

      // Should show in-app notification (enabled)
      await waitFor(() => {
        expect(screen.getByText('Appointment Reminder')).toBeInTheDocument();
      });

      // Should not send SMS (disabled in preferences)
      expect(fetch).not.toHaveBeenCalledWith('/api/notifications/sms', expect.any(Object));
    });
  });

  describe('Real-time Notification Delivery', () => {
    it('should maintain WebSocket connection for real-time notifications', async () => {
      (fetch as any).mockResolvedValueOnce(mockFetchSuccess([mockAppointment]));

      renderWithProviders(
        <NotificationProvider>
          <AppointmentsPage />
        </NotificationProvider>,
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
              appointments: [mockAppointment],
              currentAppointment: null,
              isLoading: false,
              error: null,
            },
          },
        }
      );

      // Verify WebSocket connection is established
      await waitFor(() => {
        expect(mockWebSocket.readyState).toBe(MockWebSocket.OPEN);
      });

      // Test connection resilience
      act(() => {
        mockWebSocket.close();
      });

      // Should attempt to reconnect
      await waitFor(() => {
        expect(mockWebSocket.readyState).toBe(MockWebSocket.CLOSED);
      });
    });

    it('should handle WebSocket connection failures gracefully', async () => {
      // Mock WebSocket connection failure
      const failingWebSocket = {
        ...mockWebSocket,
        readyState: MockWebSocket.CLOSED,
      };

      global.WebSocket = vi.fn().mockImplementation(() => {
        setTimeout(() => {
          if (failingWebSocket.onerror) {
            failingWebSocket.onerror(new Event('error'));
          }
        }, 100);
        return failingWebSocket;
      }) as any;

      (fetch as any).mockResolvedValueOnce(mockFetchSuccess([mockAppointment]));

      renderWithProviders(
        <NotificationProvider>
          <AppointmentsPage />
        </NotificationProvider>,
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
              appointments: [mockAppointment],
              currentAppointment: null,
              isLoading: false,
              error: null,
            },
          },
        }
      );

      // Should fall back to polling for notifications
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/notifications/poll', expect.any(Object));
      });
    });
  });
});