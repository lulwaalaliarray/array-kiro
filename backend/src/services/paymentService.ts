import Stripe from 'stripe';
import { PrismaClient, PaymentStatus, AppointmentStatus } from '@prisma/client';
import {
  PaymentIntent,
  PaymentData,
  PaymentResult,
  RefundResult,
  EarningsReport,
  PaymentHistory,
  DateRange,
  WebhookEvent,
  MonthlyEarnings
} from '../types/payment';
import { logger } from '../utils/logger';
import { notificationService } from './notificationService';
import { NotificationType, NotificationChannel } from '../types/notification';

const prisma = new PrismaClient();

class PaymentService {
  private stripe: Stripe;

  constructor() {
    if (!process.env['STRIPE_SECRET_KEY']) {
      throw new Error('STRIPE_SECRET_KEY is required');
    }
    this.stripe = new Stripe(process.env['STRIPE_SECRET_KEY'], {
      apiVersion: '2025-09-30.clover',
    });
  }

  async createPaymentIntent(appointmentId: string, amount: number): Promise<PaymentIntent> {
    try {
      // Get appointment details
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          patient: { include: { user: true } },
          doctor: { include: { user: true } }
        }
      });

      if (!appointment) {
        throw new Error('Appointment not found');
      }

      if (appointment.status !== 'PAYMENT_PENDING') {
        throw new Error('Appointment is not in payment pending status');
      }

      // Check if payment already exists
      let payment = await prisma.payment.findUnique({
        where: { appointmentId }
      });

      let paymentIntent: Stripe.PaymentIntent;

      if (payment && payment.stripePaymentIntentId) {
        // Retrieve existing payment intent
        paymentIntent = await this.stripe.paymentIntents.retrieve(payment.stripePaymentIntentId);
      } else {
        // Create new payment intent
        paymentIntent = await this.stripe.paymentIntents.create({
          amount: Math.round(amount * 100), // Convert to cents
          currency: 'usd',
          metadata: {
            appointmentId,
            patientId: appointment.patientId,
            doctorId: appointment.doctorId,
          },
          description: `Payment for appointment with Dr. ${appointment.doctor.name}`,
        });

        // Create or update payment record
        if (payment) {
          payment = await prisma.payment.update({
            where: { id: payment.id },
            data: {
              stripePaymentIntentId: paymentIntent.id,
              amount,
              updatedAt: new Date()
            }
          });
        } else {
          payment = await prisma.payment.create({
            data: {
              appointmentId,
              amount,
              currency: 'USD',
              status: PaymentStatus.PENDING,
              stripePaymentIntentId: paymentIntent.id,
            }
          });
        }
      }

      return {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret!,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
      };
    } catch (error) {
      logger.error('Error creating payment intent:', error);
      throw error;
    }
  }

  async processPayment(paymentData: PaymentData): Promise<PaymentResult> {
    try {
      const { appointmentId } = paymentData;

      // Get payment record
      const payment = await prisma.payment.findUnique({
        where: { appointmentId },
        include: {
          appointment: {
            include: {
              patient: true,
              doctor: true
            }
          }
        }
      });

      if (!payment || !payment.stripePaymentIntentId) {
        throw new Error('Payment intent not found');
      }

      // Retrieve payment intent from Stripe
      const paymentIntent = await this.stripe.paymentIntents.retrieve(payment.stripePaymentIntentId);

      if (paymentIntent.status === 'succeeded') {
        // Update payment status
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.COMPLETED,
            processedAt: new Date(),
          }
        });

        // Update appointment status
        const updatedAppointment = await prisma.appointment.update({
          where: { id: appointmentId },
          data: {
            status: AppointmentStatus.CONFIRMED,
            paymentStatus: PaymentStatus.COMPLETED,
          },
          include: {
            patient: { include: { user: true } },
            doctor: { include: { user: true } }
          }
        });

        // Send payment confirmation notifications
        try {
          const notificationData = {
            appointmentId: updatedAppointment.id,
            patientName: updatedAppointment.patient.name,
            doctorName: updatedAppointment.doctor.name,
            appointmentDateTime: updatedAppointment.scheduledDateTime,
            appointmentType: updatedAppointment.type,
            paymentAmount: Number(payment.amount),
          };

          // Notify patient
          await notificationService.createNotification({
            userId: updatedAppointment.patient.userId,
            type: NotificationType.PAYMENT_CONFIRMED,
            title: 'Payment Confirmed',
            message: `Your payment has been processed successfully. Your appointment with Dr. ${updatedAppointment.doctor.name} is now confirmed.`,
            data: notificationData,
            channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
          });

          // Notify doctor
          await notificationService.createNotification({
            userId: updatedAppointment.doctor.userId,
            type: NotificationType.PAYMENT_CONFIRMED,
            title: 'Payment Received',
            message: `Payment confirmed for appointment with ${updatedAppointment.patient.name}.`,
            data: notificationData,
            channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
          });
        } catch (notificationError) {
          logger.error('Failed to send payment confirmation notifications:', notificationError);
          // Don't fail the payment processing if notifications fail
        }

        logger.info(`Payment processed successfully for appointment ${appointmentId}`);

        return {
          success: true,
          paymentId: payment.id,
          status: 'completed',
          message: 'Payment processed successfully'
        };
      } else {
        return {
          success: false,
          paymentId: payment.id,
          status: paymentIntent.status,
          message: 'Payment not completed'
        };
      }
    } catch (error) {
      logger.error('Error processing payment:', error);
      throw error;
    }
  }

  async refundPayment(paymentId: string, reason: string): Promise<RefundResult> {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          appointment: true
        }
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== PaymentStatus.COMPLETED) {
        throw new Error('Payment is not in completed status');
      }

      if (!payment.stripePaymentIntentId) {
        throw new Error('Stripe payment intent ID not found');
      }

      // Create refund in Stripe
      const refund = await this.stripe.refunds.create({
        payment_intent: payment.stripePaymentIntentId,
        reason: 'requested_by_customer',
        metadata: {
          appointmentId: payment.appointmentId,
          refundReason: reason,
        }
      });

      // Update payment record
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.REFUNDED,
          refundedAt: new Date(),
          refundReason: reason,
        }
      });

      // Update appointment status
      await prisma.appointment.update({
        where: { id: payment.appointmentId },
        data: {
          paymentStatus: PaymentStatus.REFUNDED,
        }
      });

      logger.info(`Refund processed successfully for payment ${paymentId}`);

      return {
        success: true,
        refundId: refund.id,
        amount: refund.amount / 100,
        status: refund.status || 'pending',
        message: 'Refund processed successfully'
      };
    } catch (error) {
      logger.error('Error processing refund:', error);
      throw error;
    }
  }

  async getDoctorEarnings(doctorId: string, period: DateRange): Promise<EarningsReport> {
    try {
      const { startDate, endDate } = period;

      // Get completed payments for the doctor in the specified period
      const payments = await prisma.payment.findMany({
        where: {
          status: PaymentStatus.COMPLETED,
          processedAt: {
            gte: startDate,
            lte: endDate,
          },
          appointment: {
            doctorId,
          }
        },
        include: {
          appointment: true
        }
      });

      const totalEarnings = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
      const totalAppointments = payments.length;

      // Calculate monthly breakdown
      const monthlyMap = new Map<string, MonthlyEarnings>();

      payments.forEach(payment => {
        if (payment.processedAt) {
          const date = new Date(payment.processedAt);
          const key = `${date.getFullYear()}-${date.getMonth()}`;
          const monthName = date.toLocaleString('default', { month: 'long' });

          if (!monthlyMap.has(key)) {
            monthlyMap.set(key, {
              month: monthName,
              year: date.getFullYear(),
              earnings: 0,
              appointmentCount: 0,
            });
          }

          const monthlyData = monthlyMap.get(key)!;
          monthlyData.earnings += Number(payment.amount);
          monthlyData.appointmentCount += 1;
        }
      });

      const monthlyBreakdown = Array.from(monthlyMap.values()).sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return new Date(`${a.month} 1, ${a.year}`).getMonth() - new Date(`${b.month} 1, ${b.year}`).getMonth();
      });

      return {
        doctorId,
        totalEarnings,
        totalAppointments,
        period,
        monthlyBreakdown,
      };
    } catch (error) {
      logger.error('Error getting doctor earnings:', error);
      throw error;
    }
  }

  async getPaymentHistory(userId: string, userRole: 'patient' | 'doctor'): Promise<PaymentHistory[]> {
    try {
      const whereClause = userRole === 'patient' 
        ? { appointment: { patientId: userId } }
        : { appointment: { doctorId: userId } };

      const payments = await prisma.payment.findMany({
        where: whereClause,
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

      return payments.map(payment => {
        const result: PaymentHistory = {
          id: payment.id,
          appointmentId: payment.appointmentId,
          amount: Number(payment.amount),
          currency: payment.currency,
          status: payment.status,
          createdAt: payment.createdAt,
          appointment: {
            id: payment.appointment.id,
            scheduledDateTime: payment.appointment.scheduledDateTime,
            type: payment.appointment.type,
            patient: {
              name: payment.appointment.patient.name,
            },
            doctor: {
              name: payment.appointment.doctor.name,
            },
          },
        };
        
        if (payment.processedAt) {
          result.processedAt = payment.processedAt;
        }
        if (payment.refundedAt) {
          result.refundedAt = payment.refundedAt;
        }
        if (payment.refundReason) {
          result.refundReason = payment.refundReason;
        }
        
        return result;
      });
    } catch (error) {
      logger.error('Error getting payment history:', error);
      throw error;
    }
  }

  async handleWebhook(event: WebhookEvent): Promise<void> {
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;
        case 'refund.created':
          await this.handleRefundCreated(event.data.object);
          break;
        default:
          logger.info(`Unhandled webhook event type: ${event.type}`);
      }
    } catch (error) {
      logger.error('Error handling webhook:', error);
      throw error;
    }
  }

  private async handlePaymentSucceeded(paymentIntent: any): Promise<void> {
    const appointmentId = paymentIntent.metadata?.appointmentId;
    if (!appointmentId) return;

    await prisma.payment.updateMany({
      where: {
        stripePaymentIntentId: paymentIntent.id,
      },
      data: {
        status: PaymentStatus.COMPLETED,
        processedAt: new Date(),
      }
    });

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: AppointmentStatus.CONFIRMED,
        paymentStatus: PaymentStatus.COMPLETED,
      }
    });

    logger.info(`Payment succeeded for appointment ${appointmentId}`);
  }

  private async handlePaymentFailed(paymentIntent: any): Promise<void> {
    const appointmentId = paymentIntent.metadata?.appointmentId;
    if (!appointmentId) return;

    await prisma.payment.updateMany({
      where: {
        stripePaymentIntentId: paymentIntent.id,
      },
      data: {
        status: PaymentStatus.FAILED,
      }
    });

    logger.info(`Payment failed for appointment ${appointmentId}`);
  }

  private async handleRefundCreated(refund: any): Promise<void> {
    await prisma.payment.updateMany({
      where: {
        stripePaymentIntentId: refund.payment_intent,
      },
      data: {
        status: PaymentStatus.REFUNDED,
        refundedAt: new Date(),
      }
    });

    logger.info(`Refund created for payment intent ${refund.payment_intent}`);
  }

  async validatePaymentTiming(appointmentId: string): Promise<boolean> {
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId }
      });

      if (!appointment) {
        throw new Error('Appointment not found');
      }

      const now = new Date();
      const appointmentTime = new Date(appointment.scheduledDateTime);
      const timeDifference = appointmentTime.getTime() - now.getTime();
      const minutesUntilAppointment = timeDifference / (1000 * 60);

      // Must pay at least 15 minutes before appointment
      return minutesUntilAppointment >= 15;
    } catch (error) {
      logger.error('Error validating payment timing:', error);
      throw error;
    }
  }
}

export const paymentService = new PaymentService();