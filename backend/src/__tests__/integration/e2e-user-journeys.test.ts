import request from 'supertest';
import app from '../../index';
import { PrismaClient } from '@prisma/client';
import { AuthUtils } from '../../utils/auth';

const prisma = new PrismaClient();

describe('End-to-End User Journeys Integration Tests', () => {
  let patientToken: string;
  let doctorToken: string;
  let adminToken: string;
  let patientId: string;
  let doctorId: string;
  let adminId: string;
  let appointmentId: string;

  beforeAll(async () => {
    // Clean up test data
    await prisma.appointment.deleteMany({});
    await prisma.payment.deleteMany({});
    await prisma.user.deleteMany({});

    // Create test users
    const patientUser = await prisma.user.create({
      data: {
        email: 'patient@e2etest.com',
        password: '$2a$10$test.hash.for.patient',
        role: 'PATIENT',
        isVerified: true,
        isActive: true,
        patientProfile: {
          create: {
            name: 'Test Patient',
            age: 30,
            gender: 'female',
            phone: '+1234567890',
            address: '123 Test St, Test City, Test State, 12345, USA',
          },
        },
      },
      include: { patientProfile: true },
    });

    const doctorUser = await prisma.user.create({
      data: {
        email: 'doctor@e2etest.com',
        password: '$2a$10$test.hash.for.doctor',
        role: 'DOCTOR',
        isVerified: true,
        isActive: true,
        doctorProfile: {
          create: {
            name: 'Dr. Test Doctor',
            profilePicture: 'test-doctor.jpg',
            medicalLicenseNumber: 'MD123456',
            licenseVerified: true,
            qualifications: ['MBBS', 'MD'],
            yearsOfExperience: 10,
            specializations: ['Cardiology'],
            phone: '+1234567891',
            clinicName: 'Test Clinic',
            clinicAddress: '456 Medical St, Medical City, Medical State, 54321, USA',
            consultationFee: 500,
            rating: 4.5,
            totalReviews: 100,
            isAcceptingPatients: true,
          },
        },
      },
      include: { doctorProfile: true },
    });

    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@e2etest.com',
        password: '$2a$10$test.hash.for.admin',
        role: 'ADMIN',
        isVerified: true,
        isActive: true,
        adminProfile: {
          create: {
            name: 'Test Admin',
            phone: '+1234567892',
          },
        },
      },
      include: { adminProfile: true },
    });

    patientId = patientUser.id;
    doctorId = doctorUser.id;
    adminId = adminUser.id;

    patientToken = AuthUtils.generateAccessToken({ userId: patientId, email: 'patient@e2etest.com', role: 'PATIENT' });
    doctorToken = AuthUtils.generateAccessToken({ userId: doctorId, email: 'doctor@e2etest.com', role: 'DOCTOR' });
    adminToken = AuthUtils.generateAccessToken({ userId: adminId, email: 'admin@e2etest.com', role: 'ADMIN' });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.appointment.deleteMany({});
    await prisma.payment.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  describe('Complete Patient Journey: Registration to Appointment Completion', () => {
    it('should complete full patient journey from search to appointment completion', async () => {
      // Step 1: Patient searches for doctors
      const searchResponse = await request(app)
        .get('/api/v1/users/doctors/search')
        .set('Authorization', `Bearer ${patientToken}`)
        .query({
          specialization: 'Cardiology',
          location: 'Medical City',
          radius: 50,
        })
        .expect(200);

      expect(searchResponse.body.doctors).toHaveLength(1);
      expect(searchResponse.body.doctors[0].name).toBe('Dr. Test Doctor');

      // Step 2: Patient books appointment
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2);

      const bookingResponse = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          doctorId,
          scheduledDateTime: futureDate.toISOString(),
          type: 'ONLINE',
          notes: 'Chest pain consultation',
        })
        .expect(201);

      appointmentId = bookingResponse.body.id;
      expect(bookingResponse.body.status).toBe('AWAITING_ACCEPTANCE');

      // Step 3: Doctor accepts appointment
      const acceptResponse = await request(app)
        .post(`/api/v1/appointments/${appointmentId}/accept`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      expect(acceptResponse.body.status).toBe('PAYMENT_PENDING');

      // Step 4: Patient makes payment
      const paymentIntentResponse = await request(app)
        .post('/api/v1/payments/create-intent')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          appointmentId,
          amount: 500,
          currency: 'INR',
          paymentMethod: 'card',
        })
        .expect(201);

      expect(paymentIntentResponse.body.id).toBeDefined();

      const processPaymentResponse = await request(app)
        .post('/api/v1/payments/process')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          paymentIntentId: paymentIntentResponse.body.id,
          appointmentId,
        })
        .expect(200);

      expect(processPaymentResponse.body.status).toBe('COMPLETED');

      // Step 5: Verify appointment is confirmed
      const appointmentResponse = await request(app)
        .get(`/api/v1/appointments/${appointmentId}`)
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(appointmentResponse.body.status).toBe('CONFIRMED');
      expect(appointmentResponse.body.paymentStatus).toBe('COMPLETED');

      // Step 6: Verify Zoom meeting is created for online appointment
      expect(appointmentResponse.body.zoomMeetingId).toBeDefined();

      // Step 7: Complete appointment
      const completeResponse = await request(app)
        .post(`/api/v1/appointments/${appointmentId}/complete`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          consultationNotes: 'Patient examined, prescribed medication',
          prescriptions: [
            {
              medication: 'Aspirin',
              dosage: '75mg daily',
              duration: '30 days',
            },
          ],
        })
        .expect(200);

      expect(completeResponse.body.status).toBe('COMPLETED');

      // Step 8: Patient submits review
      const reviewResponse = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          appointmentId,
          rating: 5,
          comment: 'Excellent consultation, very helpful doctor',
        })
        .expect(201);

      expect(reviewResponse.body.rating).toBe(5);
    });
  });

  describe('Doctor Journey: Profile Setup to Earnings', () => {
    it('should complete doctor journey from profile setup to receiving earnings', async () => {
      // Step 1: Doctor updates profile
      const profileResponse = await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          consultationFee: 600,
          availableSlots: [
            {
              dayOfWeek: 1,
              startTime: '09:00',
              endTime: '17:00',
            },
          ],
        })
        .expect(200);

      expect(profileResponse.body.consultationFee).toBe(600);

      // Step 2: Check earnings after completed appointment
      const earningsResponse = await request(app)
        .get('/api/v1/payments/earnings')
        .set('Authorization', `Bearer ${doctorToken}`)
        .query({
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString(),
        })
        .expect(200);

      expect(earningsResponse.body.totalEarnings).toBeGreaterThan(0);
      expect(earningsResponse.body.appointments).toHaveLength(1);
    });
  });

  describe('Admin Journey: User Management and Analytics', () => {
    it('should complete admin journey managing users and viewing analytics', async () => {
      // Step 1: Admin views all users
      const usersResponse = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(usersResponse.body.users.length).toBeGreaterThanOrEqual(3);

      // Step 2: Admin views system analytics
      const analyticsResponse = await request(app)
        .get('/api/v1/admin/analytics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(analyticsResponse.body.totalAppointments).toBeGreaterThanOrEqual(1);
      expect(analyticsResponse.body.totalRevenue).toBeGreaterThan(0);
      expect(analyticsResponse.body.totalUsers).toBeGreaterThanOrEqual(3);

      // Step 3: Admin monitors payments
      const paymentsResponse = await request(app)
        .get('/api/v1/admin/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(paymentsResponse.body.payments.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle appointment booking conflicts gracefully', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3);

      // Try to book appointment at same time slot
      const conflictResponse = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          doctorId,
          scheduledDateTime: futureDate.toISOString(),
          type: 'ONLINE',
          notes: 'Another consultation',
        })
        .expect(409);

      expect(conflictResponse.body.error).toContain('time slot');
    });

    it('should handle payment failures gracefully', async () => {
      // Create another appointment for payment failure test
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 4);

      const appointmentResponse = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          doctorId,
          scheduledDateTime: futureDate.toISOString(),
          type: 'PHYSICAL',
          notes: 'Payment failure test',
        })
        .expect(201);

      await request(app)
        .post(`/api/v1/appointments/${appointmentResponse.body.id}/accept`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      // Simulate payment failure
      const failedPaymentResponse = await request(app)
        .post('/api/v1/payments/process')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          paymentIntentId: 'invalid-intent-id',
          appointmentId: appointmentResponse.body.id,
        })
        .expect(400);

      expect(failedPaymentResponse.body.error).toBeDefined();
    });
  });

  describe('Data Consistency and Integrity', () => {
    it('should maintain data consistency across all operations', async () => {
      // Verify appointment data consistency
      const patientAppointments = await request(app)
        .get('/api/v1/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      const doctorAppointments = await request(app)
        .get('/api/v1/appointments')
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      // Both should see the same appointment
      const sharedAppointment = patientAppointments.body.appointments.find(
        (apt: any) => apt.id === appointmentId
      );
      const doctorSharedAppointment = doctorAppointments.body.appointments.find(
        (apt: any) => apt.id === appointmentId
      );

      expect(sharedAppointment).toBeDefined();
      expect(doctorSharedAppointment).toBeDefined();
      expect(sharedAppointment.status).toBe(doctorSharedAppointment.status);
      expect(sharedAppointment.scheduledDateTime).toBe(doctorSharedAppointment.scheduledDateTime);
    });
  });
});