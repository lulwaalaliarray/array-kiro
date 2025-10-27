// Set environment variable before importing
process.env['STRIPE_SECRET_KEY'] = 'sk_test_123';

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: jest.fn(),
      retrieve: jest.fn(),
    },
    refunds: {
      create: jest.fn(),
    },
    webhooks: {
      constructEvent: jest.fn(),
    },
  }));
});

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    appointment: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    payment: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      findMany: jest.fn(),
    },
  })),
  PaymentStatus: {
    PENDING: 'PENDING',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED',
    REFUNDED: 'REFUNDED',
  },
  AppointmentStatus: {
    AWAITING_ACCEPTANCE: 'AWAITING_ACCEPTANCE',
    PAYMENT_PENDING: 'PAYMENT_PENDING',
    CONFIRMED: 'CONFIRMED',
    CANCELLED: 'CANCELLED',
    COMPLETED: 'COMPLETED',
    REJECTED: 'REJECTED',
  },
}));

import { paymentService } from '../../services/paymentService';
import { PaymentStatus, AppointmentStatus } from '@prisma/client';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';
import Stripe from 'stripe';

// Get mocked instances
const mockStripe = new Stripe('sk_test_123', { apiVersion: '2025-09-30.clover' }) as jest.Mocked<Stripe>;
const { PrismaClient } = require('@prisma/client');
const mockPrisma = new PrismaClient() as any;

describe('PaymentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env['STRIPE_SECRET_KEY'] = 'sk_test_123';
  });

  describe('createPaymentIntent', () => {
    const mockAppointment = {
      id: 'appointment-123',
      patientId: 'patient-123',
      doctorId: 'doctor-123',
      status: 'PAYMENT_PENDING',
      patient: { user: { email: 'patient@test.com' } },
      doctor: { name: 'Dr. Smith', user: { email: 'doctor@test.com' } }
    };

    it('should create a new payment intent successfully', async () => {
      mockPrisma.appointment.findUnique.mockResolvedValue(mockAppointment);
      mockPrisma.payment.findUnique.mockResolvedValue(null);
      
      mockStripe.paymentIntents.create.mockResolvedValue({
        id: 'pi_test_123',
        client_secret: 'pi_test_123_secret',
        amount: 10000,
        currency: 'usd',
        status: 'requires_payment_method',
      });

      mockPrisma.payment.create.mockResolvedValue({
        id: 'payment-123',
        appointmentId: 'appointment-123',
        amount: 100,
        stripePaymentIntentId: 'pi_test_123',
      });

      const result = await paymentService.createPaymentIntent('appointment-123', 100);

      expect(result).toEqual({
        id: 'pi_test_123',
        clientSecret: 'pi_test_123_secret',
        amount: 100,
        currency: 'usd',
        status: 'requires_payment_method',
      });

      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith({
        amount: 10000,
        currency: 'usd',
        metadata: {
          appointmentId: 'appointment-123',
          patientId: 'patient-123',
          doctorId: 'doctor-123',
        },
        description: 'Payment for appointment with Dr. Smith',
      });
    });

    it('should throw error if appointment not found', async () => {
      mockPrisma.appointment.findUnique.mockResolvedValue(null);

      await expect(paymentService.createPaymentIntent('invalid-id', 100))
        .rejects.toThrow('Appointment not found');
    });

    it('should throw error if appointment not in payment pending status', async () => {
      mockPrisma.appointment.findUnique.mockResolvedValue({
        ...mockAppointment,
        status: 'CONFIRMED'
      });

      await expect(paymentService.createPaymentIntent('appointment-123', 100))
        .rejects.toThrow('Appointment is not in payment pending status');
    });

    it('should retrieve existing payment intent if already exists', async () => {
      mockPrisma.appointment.findUnique.mockResolvedValue(mockAppointment);
      mockPrisma.payment.findUnique.mockResolvedValue({
        id: 'payment-123',
        stripePaymentIntentId: 'pi_existing_123',
      });

      mockStripe.paymentIntents.retrieve.mockResolvedValue({
        id: 'pi_existing_123',
        client_secret: 'pi_existing_123_secret',
        amount: 10000,
        currency: 'usd',
        status: 'requires_payment_method',
      });

      const result = await paymentService.createPaymentIntent('appointment-123', 100);

      expect(mockStripe.paymentIntents.retrieve).toHaveBeenCalledWith('pi_existing_123');
      expect(result.id).toBe('pi_existing_123');
    });
  });

  describe('processPayment', () => {
    const mockPayment = {
      id: 'payment-123',
      appointmentId: 'appointment-123',
      stripePaymentIntentId: 'pi_test_123',
      appointment: {
        id: 'appointment-123',
        patient: { name: 'John Doe' },
        doctor: { name: 'Dr. Smith' }
      }
    };

    it('should process successful payment', async () => {
      mockPrisma.payment.findUnique.mockResolvedValue(mockPayment);
      mockStripe.paymentIntents.retrieve.mockResolvedValue({
        id: 'pi_test_123',
        status: 'succeeded',
      });

      mockPrisma.payment.update.mockResolvedValue(mockPayment);
      mockPrisma.appointment.update.mockResolvedValue({});

      const result = await paymentService.processPayment({
        appointmentId: 'appointment-123',
        amount: 100,
        currency: 'USD',
      });

      expect(result).toEqual({
        success: true,
        paymentId: 'payment-123',
        status: 'completed',
        message: 'Payment processed successfully'
      });

      expect(mockPrisma.payment.update).toHaveBeenCalledWith({
        where: { id: 'payment-123' },
        data: {
          status: PaymentStatus.COMPLETED,
          processedAt: expect.any(Date),
        }
      });

      expect(mockPrisma.appointment.update).toHaveBeenCalledWith({
        where: { id: 'appointment-123' },
        data: {
          status: AppointmentStatus.CONFIRMED,
          paymentStatus: PaymentStatus.COMPLETED,
        }
      });
    });

    it('should handle failed payment', async () => {
      mockPrisma.payment.findUnique.mockResolvedValue(mockPayment);
      mockStripe.paymentIntents.retrieve.mockResolvedValue({
        id: 'pi_test_123',
        status: 'requires_payment_method',
      });

      const result = await paymentService.processPayment({
        appointmentId: 'appointment-123',
        amount: 100,
        currency: 'USD',
      });

      expect(result).toEqual({
        success: false,
        paymentId: 'payment-123',
        status: 'requires_payment_method',
        message: 'Payment not completed'
      });
    });

    it('should throw error if payment not found', async () => {
      mockPrisma.payment.findUnique.mockResolvedValue(null);

      await expect(paymentService.processPayment({
        appointmentId: 'invalid-id',
        amount: 100,
        currency: 'USD',
      })).rejects.toThrow('Payment intent not found');
    });
  });

  describe('refundPayment', () => {
    const mockPayment = {
      id: 'payment-123',
      appointmentId: 'appointment-123',
      status: PaymentStatus.COMPLETED,
      stripePaymentIntentId: 'pi_test_123',
      appointment: { id: 'appointment-123' }
    };

    it('should process refund successfully', async () => {
      mockPrisma.payment.findUnique.mockResolvedValue(mockPayment);
      mockStripe.refunds.create.mockResolvedValue({
        id: 'ref_test_123',
        amount: 10000,
        status: 'succeeded',
      });

      mockPrisma.payment.update.mockResolvedValue(mockPayment);
      mockPrisma.appointment.update.mockResolvedValue({});

      const result = await paymentService.refundPayment('payment-123', 'Customer request');

      expect(result).toEqual({
        success: true,
        refundId: 'ref_test_123',
        amount: 100,
        status: 'succeeded',
        message: 'Refund processed successfully'
      });

      expect(mockStripe.refunds.create).toHaveBeenCalledWith({
        payment_intent: 'pi_test_123',
        reason: 'requested_by_customer',
        metadata: {
          appointmentId: 'appointment-123',
          refundReason: 'Customer request',
        }
      });
    });

    it('should throw error if payment not found', async () => {
      mockPrisma.payment.findUnique.mockResolvedValue(null);

      await expect(paymentService.refundPayment('invalid-id', 'reason'))
        .rejects.toThrow('Payment not found');
    });

    it('should throw error if payment not completed', async () => {
      mockPrisma.payment.findUnique.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.PENDING
      });

      await expect(paymentService.refundPayment('payment-123', 'reason'))
        .rejects.toThrow('Payment is not in completed status');
    });
  });

  describe('getDoctorEarnings', () => {
    it('should calculate doctor earnings correctly', async () => {
      const mockPayments = [
        {
          id: 'payment-1',
          amount: 100,
          processedAt: new Date('2024-01-15'),
          appointment: { id: 'appointment-1' }
        },
        {
          id: 'payment-2',
          amount: 150,
          processedAt: new Date('2024-01-20'),
          appointment: { id: 'appointment-2' }
        },
        {
          id: 'payment-3',
          amount: 200,
          processedAt: new Date('2024-02-10'),
          appointment: { id: 'appointment-3' }
        }
      ];

      mockPrisma.payment.findMany.mockResolvedValue(mockPayments);

      const result = await paymentService.getDoctorEarnings('doctor-123', {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-02-28')
      });

      expect(result.doctorId).toBe('doctor-123');
      expect(result.totalEarnings).toBe(450);
      expect(result.totalAppointments).toBe(3);
      expect(result.monthlyBreakdown).toHaveLength(2);
      
      // Check January earnings
      const januaryEarnings = result.monthlyBreakdown.find(m => m.month === 'January');
      expect(januaryEarnings?.earnings).toBe(250);
      expect(januaryEarnings?.appointmentCount).toBe(2);
      
      // Check February earnings
      const februaryEarnings = result.monthlyBreakdown.find(m => m.month === 'February');
      expect(februaryEarnings?.earnings).toBe(200);
      expect(februaryEarnings?.appointmentCount).toBe(1);
    });

    it('should handle empty earnings', async () => {
      mockPrisma.payment.findMany.mockResolvedValue([]);

      const result = await paymentService.getDoctorEarnings('doctor-123', {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31')
      });

      expect(result.totalEarnings).toBe(0);
      expect(result.totalAppointments).toBe(0);
      expect(result.monthlyBreakdown).toHaveLength(0);
    });
  });

  describe('handleWebhook', () => {
    it('should handle payment_intent.succeeded webhook', async () => {
      const webhookEvent = {
        id: 'evt_test_123',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_123',
            metadata: {
              appointmentId: 'appointment-123'
            }
          }
        }
      };

      mockPrisma.payment.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.appointment.update.mockResolvedValue({});

      await paymentService.handleWebhook(webhookEvent);

      expect(mockPrisma.payment.updateMany).toHaveBeenCalledWith({
        where: {
          stripePaymentIntentId: 'pi_test_123',
        },
        data: {
          status: PaymentStatus.COMPLETED,
          processedAt: expect.any(Date),
        }
      });

      expect(mockPrisma.appointment.update).toHaveBeenCalledWith({
        where: { id: 'appointment-123' },
        data: {
          status: AppointmentStatus.CONFIRMED,
          paymentStatus: PaymentStatus.COMPLETED,
        }
      });
    });

    it('should handle payment_intent.payment_failed webhook', async () => {
      const webhookEvent = {
        id: 'evt_test_123',
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: 'pi_test_123',
            metadata: {
              appointmentId: 'appointment-123'
            }
          }
        }
      };

      mockPrisma.payment.updateMany.mockResolvedValue({ count: 1 });

      await paymentService.handleWebhook(webhookEvent);

      expect(mockPrisma.payment.updateMany).toHaveBeenCalledWith({
        where: {
          stripePaymentIntentId: 'pi_test_123',
        },
        data: {
          status: PaymentStatus.FAILED,
        }
      });
    });

    it('should handle refund.created webhook', async () => {
      const webhookEvent = {
        id: 'evt_test_123',
        type: 'refund.created',
        data: {
          object: {
            id: 'ref_test_123',
            payment_intent: 'pi_test_123'
          }
        }
      };

      mockPrisma.payment.updateMany.mockResolvedValue({ count: 1 });

      await paymentService.handleWebhook(webhookEvent);

      expect(mockPrisma.payment.updateMany).toHaveBeenCalledWith({
        where: {
          stripePaymentIntentId: 'pi_test_123',
        },
        data: {
          status: PaymentStatus.REFUNDED,
          refundedAt: expect.any(Date),
        }
      });
    });

    it('should handle unknown webhook types gracefully', async () => {
      const webhookEvent = {
        id: 'evt_test_123',
        type: 'unknown.event',
        data: {
          object: {}
        }
      };

      // Should not throw error
      await expect(paymentService.handleWebhook(webhookEvent)).resolves.toBeUndefined();
    });
  });

  describe('validatePaymentTiming', () => {
    it('should validate payment timing correctly - valid timing', async () => {
      const futureDate = new Date();
      futureDate.setMinutes(futureDate.getMinutes() + 30); // 30 minutes from now

      mockPrisma.appointment.findUnique.mockResolvedValue({
        id: 'appointment-123',
        scheduledDateTime: futureDate
      });

      const result = await paymentService.validatePaymentTiming('appointment-123');
      expect(result).toBe(true);
    });

    it('should validate payment timing correctly - invalid timing', async () => {
      const nearFutureDate = new Date();
      nearFutureDate.setMinutes(nearFutureDate.getMinutes() + 10); // 10 minutes from now

      mockPrisma.appointment.findUnique.mockResolvedValue({
        id: 'appointment-123',
        scheduledDateTime: nearFutureDate
      });

      const result = await paymentService.validatePaymentTiming('appointment-123');
      expect(result).toBe(false);
    });

    it('should throw error if appointment not found', async () => {
      mockPrisma.appointment.findUnique.mockResolvedValue(null);

      await expect(paymentService.validatePaymentTiming('invalid-id'))
        .rejects.toThrow('Appointment not found');
    });
  });

  describe('getPaymentHistory', () => {
    it('should get payment history for patient', async () => {
      const mockPayments = [
        {
          id: 'payment-1',
          appointmentId: 'appointment-1',
          amount: 100,
          currency: 'USD',
          status: PaymentStatus.COMPLETED,
          createdAt: new Date('2024-01-15'),
          processedAt: new Date('2024-01-15'),
          refundedAt: null,
          refundReason: null,
          appointment: {
            id: 'appointment-1',
            scheduledDateTime: new Date('2024-01-20'),
            type: 'online',
            patient: { name: 'John Doe' },
            doctor: { name: 'Dr. Smith' }
          }
        }
      ];

      mockPrisma.payment.findMany.mockResolvedValue(mockPayments);

      const result = await paymentService.getPaymentHistory('patient-123', 'patient');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'payment-1',
        appointmentId: 'appointment-1',
        amount: 100,
        currency: 'USD',
        status: PaymentStatus.COMPLETED,
        createdAt: expect.any(Date),
        processedAt: expect.any(Date),
        appointment: {
          id: 'appointment-1',
          scheduledDateTime: expect.any(Date),
          type: 'online',
          patient: { name: 'John Doe' },
          doctor: { name: 'Dr. Smith' }
        }
      });

      expect(mockPrisma.payment.findMany).toHaveBeenCalledWith({
        where: { appointment: { patientId: 'patient-123' } },
        include: {
          appointment: {
            include: {
              patient: true,
              doctor: true,
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    });

    it('should get payment history for doctor', async () => {
      mockPrisma.payment.findMany.mockResolvedValue([]);

      await paymentService.getPaymentHistory('doctor-123', 'doctor');

      expect(mockPrisma.payment.findMany).toHaveBeenCalledWith({
        where: { appointment: { doctorId: 'doctor-123' } },
        include: {
          appointment: {
            include: {
              patient: true,
              doctor: true,
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    });
  });
});