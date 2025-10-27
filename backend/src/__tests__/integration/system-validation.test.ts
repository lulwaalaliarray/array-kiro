import request from 'supertest';
import { app } from '../../index';
import { PrismaClient } from '@prisma/client';
import { generateToken } from '../../utils/auth';
import { vi } from 'vitest';

const prisma = new PrismaClient();

describe('System Validation Integration Tests', () => {
  let patientToken: string;
  let doctorToken: string;
  let adminToken: string;
  let patientId: string;
  let doctorId: string;
  let adminId: string;

  beforeAll(async () => {
    // Clean up test data
    await prisma.appointment.deleteMany({});
    await prisma.payment.deleteMany({});
    await prisma.review.deleteMany({});
    await prisma.medicalDocument.deleteMany({});
    await prisma.user.deleteMany({});

    // Create comprehensive test users
    const patientUser = await prisma.user.create({
      data: {
        email: 'system.patient@test.com',
        passwordHash: '$2a$10$test.hash.for.patient',
        role: 'patient',
        isVerified: true,
        isActive: true,
        profile: {
          create: {
            name: 'System Test Patient',
            age: 35,
            gender: 'male',
            contactInfo: { 
              phone: '+1234567890',
              email: 'system.patient@test.com'
            },
            address: {
              street: '123 System Test St',
              city: 'Test City',
              state: 'Test State',
              zipCode: '12345',
              country: 'USA',
            },
            emergencyContact: {
              name: 'Emergency Contact',
              phone: '+1234567899',
              relationship: 'Spouse',
            },
          },
        },
      },
    });

    const doctorUser = await prisma.user.create({
      data: {
        email: 'system.doctor@test.com',
        passwordHash: '$2a$10$test.hash.for.doctor',
        role: 'doctor',
        isVerified: true,
        isActive: true,
        profile: {
          create: {
            name: 'Dr. System Test',
            profilePicture: 'system-doctor.jpg',
            medicalLicenseNumber: 'SYS123456',
            licenseVerificationStatus: 'verified',
            qualifications: ['MBBS', 'MD Internal Medicine', 'Fellowship Cardiology'],
            yearsOfExperience: 15,
            specializations: ['Cardiology', 'Internal Medicine', 'Preventive Medicine'],
            contactInfo: { 
              phone: '+1234567891',
              email: 'system.doctor@test.com'
            },
            clinicInfo: {
              name: 'System Test Medical Center',
              address: {
                street: '456 Medical Plaza',
                city: 'Medical City',
                state: 'Medical State',
                zipCode: '54321',
                country: 'USA',
              },
              contactInfo: { phone: '+1234567891' },
              facilities: ['ECG', 'Echocardiogram', 'Stress Test', 'Holter Monitor'],
            },
            consultationFee: 750,
            rating: 4.8,
            totalReviews: 150,
            isAcceptingPatients: true,
            availableSlots: [
              {
                dayOfWeek: 1, // Monday
                startTime: '09:00',
                endTime: '17:00',
              },
              {
                dayOfWeek: 2, // Tuesday
                startTime: '09:00',
                endTime: '17:00',
              },
            ],
          },
        },
      },
    });

    const adminUser = await prisma.user.create({
      data: {
        email: 'system.admin@test.com',
        passwordHash: '$2a$10$test.hash.for.admin',
        role: 'admin',
        isVerified: true,
        isActive: true,
        profile: {
          create: {
            name: 'System Test Admin',
            permissions: [
              'user_management',
              'doctor_verification',
              'payment_monitoring',
              'system_analytics',
              'dispute_resolution',
            ],
          },
        },
      },
    });

    patientId = patientUser.id;
    doctorId = doctorUser.id;
    adminId = adminUser.id;

    patientToken = generateToken({ userId: patientId, role: 'patient' });
    doctorToken = generateToken({ userId: doctorId, role: 'doctor' });
    adminToken = generateToken({ userId: adminId, role: 'admin' });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.appointment.deleteMany({});
    await prisma.payment.deleteMany({});
    await prisma.review.deleteMany({});
    await prisma.medicalDocument.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  describe('Complete System Workflow Validation', () => {
    let appointmentId: string;
    let paymentId: string;

    it('should validate complete patient care workflow from registration to review', async () => {
      // Step 1: Patient searches for doctors by specialization and location
      const searchResponse = await request(app)
        .get('/api/users/doctors/search')
        .set('Authorization', `Bearer ${patientToken}`)
        .query({
          specialization: 'Cardiology',
          location: 'Medical City',
          radius: 50,
          minRating: 4.0,
        })
        .expect(200);

      expect(searchResponse.body.doctors).toHaveLength(1);
      expect(searchResponse.body.doctors[0].name).toBe('Dr. System Test');
      expect(searchResponse.body.doctors[0].specializations).toContain('Cardiology');
      expect(searchResponse.body.doctors[0].rating).toBeGreaterThanOrEqual(4.0);

      // Step 2: Patient views doctor profile details
      const doctorProfileResponse = await request(app)
        .get(`/api/users/doctors/${doctorId}`)
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(doctorProfileResponse.body.name).toBe('Dr. System Test');
      expect(doctorProfileResponse.body.qualifications).toContain('MBBS');
      expect(doctorProfileResponse.body.yearsOfExperience).toBe(15);
      expect(doctorProfileResponse.body.consultationFee).toBe(750);

      // Step 3: Patient uploads medical history before booking
      const medicalDocResponse = await request(app)
        .post('/api/medical-history/upload')
        .set('Authorization', `Bearer ${patientToken}`)
        .attach('file', Buffer.from('fake medical report'), 'medical-report.pdf')
        .field('description', 'Recent ECG report')
        .field('documentType', 'lab_report')
        .expect(201);

      expect(medicalDocResponse.body.fileName).toBe('medical-report.pdf');
      expect(medicalDocResponse.body.documentType).toBe('lab_report');

      // Step 4: Patient books appointment
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3); // 3 days from now
      futureDate.setHours(14, 0, 0, 0); // 2 PM

      const bookingResponse = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          doctorId,
          scheduledDateTime: futureDate.toISOString(),
          type: 'online',
          notes: 'Experiencing chest pain and irregular heartbeat. Have recent ECG report.',
        })
        .expect(201);

      appointmentId = bookingResponse.body.id;
      expect(bookingResponse.body.status).toBe('awaiting_acceptance');
      expect(bookingResponse.body.type).toBe('online');
      expect(bookingResponse.body.notes).toContain('chest pain');

      // Step 5: Doctor reviews appointment request and patient medical history
      const appointmentDetailsResponse = await request(app)
        .get(`/api/appointments/${appointmentId}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      expect(appointmentDetailsResponse.body.patient.name).toBe('System Test Patient');
      expect(appointmentDetailsResponse.body.notes).toContain('chest pain');

      const patientMedicalHistoryResponse = await request(app)
        .get(`/api/medical-history/patient/${patientId}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      expect(patientMedicalHistoryResponse.body.documents).toHaveLength(1);
      expect(patientMedicalHistoryResponse.body.documents[0].description).toBe('Recent ECG report');

      // Step 6: Doctor accepts appointment
      const acceptResponse = await request(app)
        .post(`/api/appointments/${appointmentId}/accept`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          notes: 'Appointment accepted. Will review ECG report before consultation.',
        })
        .expect(200);

      expect(acceptResponse.body.status).toBe('payment_pending');

      // Step 7: Patient receives notification and proceeds to payment
      const paymentIntentResponse = await request(app)
        .post('/api/payments/create-intent')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          appointmentId,
          amount: 750,
          currency: 'INR',
          paymentMethod: 'card',
        })
        .expect(201);

      expect(paymentIntentResponse.body.amount).toBe(750);
      expect(paymentIntentResponse.body.currency).toBe('inr');

      // Step 8: Patient completes payment
      const processPaymentResponse = await request(app)
        .post('/api/payments/process')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          paymentIntentId: paymentIntentResponse.body.id,
          appointmentId,
        })
        .expect(200);

      paymentId = processPaymentResponse.body.id;
      expect(processPaymentResponse.body.status).toBe('completed');

      // Step 9: Verify appointment is confirmed and Zoom meeting is created
      const confirmedAppointmentResponse = await request(app)
        .get(`/api/appointments/${appointmentId}`)
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(confirmedAppointmentResponse.body.status).toBe('confirmed');
      expect(confirmedAppointmentResponse.body.paymentStatus).toBe('completed');
      expect(confirmedAppointmentResponse.body.zoomMeetingId).toBeDefined();

      // Step 10: Get Zoom meeting details for online consultation
      const zoomMeetingResponse = await request(app)
        .get(`/api/zoom/meeting/${confirmedAppointmentResponse.body.zoomMeetingId}`)
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(zoomMeetingResponse.body.joinUrl).toBeDefined();
      expect(zoomMeetingResponse.body.password).toBeDefined();

      // Step 11: Doctor completes consultation
      const completeAppointmentResponse = await request(app)
        .post(`/api/appointments/${appointmentId}/complete`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          consultationNotes: 'Patient examined via video consultation. ECG shows minor irregularities. Prescribed medication and follow-up recommended.',
          prescriptions: [
            {
              medication: 'Metoprolol',
              dosage: '25mg twice daily',
              duration: '30 days',
              instructions: 'Take with food',
            },
            {
              medication: 'Aspirin',
              dosage: '81mg daily',
              duration: '90 days',
              instructions: 'Take in the morning',
            },
          ],
          followUpRequired: true,
          followUpDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days later
        })
        .expect(200);

      expect(completeAppointmentResponse.body.status).toBe('completed');
      expect(completeAppointmentResponse.body.consultationNotes).toContain('ECG shows minor irregularities');
      expect(completeAppointmentResponse.body.prescriptions).toHaveLength(2);
      expect(completeAppointmentResponse.body.followUpRequired).toBe(true);

      // Step 12: Patient submits review and rating
      const reviewResponse = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          appointmentId,
          rating: 5,
          comment: 'Excellent consultation. Dr. System Test was very thorough and explained everything clearly. The online consultation worked perfectly.',
        })
        .expect(201);

      expect(reviewResponse.body.rating).toBe(5);
      expect(reviewResponse.body.comment).toContain('Excellent consultation');

      // Step 13: Verify doctor's updated rating and earnings
      const updatedDoctorResponse = await request(app)
        .get(`/api/users/doctors/${doctorId}`)
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(updatedDoctorResponse.body.totalReviews).toBe(151); // Was 150, now 151
      expect(updatedDoctorResponse.body.rating).toBeGreaterThanOrEqual(4.8);

      const doctorEarningsResponse = await request(app)
        .get('/api/payments/earnings')
        .set('Authorization', `Bearer ${doctorToken}`)
        .query({
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString(),
        })
        .expect(200);

      expect(doctorEarningsResponse.body.totalEarnings).toBeGreaterThan(0);
      expect(doctorEarningsResponse.body.appointments).toHaveLength(1);
    });

    it('should validate admin oversight and system management', async () => {
      // Step 1: Admin views system analytics
      const analyticsResponse = await request(app)
        .get('/api/admin/analytics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(analyticsResponse.body.totalAppointments).toBeGreaterThanOrEqual(1);
      expect(analyticsResponse.body.totalRevenue).toBeGreaterThan(0);
      expect(analyticsResponse.body.totalUsers).toBeGreaterThanOrEqual(3);
      expect(analyticsResponse.body.averageRating).toBeGreaterThan(0);

      // Step 2: Admin monitors payment transactions
      const paymentsResponse = await request(app)
        .get('/api/admin/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString(),
        })
        .expect(200);

      expect(paymentsResponse.body.payments.length).toBeGreaterThanOrEqual(1);
      expect(paymentsResponse.body.totalAmount).toBeGreaterThan(0);

      // Step 3: Admin reviews user management
      const usersResponse = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          role: 'doctor',
          verificationStatus: 'verified',
        })
        .expect(200);

      expect(usersResponse.body.users.length).toBeGreaterThanOrEqual(1);
      expect(usersResponse.body.users[0].profile.licenseVerificationStatus).toBe('verified');

      // Step 4: Admin views appointment management
      const appointmentsResponse = await request(app)
        .get('/api/admin/appointments')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          status: 'completed',
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString(),
        })
        .expect(200);

      expect(appointmentsResponse.body.appointments.length).toBeGreaterThanOrEqual(1);
      expect(appointmentsResponse.body.appointments[0].status).toBe('completed');
    });
  });

  describe('System Performance and Reliability Validation', () => {
    it('should handle concurrent appointment bookings', async () => {
      // Create multiple patients for concurrent testing
      const patients = await Promise.all([
        prisma.user.create({
          data: {
            email: 'concurrent1@test.com',
            passwordHash: '$2a$10$test.hash',
            role: 'patient',
            isVerified: true,
            isActive: true,
            profile: {
              create: {
                name: 'Concurrent Patient 1',
                age: 30,
                gender: 'female',
                contactInfo: { phone: '+1111111111' },
                address: {
                  street: '111 Test St',
                  city: 'Test City',
                  state: 'Test State',
                  zipCode: '11111',
                  country: 'USA',
                },
              },
            },
          },
        }),
        prisma.user.create({
          data: {
            email: 'concurrent2@test.com',
            passwordHash: '$2a$10$test.hash',
            role: 'patient',
            isVerified: true,
            isActive: true,
            profile: {
              create: {
                name: 'Concurrent Patient 2',
                age: 25,
                gender: 'male',
                contactInfo: { phone: '+2222222222' },
                address: {
                  street: '222 Test St',
                  city: 'Test City',
                  state: 'Test State',
                  zipCode: '22222',
                  country: 'USA',
                },
              },
            },
          },
        }),
      ]);

      const patient1Token = generateToken({ userId: patients[0].id, role: 'patient' });
      const patient2Token = generateToken({ userId: patients[1].id, role: 'patient' });

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      futureDate.setHours(10, 0, 0, 0);

      // Attempt concurrent bookings for the same time slot
      const bookingPromises = [
        request(app)
          .post('/api/appointments')
          .set('Authorization', `Bearer ${patient1Token}`)
          .send({
            doctorId,
            scheduledDateTime: futureDate.toISOString(),
            type: 'online',
            notes: 'Concurrent booking test 1',
          }),
        request(app)
          .post('/api/appointments')
          .set('Authorization', `Bearer ${patient2Token}`)
          .send({
            doctorId,
            scheduledDateTime: futureDate.toISOString(),
            type: 'online',
            notes: 'Concurrent booking test 2',
          }),
      ];

      const results = await Promise.allSettled(bookingPromises);

      // One should succeed, one should fail due to time slot conflict
      const successfulBookings = results.filter(result => 
        result.status === 'fulfilled' && result.value.status === 201
      );
      const failedBookings = results.filter(result => 
        result.status === 'fulfilled' && result.value.status === 409
      );

      expect(successfulBookings).toHaveLength(1);
      expect(failedBookings).toHaveLength(1);

      // Clean up
      await prisma.user.deleteMany({
        where: { id: { in: patients.map(p => p.id) } }
      });
    });

    it('should validate data consistency across operations', async () => {
      // Create appointment
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const appointmentResponse = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          doctorId,
          scheduledDateTime: futureDate.toISOString(),
          type: 'physical',
          notes: 'Data consistency test',
        })
        .expect(201);

      const testAppointmentId = appointmentResponse.body.id;

      // Accept appointment
      await request(app)
        .post(`/api/appointments/${testAppointmentId}/accept`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      // Process payment
      const paymentIntentResponse = await request(app)
        .post('/api/payments/create-intent')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          appointmentId: testAppointmentId,
          amount: 750,
          currency: 'INR',
          paymentMethod: 'upi',
        })
        .expect(201);

      await request(app)
        .post('/api/payments/process')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          paymentIntentId: paymentIntentResponse.body.id,
          appointmentId: testAppointmentId,
        })
        .expect(200);

      // Verify data consistency across all endpoints
      const patientView = await request(app)
        .get(`/api/appointments/${testAppointmentId}`)
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      const doctorView = await request(app)
        .get(`/api/appointments/${testAppointmentId}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      const adminView = await request(app)
        .get(`/api/admin/appointments/${testAppointmentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // All views should show consistent data
      expect(patientView.body.status).toBe('confirmed');
      expect(doctorView.body.status).toBe('confirmed');
      expect(adminView.body.status).toBe('confirmed');

      expect(patientView.body.paymentStatus).toBe('completed');
      expect(doctorView.body.paymentStatus).toBe('completed');
      expect(adminView.body.paymentStatus).toBe('completed');
    });

    it('should handle system errors gracefully', async () => {
      // Test invalid appointment booking
      const invalidBookingResponse = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          doctorId: 'invalid-doctor-id',
          scheduledDateTime: new Date().toISOString(), // Past date
          type: 'online',
          notes: 'Invalid booking test',
        })
        .expect(400);

      expect(invalidBookingResponse.body.error).toBeDefined();

      // Test unauthorized access
      const unauthorizedResponse = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(403);

      expect(unauthorizedResponse.body.error).toContain('authorization');

      // Test invalid payment processing
      const invalidPaymentResponse = await request(app)
        .post('/api/payments/process')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          paymentIntentId: 'invalid-intent-id',
          appointmentId: 'invalid-appointment-id',
        })
        .expect(400);

      expect(invalidPaymentResponse.body.error).toBeDefined();
    });
  });

  describe('Security and Compliance Validation', () => {
    it('should enforce proper authentication and authorization', async () => {
      // Test unauthenticated access
      await request(app)
        .get('/api/appointments')
        .expect(401);

      // Test role-based access control
      await request(app)
        .get('/api/admin/analytics')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(403);

      await request(app)
        .post('/api/appointments/invalid-id/accept')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(403);

      // Test resource ownership
      const otherPatient = await prisma.user.create({
        data: {
          email: 'other.patient@test.com',
          passwordHash: '$2a$10$test.hash',
          role: 'patient',
          isVerified: true,
          isActive: true,
          profile: {
            create: {
              name: 'Other Patient',
              age: 28,
              gender: 'female',
              contactInfo: { phone: '+9999999999' },
              address: {
                street: '999 Other St',
                city: 'Other City',
                state: 'Other State',
                zipCode: '99999',
                country: 'USA',
              },
            },
          },
        },
      });

      const otherPatientToken = generateToken({ userId: otherPatient.id, role: 'patient' });

      // Other patient should not be able to access first patient's appointments
      await request(app)
        .get(`/api/appointments/${appointmentId}`)
        .set('Authorization', `Bearer ${otherPatientToken}`)
        .expect(403);

      // Clean up
      await prisma.user.delete({ where: { id: otherPatient.id } });
    });

    it('should validate input sanitization and data protection', async () => {
      // Test SQL injection prevention
      const maliciousInput = "'; DROP TABLE users; --";
      
      const searchResponse = await request(app)
        .get('/api/users/doctors/search')
        .set('Authorization', `Bearer ${patientToken}`)
        .query({
          specialization: maliciousInput,
        })
        .expect(200);

      // Should return empty results, not cause database error
      expect(searchResponse.body.doctors).toEqual([]);

      // Test XSS prevention
      const xssInput = '<script>alert("xss")</script>';
      
      const appointmentResponse = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          doctorId,
          scheduledDateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          type: 'online',
          notes: xssInput,
        })
        .expect(201);

      // XSS content should be sanitized
      expect(appointmentResponse.body.notes).not.toContain('<script>');
    });

    it('should enforce rate limiting', async () => {
      // Make multiple rapid requests
      const requests = Array(15).fill(null).map(() =>
        request(app)
          .get('/api/users/doctors/search')
          .set('Authorization', `Bearer ${patientToken}`)
          .query({ specialization: 'Cardiology' })
      );

      const responses = await Promise.all(requests);
      
      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
});