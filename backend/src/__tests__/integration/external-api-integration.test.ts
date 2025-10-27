import request from 'supertest';
import { app } from '../../index';
import { PrismaClient } from '@prisma/client';
import { generateToken } from '../../utils/auth';
import { vi } from 'vitest';

const prisma = new PrismaClient();

// Mock external services
vi.mock('../../services/zoomService', () => ({
  createMeeting: vi.fn().mockResolvedValue({
    id: 'zoom-meeting-123',
    meetingId: '123456789',
    hostUrl: 'https://zoom.us/j/123456789?role=1',
    joinUrl: 'https://zoom.us/j/123456789',
    password: 'test123',
    startTime: new Date(),
    duration: 60,
    status: 'scheduled',
  }),
  getMeetingDetails: vi.fn().mockResolvedValue({
    id: 'zoom-meeting-123',
    status: 'started',
  }),
  endMeeting: vi.fn().mockResolvedValue(true),
}));

vi.mock('../../services/googleMapsService', () => ({
  searchNearbyProviders: vi.fn().mockResolvedValue([
    {
      placeId: 'place-123',
      name: 'Test Hospital',
      address: '123 Medical St, Test City',
      location: { lat: 40.7128, lng: -74.0060 },
      rating: 4.5,
      types: ['hospital', 'health'],
    },
  ]),
  getPlaceDetails: vi.fn().mockResolvedValue({
    placeId: 'place-123',
    name: 'Test Hospital',
    address: '123 Medical St, Test City',
    phone: '+1234567890',
    website: 'https://testhospital.com',
    hours: ['Mon-Fri: 9AM-5PM'],
  }),
  geocodeAddress: vi.fn().mockResolvedValue({
    lat: 40.7128,
    lng: -74.0060,
    formattedAddress: '123 Medical St, Test City, NY 10001, USA',
  }),
}));

vi.mock('../../services/paymentService', () => ({
  createPaymentIntent: vi.fn().mockResolvedValue({
    id: 'pi_test_123',
    clientSecret: 'pi_test_123_secret',
    amount: 500,
    currency: 'inr',
    status: 'requires_payment_method',
  }),
  processPayment: vi.fn().mockResolvedValue({
    id: 'payment-123',
    status: 'completed',
    amount: 500,
    transactionId: 'txn_123',
  }),
  refundPayment: vi.fn().mockResolvedValue({
    id: 'refund-123',
    status: 'succeeded',
    amount: 500,
  }),
}));

vi.mock('../../services/notificationService', () => ({
  sendNotification: vi.fn().mockResolvedValue(true),
  sendEmail: vi.fn().mockResolvedValue({
    messageId: 'email-123',
    status: 'sent',
  }),
  sendSMS: vi.fn().mockResolvedValue({
    messageId: 'sms-123',
    status: 'sent',
  }),
  sendPushNotification: vi.fn().mockResolvedValue({
    messageId: 'push-123',
    status: 'sent',
  }),
}));

describe('External API Integration Tests', () => {
  let patientToken: string;
  let doctorToken: string;
  let patientId: string;
  let doctorId: string;

  beforeAll(async () => {
    // Clean up test data
    await prisma.appointment.deleteMany({});
    await prisma.user.deleteMany({});

    // Create test users
    const patientUser = await prisma.user.create({
      data: {
        email: 'patient@apitest.com',
        passwordHash: '$2a$10$test.hash.for.patient',
        role: 'patient',
        isVerified: true,
        isActive: true,
        profile: {
          create: {
            name: 'API Test Patient',
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
        },
      },
    });

    const doctorUser = await prisma.user.create({
      data: {
        email: 'doctor@apitest.com',
        passwordHash: '$2a$10$test.hash.for.doctor',
        role: 'doctor',
        isVerified: true,
        isActive: true,
        profile: {
          create: {
            name: 'Dr. API Test',
            medicalLicenseNumber: 'MD123456',
            licenseVerificationStatus: 'verified',
            qualifications: ['MBBS'],
            yearsOfExperience: 5,
            specializations: ['General Medicine'],
            contactInfo: { phone: '+1234567891' },
            clinicInfo: {
              name: 'API Test Clinic',
              address: {
                street: '456 Medical St',
                city: 'Medical City',
                state: 'Medical State',
                zipCode: '54321',
                country: 'USA',
              },
              contactInfo: { phone: '+1234567891' },
              facilities: ['General Consultation'],
            },
            consultationFee: 300,
            isAcceptingPatients: true,
          },
        },
      },
    });

    patientId = patientUser.id;
    doctorId = doctorUser.id;

    patientToken = generateToken({ userId: patientId, role: 'patient' });
    doctorToken = generateToken({ userId: doctorId, role: 'doctor' });
  });

  afterAll(async () => {
    await prisma.appointment.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  describe('Zoom Integration Tests', () => {
    it('should create Zoom meeting for online appointment', async () => {
      // Create appointment
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const appointmentResponse = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          doctorId,
          scheduledDateTime: futureDate.toISOString(),
          type: 'online',
          notes: 'Zoom integration test',
        })
        .expect(201);

      // Accept appointment
      await request(app)
        .post(`/api/appointments/${appointmentResponse.body.id}/accept`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      // Process payment to confirm appointment
      const paymentResponse = await request(app)
        .post('/api/payments/create-intent')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          appointmentId: appointmentResponse.body.id,
          amount: 300,
          currency: 'INR',
          paymentMethod: 'card',
        })
        .expect(201);

      await request(app)
        .post('/api/payments/process')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          paymentIntentId: paymentResponse.body.id,
          appointmentId: appointmentResponse.body.id,
        })
        .expect(200);

      // Verify Zoom meeting was created
      const appointmentDetails = await request(app)
        .get(`/api/appointments/${appointmentResponse.body.id}`)
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(appointmentDetails.body.zoomMeetingId).toBe('zoom-meeting-123');

      // Get Zoom meeting details
      const zoomResponse = await request(app)
        .get(`/api/zoom/meeting/${appointmentDetails.body.zoomMeetingId}`)
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(zoomResponse.body.joinUrl).toBe('https://zoom.us/j/123456789');
      expect(zoomResponse.body.password).toBe('test123');
    });

    it('should handle Zoom API failures gracefully', async () => {
      const { createMeeting } = await import('../../services/zoomService');
      (createMeeting as any).mockRejectedValueOnce(new Error('Zoom API unavailable'));

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2);

      const appointmentResponse = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          doctorId,
          scheduledDateTime: futureDate.toISOString(),
          type: 'online',
          notes: 'Zoom failure test',
        })
        .expect(201);

      await request(app)
        .post(`/api/appointments/${appointmentResponse.body.id}/accept`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      // Payment processing should still work even if Zoom fails
      const paymentResponse = await request(app)
        .post('/api/payments/create-intent')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          appointmentId: appointmentResponse.body.id,
          amount: 300,
          currency: 'INR',
          paymentMethod: 'card',
        })
        .expect(201);

      // The appointment should still be confirmed but without Zoom meeting
      await request(app)
        .post('/api/payments/process')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          paymentIntentId: paymentResponse.body.id,
          appointmentId: appointmentResponse.body.id,
        })
        .expect(200);
    });
  });

  describe('Google Maps Integration Tests', () => {
    it('should search for nearby healthcare providers', async () => {
      const response = await request(app)
        .get('/api/maps/nearby-providers')
        .set('Authorization', `Bearer ${patientToken}`)
        .query({
          lat: 40.7128,
          lng: -74.0060,
          radius: 5000,
          type: 'hospital',
        })
        .expect(200);

      expect(response.body.providers).toHaveLength(1);
      expect(response.body.providers[0].name).toBe('Test Hospital');
      expect(response.body.providers[0].location).toEqual({
        lat: 40.7128,
        lng: -74.0060,
      });
    });

    it('should get detailed place information', async () => {
      const response = await request(app)
        .get('/api/maps/place/place-123')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(response.body.name).toBe('Test Hospital');
      expect(response.body.phone).toBe('+1234567890');
      expect(response.body.website).toBe('https://testhospital.com');
    });

    it('should geocode addresses', async () => {
      const response = await request(app)
        .post('/api/maps/geocode')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          address: '123 Medical St, Test City',
        })
        .expect(200);

      expect(response.body.lat).toBe(40.7128);
      expect(response.body.lng).toBe(-74.0060);
      expect(response.body.formattedAddress).toContain('123 Medical St');
    });

    it('should handle Google Maps API failures', async () => {
      const { searchNearbyProviders } = await import('../../services/googleMapsService');
      (searchNearbyProviders as any).mockRejectedValueOnce(new Error('Maps API quota exceeded'));

      const response = await request(app)
        .get('/api/maps/nearby-providers')
        .set('Authorization', `Bearer ${patientToken}`)
        .query({
          lat: 40.7128,
          lng: -74.0060,
          radius: 5000,
          type: 'hospital',
        })
        .expect(503);

      expect(response.body.error).toContain('Maps API');
    });
  });

  describe('Payment Gateway Integration Tests', () => {
    it('should create and process payment successfully', async () => {
      // Create appointment first
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const appointmentResponse = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          doctorId,
          scheduledDateTime: futureDate.toISOString(),
          type: 'physical',
          notes: 'Payment integration test',
        })
        .expect(201);

      await request(app)
        .post(`/api/appointments/${appointmentResponse.body.id}/accept`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      // Create payment intent
      const paymentIntentResponse = await request(app)
        .post('/api/payments/create-intent')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          appointmentId: appointmentResponse.body.id,
          amount: 300,
          currency: 'INR',
          paymentMethod: 'card',
        })
        .expect(201);

      expect(paymentIntentResponse.body.id).toBe('pi_test_123');
      expect(paymentIntentResponse.body.clientSecret).toBe('pi_test_123_secret');

      // Process payment
      const processResponse = await request(app)
        .post('/api/payments/process')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          paymentIntentId: paymentIntentResponse.body.id,
          appointmentId: appointmentResponse.body.id,
        })
        .expect(200);

      expect(processResponse.body.status).toBe('completed');
      expect(processResponse.body.transactionId).toBe('txn_123');
    });

    it('should handle payment refunds', async () => {
      // Create a completed payment first
      const payment = await prisma.payment.create({
        data: {
          appointmentId: 'test-appointment',
          patientId,
          doctorId,
          amount: 300,
          currency: 'INR',
          status: 'completed',
          paymentMethodId: 'pm_test',
          transactionId: 'txn_refund_test',
        },
      });

      const refundResponse = await request(app)
        .post(`/api/payments/${payment.id}/refund`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          reason: 'Appointment cancelled',
        })
        .expect(200);

      expect(refundResponse.body.status).toBe('succeeded');
      expect(refundResponse.body.amount).toBe(300);
    });

    it('should handle payment gateway failures', async () => {
      const { createPaymentIntent } = await import('../../services/paymentService');
      (createPaymentIntent as any).mockRejectedValueOnce(new Error('Payment gateway unavailable'));

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3);

      const appointmentResponse = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          doctorId,
          scheduledDateTime: futureDate.toISOString(),
          type: 'online',
          notes: 'Payment failure test',
        })
        .expect(201);

      await request(app)
        .post(`/api/appointments/${appointmentResponse.body.id}/accept`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      const response = await request(app)
        .post('/api/payments/create-intent')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          appointmentId: appointmentResponse.body.id,
          amount: 300,
          currency: 'INR',
          paymentMethod: 'card',
        })
        .expect(503);

      expect(response.body.error).toContain('Payment gateway');
    });
  });

  describe('Notification Service Integration Tests', () => {
    it('should send multi-channel notifications', async () => {
      const response = await request(app)
        .post('/api/notifications/send')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          userId: patientId,
          type: 'appointment_reminder',
          title: 'Appointment Reminder',
          message: 'Your appointment is in 1 hour',
          channels: ['email', 'sms', 'push'],
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.results).toHaveLength(3);
      expect(response.body.results[0].channel).toBe('email');
      expect(response.body.results[0].status).toBe('sent');
    });

    it('should handle notification service failures gracefully', async () => {
      const { sendEmail } = await import('../../services/notificationService');
      (sendEmail as any).mockRejectedValueOnce(new Error('Email service unavailable'));

      const response = await request(app)
        .post('/api/notifications/send')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          userId: patientId,
          type: 'appointment_confirmation',
          title: 'Appointment Confirmed',
          message: 'Your appointment has been confirmed',
          channels: ['email'],
        })
        .expect(200);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Email service');
    });

    it('should send scheduled appointment reminders', async () => {
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 1);

      const response = await request(app)
        .post('/api/notifications/schedule-reminder')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          appointmentId: 'test-appointment-reminder',
          scheduledDateTime: futureDate.toISOString(),
          patientId,
          doctorId,
        })
        .expect(200);

      expect(response.body.scheduled).toBe(true);
      expect(response.body.reminderIds).toHaveLength(2); // 1 hour and 10 minutes reminders
    });
  });

  describe('API Rate Limiting and Security', () => {
    it('should enforce rate limits on API endpoints', async () => {
      // Make multiple rapid requests to test rate limiting
      const requests = Array(10).fill(null).map(() =>
        request(app)
          .get('/api/users/doctors/search')
          .set('Authorization', `Bearer ${patientToken}`)
          .query({ specialization: 'Cardiology' })
      );

      const responses = await Promise.all(requests);
      
      // Some requests should be rate limited (429 status)
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should validate API authentication', async () => {
      const response = await request(app)
        .get('/api/appointments')
        .expect(401);

      expect(response.body.error).toContain('authentication');
    });

    it('should validate API authorization', async () => {
      // Patient trying to access admin endpoint
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(403);

      expect(response.body.error).toContain('authorization');
    });
  });
});