import request from 'supertest';
import app from '../../index';
import { PrismaClient } from '@prisma/client';
import { AuthUtils } from '../../utils/auth';

const prisma = new PrismaClient();

describe('Comprehensive System Validation Tests', () => {
  let patientToken: string;
  let doctorToken: string;
  let adminToken: string;
  let patientId: string;
  let doctorId: string;
  let adminId: string;

  beforeAll(async () => {
    // Clean up test data
    await prisma.review.deleteMany({});
    await prisma.payment.deleteMany({});
    await prisma.appointment.deleteMany({});
    await prisma.medicalDocument.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.zoomMeeting.deleteMany({});
    await prisma.patientProfile.deleteMany({});
    await prisma.doctorProfile.deleteMany({});
    await prisma.adminProfile.deleteMany({});
    await prisma.user.deleteMany({});

    // Create comprehensive test users
    const patientUser = await prisma.user.create({
      data: {
        email: 'validation.patient@test.com',
        password: '$2a$10$test.hash.for.patient',
        role: 'PATIENT',
        isVerified: true,
        isActive: true,
        patientProfile: {
          create: {
            name: 'Validation Test Patient',
            age: 32,
            gender: 'female',
            phone: '+1234567890',
            address: '123 Validation St, Test City, Test State, 12345, USA',
          },
        },
      },
      include: { patientProfile: true },
    });

    const doctorUser = await prisma.user.create({
      data: {
        email: 'validation.doctor@test.com',
        password: '$2a$10$test.hash.for.doctor',
        role: 'DOCTOR',
        isVerified: true,
        isActive: true,
        doctorProfile: {
          create: {
            name: 'Dr. Validation Test',
            medicalLicenseNumber: 'VAL123456',
            licenseVerified: true,
            qualifications: ['MBBS', 'MD Internal Medicine'],
            yearsOfExperience: 8,
            specializations: ['Internal Medicine', 'General Practice'],
            phone: '+1234567891',
            clinicName: 'Validation Medical Center',
            clinicAddress: '456 Medical Ave, Medical City, Medical State, 54321, USA',
            consultationFee: 500,
            rating: 4.6,
            totalReviews: 75,
            isAcceptingPatients: true,
          },
        },
      },
      include: { doctorProfile: true },
    });  
  const adminUser = await prisma.user.create({
      data: {
        email: 'validation.admin@test.com',
        password: '$2a$10$test.hash.for.admin',
        role: 'ADMIN',
        isVerified: true,
        isActive: true,
        adminProfile: {
          create: {
            name: 'Validation Test Admin',
            phone: '+1234567892',
          },
        },
      },
      include: { adminProfile: true },
    });

    patientId = patientUser.id;
    doctorId = doctorUser.id;
    adminId = adminUser.id;

    patientToken = AuthUtils.generateAccessToken({ 
      userId: patientId, 
      email: 'validation.patient@test.com', 
      role: 'PATIENT' 
    });
    doctorToken = AuthUtils.generateAccessToken({ 
      userId: doctorId, 
      email: 'validation.doctor@test.com', 
      role: 'DOCTOR' 
    });
    adminToken = AuthUtils.generateAccessToken({ 
      userId: adminId, 
      email: 'validation.admin@test.com', 
      role: 'ADMIN' 
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.review.deleteMany({});
    await prisma.payment.deleteMany({});
    await prisma.appointment.deleteMany({});
    await prisma.medicalDocument.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.zoomMeeting.deleteMany({});
    await prisma.patientProfile.deleteMany({});
    await prisma.doctorProfile.deleteMany({});
    await prisma.adminProfile.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  describe('All Requirements Validation', () => {
    it('should validate all 11 core requirements through complete workflows', async () => {
      // Requirement 1: User Registration and Profile Management
      const profileResponse = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(profileResponse.body.name).toBe('Validation Test Patient');
      expect(profileResponse.body.age).toBe(32);
      expect(profileResponse.body.gender).toBe('female');

      // Requirement 2: Location-based Doctor Search
      const searchResponse = await request(app)
        .get('/api/v1/users/doctors/search')
        .set('Authorization', `Bearer ${patientToken}`)
        .query({
          specialization: 'Internal Medicine',
          location: 'Medical City',
          radius: 50,
        })
        .expect(200);

      expect(searchResponse.body.doctors).toHaveLength(1);
      expect(searchResponse.body.doctors[0].specializations).toContain('Internal Medicine');

      // Requirement 3: Appointment Booking with Time Constraints
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2); // 48 hours advance
      futureDate.setHours(14, 0, 0, 0);

      const appointmentResponse = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          doctorId,
          scheduledDateTime: futureDate.toISOString(),
          type: 'ONLINE',
          notes: 'Requirements validation appointment',
        })
        .expect(201);

      expect(appointmentResponse.body.status).toBe('AWAITING_ACCEPTANCE');

      // Test 24-hour minimum constraint
      const tooSoonDate = new Date();
      tooSoonDate.setHours(tooSoonDate.getHours() + 12); // Only 12 hours advance

      const tooSoonResponse = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          doctorId,
          scheduledDateTime: tooSoonDate.toISOString(),
          type: 'PHYSICAL',
          notes: 'Too soon appointment',
        })
        .expect(400);

      expect(tooSoonResponse.body.error).toContain('24 hours');

      // Requirement 4: Doctor Appointment Management
      const acceptResponse = await request(app)
        .post(`/api/v1/appointments/${appointmentResponse.body.id}/accept`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          acceptanceNotes: 'Appointment accepted for validation test',
        })
        .expect(200);

      expect(acceptResponse.body.status).toBe('PAYMENT_PENDING');

      // Requirement 5: Secure Payment Processing
      const paymentIntentResponse = await request(app)
        .post('/api/v1/payments/create-intent')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          appointmentId: appointmentResponse.body.id,
          amount: 500,
          currency: 'INR',
          paymentMethod: 'card',
        })
        .expect(201);

      expect(paymentIntentResponse.body.amount).toBe(500);

      const processPaymentResponse = await request(app)
        .post('/api/v1/payments/process')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          paymentIntentId: paymentIntentResponse.body.id,
          appointmentId: appointmentResponse.body.id,
        })
        .expect(200);

      expect(processPaymentResponse.body.status).toBe('COMPLETED');

      // Requirement 6: Video Consultation Integration
      const confirmedAppointment = await request(app)
        .get(`/api/v1/appointments/${appointmentResponse.body.id}`)
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(confirmedAppointment.body.status).toBe('CONFIRMED');
      expect(confirmedAppointment.body.zoomMeetingId).toBeDefined();

      const zoomMeetingResponse = await request(app)
        .get(`/api/v1/zoom/meeting/${confirmedAppointment.body.zoomMeetingId}`)
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(zoomMeetingResponse.body.joinUrl).toBeDefined();
      expect(zoomMeetingResponse.body.password).toBeDefined();

      // Requirement 7: Medical History Management
      const medicalDocResponse = await request(app)
        .post('/api/v1/medical-history/upload')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          fileName: 'validation-test-report.pdf',
          fileUrl: 'https://test-storage.com/validation-report.pdf',
          fileType: 'pdf',
          documentType: 'LAB_REPORT',
          description: 'Validation test medical report',
        })
        .expect(201);

      expect(medicalDocResponse.body.fileName).toBe('validation-test-report.pdf');

      const medicalHistoryResponse = await request(app)
        .get(`/api/v1/medical-history/patient/${patientId}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      expect(medicalHistoryResponse.body.documents).toHaveLength(1);

      // Requirement 8: Rating and Review System
      const completeResponse = await request(app)
        .post(`/api/v1/appointments/${appointmentResponse.body.id}/complete`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          consultationNotes: 'Validation test consultation completed successfully',
          prescriptions: [
            {
              medication: 'Validation Medicine',
              dosage: '1 tablet daily',
              duration: '7 days',
            },
          ],
        })
        .expect(200);

      expect(completeResponse.body.status).toBe('COMPLETED');

      const reviewResponse = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          appointmentId: appointmentResponse.body.id,
          rating: 5,
          comment: 'Excellent validation test consultation',
        })
        .expect(201);

      expect(reviewResponse.body.rating).toBe(5);

      // Requirement 9: Notification System
      const notificationsResponse = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(notificationsResponse.body.notifications.length).toBeGreaterThan(0);

      // Requirement 10: Admin Management
      const adminAnalyticsResponse = await request(app)
        .get('/api/v1/admin/analytics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(adminAnalyticsResponse.body.totalAppointments).toBeGreaterThanOrEqual(1);
      expect(adminAnalyticsResponse.body.totalRevenue).toBeGreaterThan(0);

      // Requirement 11: Security and Scalability
      const unauthorizedResponse = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(403);

      expect(unauthorizedResponse.body.error).toContain('Forbidden');

      // Test data encryption by verifying sensitive data is not exposed
      const userDataResponse = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(userDataResponse.body.password).toBeUndefined();
      expect(userDataResponse.body.passwordHash).toBeUndefined();
    });
  });

  describe('System Performance and Reliability', () => {
    it('should handle concurrent operations without data corruption', async () => {
      // Create multiple test appointments concurrently
      const concurrentAppointments = [];
      for (let i = 0; i < 5; i++) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 3 + i);
        futureDate.setHours(10 + i, 0, 0, 0);

        concurrentAppointments.push(
          request(app)
            .post('/api/v1/appointments')
            .set('Authorization', `Bearer ${patientToken}`)
            .send({
              doctorId,
              scheduledDateTime: futureDate.toISOString(),
              type: i % 2 === 0 ? 'ONLINE' : 'PHYSICAL',
              notes: `Concurrent test appointment ${i + 1}`,
            })
        );
      }

      const results = await Promise.all(concurrentAppointments);
      
      // All appointments should be created successfully
      results.forEach((result, index) => {
        expect(result.status).toBe(201);
        expect(result.body.notes).toBe(`Concurrent test appointment ${index + 1}`);
      });

      // Verify data integrity
      const allAppointments = await request(app)
        .get('/api/v1/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(allAppointments.body.appointments.length).toBeGreaterThanOrEqual(5);
    });

    it('should maintain system stability under error conditions', async () => {
      // Test invalid data handling
      const invalidAppointmentResponse = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          doctorId: 'invalid-doctor-id',
          scheduledDateTime: 'invalid-date',
          type: 'INVALID_TYPE',
          notes: '',
        })
        .expect(400);

      expect(invalidAppointmentResponse.body.error).toBeDefined();

      // Test system recovery after errors
      const validAppointmentResponse = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          doctorId,
          scheduledDateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          type: 'ONLINE',
          notes: 'Recovery test appointment',
        })
        .expect(201);

      expect(validAppointmentResponse.body.status).toBe('AWAITING_ACCEPTANCE');
    });
  });
});