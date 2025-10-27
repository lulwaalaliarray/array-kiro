import request from 'supertest';
import app from '../../index';
import { PrismaClient } from '@prisma/client';
import { AuthUtils } from '../../utils/auth';

const prisma = new PrismaClient();

describe('Comprehensive End-to-End Tests', () => {
  let patientToken: string;
  let doctorToken: string;
  let adminToken: string;
  let patientId: string;
  let doctorId: string;
  let adminId: string;
  let appointmentId: string;
  let paymentId: string | undefined;

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

    // Create comprehensive test users with full profiles
    const patientUser = await prisma.user.create({
      data: {
        email: 'comprehensive.patient@e2etest.com',
        password: '$2a$10$test.hash.for.patient',
        role: 'PATIENT',
        isVerified: true,
        isActive: true,
        patientProfile: {
          create: {
            name: 'Comprehensive Test Patient',
            age: 35,
            gender: 'male',
            phone: '+1234567890',
            address: '123 Comprehensive Test St, Test City, Test State, 12345, USA',
          },
        },
      },
      include: { patientProfile: true },
    });

    const doctorUser = await prisma.user.create({
      data: {
        email: 'comprehensive.doctor@e2etest.com',
        password: '$2a$10$test.hash.for.doctor',
        role: 'DOCTOR',
        isVerified: true,
        isActive: true,
        doctorProfile: {
          create: {
            name: 'Dr. Comprehensive Test',
            profilePicture: 'comprehensive-doctor.jpg',
            medicalLicenseNumber: 'COMP123456',
            licenseVerified: true,
            qualifications: ['MBBS', 'MD', 'Fellowship in Cardiology'],
            yearsOfExperience: 15,
            specializations: ['Cardiology', 'Internal Medicine', 'Preventive Medicine'],
            phone: '+1234567891',
            clinicName: 'Comprehensive Heart Care Center',
            clinicAddress: '456 Medical Excellence Blvd, Healthcare City, Medical State, 54321, USA',
            consultationFee: 750,
            rating: 4.8,
            totalReviews: 250,
            isAcceptingPatients: true,
          },
        },
      },
      include: { doctorProfile: true },
    });

    const adminUser = await prisma.user.create({
      data: {
        email: 'comprehensive.admin@e2etest.com',
        password: '$2a$10$test.hash.for.admin',
        role: 'ADMIN',
        isVerified: true,
        isActive: true,
        adminProfile: {
          create: {
            name: 'Comprehensive Test Admin',
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
      email: 'comprehensive.patient@e2etest.com', 
      role: 'PATIENT' 
    });
    doctorToken = AuthUtils.generateAccessToken({ 
      userId: doctorId, 
      email: 'comprehensive.doctor@e2etest.com', 
      role: 'DOCTOR' 
    });
    adminToken = AuthUtils.generateAccessToken({ 
      userId: adminId, 
      email: 'comprehensive.admin@e2etest.com', 
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

  describe('Complete Patient Appointment Booking Journey', () => {
    it('should complete the entire patient journey from registration to review submission', async () => {
      // Step 1: Patient searches for doctors by specialization and location
      const searchResponse = await request(app)
        .get('/api/v1/users/doctors/search')
        .set('Authorization', `Bearer ${patientToken}`)
        .query({
          specialization: 'Cardiology',
          location: 'Healthcare City',
          radius: 100,
          minRating: 4.0,
        })
        .expect(200);

      expect(searchResponse.body.doctors).toHaveLength(1);
      expect(searchResponse.body.doctors[0].name).toBe('Dr. Comprehensive Test');
      expect(searchResponse.body.doctors[0].specializations).toContain('Cardiology');
      expect(searchResponse.body.doctors[0].rating).toBe(4.8);

      // Validate search filters work correctly
      const filteredSearchResponse = await request(app)
        .get('/api/v1/users/doctors/search')
        .set('Authorization', `Bearer ${patientToken}`)
        .query({
          specialization: 'Dermatology', // Different specialization
          location: 'Healthcare City',
          radius: 100,
          minRating: 4.0,
        })
        .expect(200);

      expect(filteredSearchResponse.body.doctors).toHaveLength(0);

      // Step 2: Patient uploads medical history before booking
      const medicalDocResponse = await request(app)
        .post('/api/v1/medical-history/upload')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          fileName: 'previous-ecg-report.pdf',
          fileUrl: 'https://test-storage.com/ecg-report.pdf',
          fileType: 'pdf',
          documentType: 'LAB_REPORT',
          description: 'Previous ECG report showing irregular heartbeat',
        })
        .expect(201);

      expect(medicalDocResponse.body.fileName).toBe('previous-ecg-report.pdf');
      expect(medicalDocResponse.body.documentType).toBe('LAB_REPORT');

      // Step 3: Patient books online consultation appointment
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2);
      futureDate.setHours(14, 0, 0, 0); // 2 PM appointment

      const bookingResponse = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          doctorId,
          scheduledDateTime: futureDate.toISOString(),
          type: 'ONLINE',
          notes: 'Experiencing chest pain and irregular heartbeat. Have uploaded previous ECG report.',
        })
        .expect(201);

      appointmentId = bookingResponse.body.id;
      expect(bookingResponse.body.status).toBe('AWAITING_ACCEPTANCE');
      expect(bookingResponse.body.type).toBe('ONLINE');
      expect(bookingResponse.body.paymentStatus).toBe('PENDING');

      // Step 4: Doctor reviews appointment request and patient medical history
      const medicalHistoryResponse = await request(app)
        .get(`/api/v1/medical-history/patient/${patientId}`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      expect(medicalHistoryResponse.body.documents).toHaveLength(1);
      expect(medicalHistoryResponse.body.documents[0].documentType).toBe('LAB_REPORT');

      // Step 5: Doctor accepts the appointment
      const acceptResponse = await request(app)
        .post(`/api/v1/appointments/${appointmentId}/accept`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          acceptanceNotes: 'Reviewed medical history. Will conduct thorough cardiac evaluation.',
        })
        .expect(200);

      expect(acceptResponse.body.status).toBe('PAYMENT_PENDING');

      // Step 6: Patient receives notification about appointment acceptance
      const notificationsResponse = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      const acceptanceNotification = notificationsResponse.body.notifications.find(
        (n: any) => n.type === 'APPOINTMENT_ACCEPTED'
      );
      expect(acceptanceNotification).toBeDefined();
      expect(acceptanceNotification.title).toContain('Appointment Accepted');

      // Step 7: Patient creates payment intent
      const paymentIntentResponse = await request(app)
        .post('/api/v1/payments/create-intent')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          appointmentId,
          amount: 750,
          currency: 'INR',
          paymentMethod: 'card',
        })
        .expect(201);

      expect(paymentIntentResponse.body.id).toBeDefined();
      expect(paymentIntentResponse.body.amount).toBe(750);

      // Step 8: Patient processes payment successfully
      const processPaymentResponse = await request(app)
        .post('/api/v1/payments/process')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          paymentIntentId: paymentIntentResponse.body.id,
          appointmentId,
          paymentMethodId: 'pm_test_card_visa',
        })
        .expect(200);

      paymentId = processPaymentResponse.body.id;
      expect(processPaymentResponse.body.status).toBe('COMPLETED');

      // Step 9: Verify appointment is confirmed and Zoom meeting is created
      const confirmedAppointmentResponse = await request(app)
        .get(`/api/v1/appointments/${appointmentId}`)
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(confirmedAppointmentResponse.body.status).toBe('CONFIRMED');
      expect(confirmedAppointmentResponse.body.paymentStatus).toBe('COMPLETED');
      expect(confirmedAppointmentResponse.body.zoomMeetingId).toBeDefined();

      // Step 10: Verify Zoom meeting details are available
      const zoomMeetingResponse = await request(app)
        .get(`/api/v1/zoom/meeting/${confirmedAppointmentResponse.body.zoomMeetingId}`)
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(zoomMeetingResponse.body.joinUrl).toBeDefined();
      expect(zoomMeetingResponse.body.password).toBeDefined();
      expect(zoomMeetingResponse.body.startTime).toBeDefined();

      // Step 11: Both patient and doctor receive appointment reminders
      // Simulate time passing to trigger reminder notifications
      const reminderResponse = await request(app)
        .post('/api/v1/notifications/send-reminders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          appointmentId,
          reminderType: 'one_hour_before',
        })
        .expect(200);

      expect(reminderResponse.body.sent).toBe(true);

      // Step 12: Doctor completes the appointment with detailed notes
      const completeResponse = await request(app)
        .post(`/api/v1/appointments/${appointmentId}/complete`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          consultationNotes: 'Conducted comprehensive cardiac evaluation. Patient shows signs of mild arrhythmia. Recommended lifestyle changes and follow-up in 3 months.',
          prescriptions: [
            {
              medication: 'Metoprolol',
              dosage: '25mg twice daily',
              duration: '30 days',
              instructions: 'Take with food. Monitor blood pressure.',
            },
            {
              medication: 'Aspirin',
              dosage: '81mg daily',
              duration: '90 days',
              instructions: 'Take in the morning with breakfast.',
            },
          ],
          followUpRequired: true,
          followUpDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .expect(200);

      expect(completeResponse.body.status).toBe('COMPLETED');
      expect(completeResponse.body.consultationNotes).toContain('comprehensive cardiac evaluation');
      expect(completeResponse.body.followUpRequired).toBe(true);

      // Step 13: Patient submits detailed review and rating
      const reviewResponse = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          appointmentId,
          rating: 5,
          comment: 'Excellent consultation! Dr. Comprehensive Test was very thorough and explained everything clearly. The online consultation was smooth and professional. Highly recommend!',
        })
        .expect(201);

      expect(reviewResponse.body.rating).toBe(5);
      expect(reviewResponse.body.comment).toContain('Excellent consultation');

      // Step 14: Verify doctor's rating is updated
      const updatedDoctorResponse = await request(app)
        .get(`/api/v1/users/doctors/${doctorId}`)
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      expect(updatedDoctorResponse.body.totalReviews).toBe(251);
      expect(parseFloat(updatedDoctorResponse.body.rating)).toBeGreaterThan(4.8);

      // Step 15: Verify payment history is recorded correctly
      const paymentHistoryResponse = await request(app)
        .get('/api/v1/payments/history')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      const appointmentPayment = paymentHistoryResponse.body.payments.find(
        (p: any) => p.appointmentId === appointmentId
      );
      expect(appointmentPayment).toBeDefined();
      expect(appointmentPayment.amount).toBe(750);
      expect(appointmentPayment.status).toBe('COMPLETED');

      // Step 16: Test appointment cancellation workflow
      const futureAppointmentDate = new Date();
      futureAppointmentDate.setDate(futureAppointmentDate.getDate() + 5);

      const cancelTestAppointment = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          doctorId,
          scheduledDateTime: futureAppointmentDate.toISOString(),
          type: 'PHYSICAL',
          notes: 'Test appointment for cancellation',
        })
        .expect(201);

      await request(app)
        .post(`/api/v1/appointments/${cancelTestAppointment.body.id}/accept`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      // Cancel appointment before payment
      const cancelResponse = await request(app)
        .post(`/api/v1/appointments/${cancelTestAppointment.body.id}/cancel`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          reason: 'Personal emergency',
        })
        .expect(200);

      expect(cancelResponse.body.status).toBe('CANCELLED');
      expect(cancelResponse.body.cancellationReason).toBe('Personal emergency');

      // Step 17: Test appointment rescheduling workflow
      const rescheduleTestDate = new Date();
      rescheduleTestDate.setDate(rescheduleTestDate.getDate() + 7);

      const rescheduleAppointment = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          doctorId,
          scheduledDateTime: rescheduleTestDate.toISOString(),
          type: 'ONLINE',
          notes: 'Test appointment for rescheduling',
        })
        .expect(201);

      await request(app)
        .post(`/api/v1/appointments/${rescheduleAppointment.body.id}/accept`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      const newRescheduleDate = new Date();
      newRescheduleDate.setDate(newRescheduleDate.getDate() + 10);

      const rescheduleResponse = await request(app)
        .post(`/api/v1/appointments/${rescheduleAppointment.body.id}/reschedule`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          newDateTime: newRescheduleDate.toISOString(),
          reason: 'Schedule conflict resolved',
        })
        .expect(200);

      expect(rescheduleResponse.body.scheduledDateTime).toBe(newRescheduleDate.toISOString());
      expect(rescheduleResponse.body.status).toBe('PAYMENT_PENDING');
    });
  });

  describe('Doctor Appointment Management Workflow', () => {
    it('should complete doctor workflow from profile management to earnings tracking', async () => {
      // Step 1: Doctor updates profile with availability and specializations
      const profileUpdateResponse = await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          consultationFee: 800,
          specializations: ['Cardiology', 'Internal Medicine', 'Preventive Medicine', 'Cardiac Surgery'],
          availableSlots: [
            { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
            { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },
            { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' },
            { dayOfWeek: 4, startTime: '09:00', endTime: '17:00' },
            { dayOfWeek: 5, startTime: '09:00', endTime: '15:00' },
          ],
          isAcceptingPatients: true,
          clinicInfo: {
            name: 'Advanced Cardiac Care Center',
            facilities: ['ECG', 'Echo', 'Stress Test', 'Holter Monitor', 'CT Angiography'],
          },
        })
        .expect(200);

      expect(profileUpdateResponse.body.consultationFee).toBe(800);
      expect(profileUpdateResponse.body.specializations).toHaveLength(4);

      // Step 2: Doctor views incoming appointment requests
      const appointmentRequestsResponse = await request(app)
        .get('/api/v1/appointments/requests')
        .set('Authorization', `Bearer ${doctorToken}`)
        .query({
          status: 'AWAITING_ACCEPTANCE',
        })
        .expect(200);

      // Should include any pending requests
      expect(Array.isArray(appointmentRequestsResponse.body.appointments)).toBe(true);

      // Step 3: Doctor views completed appointments and earnings
      const completedAppointmentsResponse = await request(app)
        .get('/api/v1/appointments')
        .set('Authorization', `Bearer ${doctorToken}`)
        .query({
          status: 'COMPLETED',
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString(),
        })
        .expect(200);

      expect(completedAppointmentsResponse.body.appointments.length).toBeGreaterThanOrEqual(1);

      // Step 4: Doctor checks detailed earnings report
      const earningsResponse = await request(app)
        .get('/api/v1/payments/earnings')
        .set('Authorization', `Bearer ${doctorToken}`)
        .query({
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString(),
          detailed: true,
        })
        .expect(200);

      expect(earningsResponse.body.totalEarnings).toBeGreaterThan(0);
      expect(earningsResponse.body.appointmentCount).toBeGreaterThanOrEqual(1);
      expect(earningsResponse.body.averageConsultationFee).toBeGreaterThan(0);
      expect(Array.isArray(earningsResponse.body.monthlyBreakdown)).toBe(true);

      // Step 5: Doctor views patient reviews and feedback
      const reviewsResponse = await request(app)
        .get('/api/v1/reviews/doctor')
        .set('Authorization', `Bearer ${doctorToken}`)
        .query({
          limit: 10,
          offset: 0,
        })
        .expect(200);

      expect(reviewsResponse.body.reviews.length).toBeGreaterThanOrEqual(1);
      expect(reviewsResponse.body.averageRating).toBeGreaterThan(4.0);
      expect(reviewsResponse.body.totalReviews).toBeGreaterThanOrEqual(1);

      // Step 6: Doctor manages notification preferences
      const notificationPrefsResponse = await request(app)
        .put('/api/v1/notifications/preferences')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          emailEnabled: true,
          pushEnabled: true,
          inAppEnabled: true,
          appointmentReminders: true,
          appointmentUpdates: true,
          paymentNotifications: true,
          newPatientAlerts: true,
        })
        .expect(200);

      expect(notificationPrefsResponse.body.emailEnabled).toBe(true);
      expect(notificationPrefsResponse.body.appointmentReminders).toBe(true);

      // Step 7: Doctor handles appointment rejection workflow
      const rejectionTestDate = new Date();
      rejectionTestDate.setDate(rejectionTestDate.getDate() + 8);

      const rejectionTestAppointment = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          doctorId,
          scheduledDateTime: rejectionTestDate.toISOString(),
          type: 'PHYSICAL',
          notes: 'Test appointment for rejection',
        })
        .expect(201);

      const rejectResponse = await request(app)
        .post(`/api/v1/appointments/${rejectionTestAppointment.body.id}/reject`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          reason: 'Schedule conflict',
          notes: 'Unable to accommodate due to emergency surgery scheduled',
        })
        .expect(200);

      expect(rejectResponse.body.status).toBe('REJECTED');
      expect(rejectResponse.body.rejectionReason).toBe('Schedule conflict');

      // Step 8: Doctor manages availability slots
      const availabilityResponse = await request(app)
        .put('/api/v1/users/availability')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          availableSlots: [
            { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
            { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },
            { dayOfWeek: 3, startTime: '09:00', endTime: '15:00' },
            { dayOfWeek: 4, startTime: '10:00', endTime: '18:00' },
            { dayOfWeek: 5, startTime: '09:00', endTime: '14:00' },
          ],
          isAcceptingPatients: true,
          maxDailyAppointments: 12,
        })
        .expect(200);

      expect(availabilityResponse.body.availableSlots).toHaveLength(5);
      expect(availabilityResponse.body.isAcceptingPatients).toBe(true);
      expect(availabilityResponse.body.maxDailyAppointments).toBe(12);
    });
  });

  describe('Admin User and System Management Functions', () => {
    it('should complete admin workflow for comprehensive system management', async () => {
      // Step 1: Admin views comprehensive user management dashboard
      const usersOverviewResponse = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          page: 1,
          limit: 50,
          role: 'all',
          status: 'all',
        })
        .expect(200);

      expect(usersOverviewResponse.body.users.length).toBeGreaterThanOrEqual(3);
      expect(usersOverviewResponse.body.totalUsers).toBeGreaterThanOrEqual(3);
      expect(usersOverviewResponse.body.pagination).toBeDefined();

      // Step 2: Admin views detailed system analytics
      const analyticsResponse = await request(app)
        .get('/api/v1/admin/analytics')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          period: '30d',
          includeCharts: true,
        })
        .expect(200);

      expect(analyticsResponse.body.totalUsers).toBeGreaterThanOrEqual(3);
      expect(analyticsResponse.body.totalAppointments).toBeGreaterThanOrEqual(1);
      expect(analyticsResponse.body.totalRevenue).toBeGreaterThan(0);
      expect(analyticsResponse.body.averageRating).toBeGreaterThan(0);
      expect(analyticsResponse.body.userGrowth).toBeDefined();
      expect(analyticsResponse.body.revenueGrowth).toBeDefined();

      // Step 3: Admin monitors payment transactions and reconciliation
      const paymentsResponse = await request(app)
        .get('/api/v1/admin/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          status: 'all',
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString(),
          includeRefunds: true,
        })
        .expect(200);

      expect(paymentsResponse.body.payments.length).toBeGreaterThanOrEqual(1);
      expect(paymentsResponse.body.totalAmount).toBeGreaterThan(0);
      expect(paymentsResponse.body.successfulPayments).toBeGreaterThanOrEqual(1);

      // Step 4: Admin manages doctor verification process
      const doctorVerificationResponse = await request(app)
        .get('/api/v1/admin/doctors/verification-queue')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(doctorVerificationResponse.body.pendingVerifications)).toBe(true);

      // Step 5: Admin views system health and performance metrics
      const systemHealthResponse = await request(app)
        .get('/api/v1/admin/system/health')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(systemHealthResponse.body.status).toBeDefined();
      expect(systemHealthResponse.body.uptime).toBeGreaterThan(0);
      expect(systemHealthResponse.body.metrics).toBeDefined();

      // Step 6: Admin manages notification system
      const notificationStatsResponse = await request(app)
        .get('/api/v1/admin/notifications/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          period: '7d',
        })
        .expect(200);

      expect(notificationStatsResponse.body.totalSent).toBeGreaterThanOrEqual(0);
      expect(notificationStatsResponse.body.deliveryRate).toBeDefined();
      expect(notificationStatsResponse.body.channelBreakdown).toBeDefined();

      // Step 7: Admin reviews appointment disputes and issues
      const disputesResponse = await request(app)
        .get('/api/v1/admin/disputes')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          status: 'all',
          type: 'all',
        })
        .expect(200);

      expect(Array.isArray(disputesResponse.body.disputes)).toBe(true);

      // Step 8: Admin generates comprehensive system report
      const systemReportResponse = await request(app)
        .post('/api/v1/admin/reports/generate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reportType: 'comprehensive',
          period: '30d',
          includeUserMetrics: true,
          includeFinancialMetrics: true,
          includeSystemMetrics: true,
          format: 'json',
        })
        .expect(201);

      expect(systemReportResponse.body.reportId).toBeDefined();
      expect(systemReportResponse.body.status).toBe('generated');
      expect(systemReportResponse.body.data).toBeDefined();
      expect(systemReportResponse.body.data.summary).toBeDefined();
      expect(systemReportResponse.body.data.userMetrics).toBeDefined();
      expect(systemReportResponse.body.data.financialMetrics).toBeDefined();

      // Step 9: Admin handles doctor verification workflow
      const pendingDoctorUser = await prisma.user.create({
        data: {
          email: 'pending.doctor@e2etest.com',
          password: '$2a$10$test.hash.for.pending.doctor',
          role: 'DOCTOR',
          isVerified: true,
          isActive: true,
          doctorProfile: {
            create: {
              name: 'Dr. Pending Verification',
              medicalLicenseNumber: 'PENDING123',
              licenseVerified: false,
              qualifications: ['MBBS'],
              yearsOfExperience: 5,
              specializations: ['General Medicine'],
              phone: '+1234567893',
              clinicName: 'Pending Clinic',
              clinicAddress: '789 Pending St, Pending City, Pending State, 78901, USA',
              consultationFee: 400,
              isAcceptingPatients: false,
            },
          },
        },
      });

      const verifyDoctorResponse = await request(app)
        .post(`/api/v1/admin/doctors/${pendingDoctorUser.id}/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          verificationStatus: 'approved',
          verificationNotes: 'License verified through medical board database',
          licenseExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .expect(200);

      expect(verifyDoctorResponse.body.licenseVerified).toBe(true);
      expect(verifyDoctorResponse.body.verificationStatus).toBe('approved');

      // Step 10: Admin manages system settings and configurations
      const systemSettingsResponse = await request(app)
        .put('/api/v1/admin/system/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          maintenanceMode: false,
          maxConcurrentUsers: 100000,
          appointmentBookingWindow: 48, // hours
          paymentTimeout: 15, // minutes
          autoReminderEnabled: true,
          systemNotificationsEnabled: true,
        })
        .expect(200);

      expect(systemSettingsResponse.body.maxConcurrentUsers).toBe(100000);
      expect(systemSettingsResponse.body.appointmentBookingWindow).toBe(48);
      expect(systemSettingsResponse.body.paymentTimeout).toBe(15);

      // Clean up pending doctor
      await prisma.user.delete({ where: { id: pendingDoctorUser.id } });
    });
  });

  describe('Cross-System Integration and Data Consistency', () => {
    it('should maintain data consistency across all system components', async () => {
      // Verify appointment data consistency across all user types
      const patientAppointments = await request(app)
        .get('/api/v1/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      const doctorAppointments = await request(app)
        .get('/api/v1/appointments')
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      const adminAppointments = await request(app)
        .get('/api/v1/admin/appointments')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Find the shared appointment
      const sharedAppointment = patientAppointments.body.appointments.find(
        (apt: any) => apt.id === appointmentId
      );
      const doctorSharedAppointment = doctorAppointments.body.appointments.find(
        (apt: any) => apt.id === appointmentId
      );
      const adminSharedAppointment = adminAppointments.body.appointments.find(
        (apt: any) => apt.id === appointmentId
      );

      // Verify consistency
      expect(sharedAppointment).toBeDefined();
      expect(doctorSharedAppointment).toBeDefined();
      expect(adminSharedAppointment).toBeDefined();
      
      expect(sharedAppointment.status).toBe(doctorSharedAppointment.status);
      expect(sharedAppointment.status).toBe(adminSharedAppointment.status);
      expect(sharedAppointment.paymentStatus).toBe(doctorSharedAppointment.paymentStatus);
      expect(sharedAppointment.scheduledDateTime).toBe(doctorSharedAppointment.scheduledDateTime);

      // Verify payment consistency
      const patientPayments = await request(app)
        .get('/api/v1/payments/history')
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(200);

      const doctorEarnings = await request(app)
        .get('/api/v1/payments/earnings')
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      const adminPayments = await request(app)
        .get('/api/v1/admin/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const patientPayment = patientPayments.body.payments.find(
        (p: any) => p.appointmentId === appointmentId
      );
      const adminPayment = adminPayments.body.payments.find(
        (p: any) => p.appointmentId === appointmentId
      );

      expect(patientPayment.amount).toBe(adminPayment.amount);
      expect(patientPayment.status).toBe(adminPayment.status);
      expect(doctorEarnings.body.totalEarnings).toBeGreaterThanOrEqual(patientPayment.amount);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle various error scenarios gracefully', async () => {
      // Test appointment booking with invalid doctor ID
      const invalidDoctorResponse = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          doctorId: 'invalid-doctor-id',
          scheduledDateTime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
          type: 'ONLINE',
          notes: 'Test appointment',
        })
        .expect(404);

      expect(invalidDoctorResponse.body.error).toContain('Doctor not found');

      // Test payment with insufficient amount
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);

      const testAppointment = await request(app)
        .post('/api/v1/appointments')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          doctorId,
          scheduledDateTime: futureDate.toISOString(),
          type: 'PHYSICAL',
          notes: 'Test appointment for error handling',
        })
        .expect(201);

      await request(app)
        .post(`/api/v1/appointments/${testAppointment.body.id}/accept`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .expect(200);

      const insufficientPaymentResponse = await request(app)
        .post('/api/v1/payments/create-intent')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          appointmentId: testAppointment.body.id,
          amount: 100, // Less than consultation fee
          currency: 'INR',
          paymentMethod: 'card',
        })
        .expect(400);

      expect(insufficientPaymentResponse.body.error).toContain('amount');

      // Test unauthorized access
      const unauthorizedResponse = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${patientToken}`) // Patient trying to access admin endpoint
        .expect(403);

      expect(unauthorizedResponse.body.error).toContain('Forbidden');

      // Test invalid token
      const invalidTokenResponse = await request(app)
        .get('/api/v1/appointments')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(invalidTokenResponse.body.error).toContain('token');
    });
  });
});