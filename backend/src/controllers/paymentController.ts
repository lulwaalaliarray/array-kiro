import { Request, Response } from 'express';
import { paymentService } from '../services/paymentService';
import { logger } from '../utils/logger';
import Stripe from 'stripe';

export class PaymentController {
  async createPaymentIntent(req: Request, res: Response): Promise<void> {
    try {
      const { appointmentId, amount } = req.body;

      if (!appointmentId || !amount) {
        res.status(400).json({
          error: {
            code: 'MISSING_REQUIRED_FIELDS',
            message: 'Appointment ID and amount are required',
          }
        });
        return;
      }

      // Validate payment timing (15-minute constraint)
      const isValidTiming = await paymentService.validatePaymentTiming(appointmentId);
      if (!isValidTiming) {
        res.status(422).json({
          error: {
            code: 'PAYMENT_TOO_LATE',
            message: 'Payment must be completed at least 15 minutes before appointment time',
          }
        });
        return;
      }

      const paymentIntent = await paymentService.createPaymentIntent(appointmentId, amount);

      res.status(200).json({
        success: true,
        data: paymentIntent
      });
    } catch (error) {
      logger.error('Error creating payment intent:', error);
      res.status(500).json({
        error: {
          code: 'PAYMENT_INTENT_CREATION_FAILED',
          message: 'Failed to create payment intent',
        }
      });
    }
  }

  async confirmPayment(req: Request, res: Response): Promise<void> {
    try {
      const { appointmentId } = req.body;

      if (!appointmentId) {
        res.status(400).json({
          error: {
            code: 'MISSING_APPOINTMENT_ID',
            message: 'Appointment ID is required',
          }
        });
        return;
      }

      const result = await paymentService.processPayment({ appointmentId, amount: 0, currency: 'USD' });

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error confirming payment:', error);
      res.status(500).json({
        error: {
          code: 'PAYMENT_CONFIRMATION_FAILED',
          message: 'Failed to confirm payment',
        }
      });
    }
  }

  async refundPayment(req: Request, res: Response): Promise<void> {
    try {
      const { paymentId } = req.params;
      const { reason } = req.body;

      if (!paymentId) {
        res.status(400).json({
          error: {
            code: 'MISSING_PAYMENT_ID',
            message: 'Payment ID is required',
          }
        });
        return;
      }

      if (!reason) {
        res.status(400).json({
          error: {
            code: 'MISSING_REFUND_REASON',
            message: 'Refund reason is required',
          }
        });
        return;
      }

      const result = await paymentService.refundPayment(paymentId, reason);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error processing refund:', error);
      res.status(500).json({
        error: {
          code: 'REFUND_PROCESSING_FAILED',
          message: 'Failed to process refund',
        }
      });
    }
  }

  async getPaymentHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const userRole = req.user?.role?.toLowerCase() as 'patient' | 'doctor';

      if (!userId || !userRole) {
        res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'User authentication required',
          }
        });
        return;
      }

      if (userRole !== 'patient' && userRole !== 'doctor') {
        res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'Access denied for this user role',
          }
        });
        return;
      }

      const history = await paymentService.getPaymentHistory(userId, userRole);

      res.status(200).json({
        success: true,
        data: history
      });
    } catch (error) {
      logger.error('Error getting payment history:', error);
      res.status(500).json({
        error: {
          code: 'PAYMENT_HISTORY_FETCH_FAILED',
          message: 'Failed to fetch payment history',
        }
      });
    }
  }

  async getDoctorEarnings(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const userRole = req.user?.role;

      if (!userId || userRole !== 'DOCTOR') {
        res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'Access denied. Doctor role required.',
          }
        });
        return;
      }

      const { startDate, endDate } = req.query;

      // Default to current month if no dates provided
      const start = startDate ? new Date(startDate as string) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const end = endDate ? new Date(endDate as string) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

      const earnings = await paymentService.getDoctorEarnings(userId, { startDate: start, endDate: end });

      res.status(200).json({
        success: true,
        data: earnings
      });
    } catch (error) {
      logger.error('Error getting doctor earnings:', error);
      res.status(500).json({
        error: {
          code: 'EARNINGS_FETCH_FAILED',
          message: 'Failed to fetch earnings data',
        }
      });
    }
  }

  async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      const sig = req.headers['stripe-signature'] as string;
      const endpointSecret = process.env['STRIPE_WEBHOOK_SECRET'];

      if (!endpointSecret) {
        logger.error('Stripe webhook secret not configured');
        res.status(500).json({ error: 'Webhook secret not configured' });
        return;
      }

      let event: Stripe.Event;

      try {
        const stripe = new Stripe(process.env['STRIPE_SECRET_KEY']!, {
          apiVersion: '2025-09-30.clover',
        });
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      } catch (err) {
        logger.error('Webhook signature verification failed:', err);
        res.status(400).json({ error: 'Webhook signature verification failed' });
        return;
      }

      await paymentService.handleWebhook({
        id: event.id,
        type: event.type,
        data: event.data,
      });

      res.status(200).json({ received: true });
    } catch (error) {
      logger.error('Error handling webhook:', error);
      res.status(500).json({
        error: {
          code: 'WEBHOOK_PROCESSING_FAILED',
          message: 'Failed to process webhook',
        }
      });
    }
  }

  async getAdminPaymentStats(req: Request, res: Response): Promise<void> {
    try {
      const userRole = req.user?.role;

      if (userRole !== 'ADMIN') {
        res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'Access denied. Admin role required.',
          }
        });
        return;
      }

      const { startDate, endDate } = req.query;

      // Default to current month if no dates provided
      const start = startDate ? new Date(startDate as string) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const end = endDate ? new Date(endDate as string) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

      // Get payment statistics for admin dashboard
      const stats = await this.getPaymentStatistics(start, end);

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error getting admin payment stats:', error);
      res.status(500).json({
        error: {
          code: 'ADMIN_STATS_FETCH_FAILED',
          message: 'Failed to fetch payment statistics',
        }
      });
    }
  }

  private async getPaymentStatistics(startDate: Date, endDate: Date) {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    try {
      // Total revenue
      const totalRevenue = await prisma.payment.aggregate({
        where: {
          status: 'COMPLETED',
          processedAt: {
            gte: startDate,
            lte: endDate,
          }
        },
        _sum: {
          amount: true,
        },
        _count: {
          id: true,
        }
      });

      // Total refunds
      const totalRefunds = await prisma.payment.aggregate({
        where: {
          status: 'REFUNDED',
          refundedAt: {
            gte: startDate,
            lte: endDate,
          }
        },
        _sum: {
          amount: true,
        },
        _count: {
          id: true,
        }
      });

      // Payment status breakdown
      const statusBreakdown = await prisma.payment.groupBy({
        by: ['status'],
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          }
        },
        _count: {
          id: true,
        },
        _sum: {
          amount: true,
        }
      });

      return {
        period: { startDate, endDate },
        totalRevenue: Number(totalRevenue._sum.amount || 0),
        totalTransactions: totalRevenue._count,
        totalRefunds: Number(totalRefunds._sum.amount || 0),
        totalRefundCount: totalRefunds._count,
        netRevenue: Number(totalRevenue._sum.amount || 0) - Number(totalRefunds._sum.amount || 0),
        statusBreakdown: statusBreakdown.map((item: any) => ({
          status: item.status,
          count: item._count.id,
          amount: Number(item._sum.amount || 0),
        })),
      };
    } finally {
      await prisma.$disconnect();
    }
  }
}

export const paymentController = new PaymentController();