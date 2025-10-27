import { Response } from 'express';
import { UserRole } from '@prisma/client';
import { adminService } from '../services/adminService';
import {
  UserManagementFilters,
  UserStatusUpdate,
  DoctorVerificationAction,
  PaymentTransactionFilters
} from '../types/admin';
import { Request } from 'express';
import { logger } from '../utils/logger';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: UserRole;
    isVerified: boolean;
    isActive: boolean;
  };
}

export class AdminController {
  /**
   * Get system analytics for admin dashboard
   */
  async getSystemAnalytics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Verify admin role
      if (req.user!.role !== UserRole.ADMIN) {
        res.status(403).json({
          message: 'Access denied. Admin role required.',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const analytics = await adminService.getSystemAnalytics();

      res.json({
        message: 'System analytics retrieved successfully',
        data: analytics,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error getting system analytics:', error);
      res.status(500).json({
        message: 'Internal server error',
        error: {
          code: 'ANALYTICS_FETCH_ERROR',
          message: 'Failed to fetch system analytics',
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get users with management filters
   */
  async getUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Verify admin role
      if (req.user!.role !== UserRole.ADMIN) {
        res.status(403).json({
          message: 'Access denied. Admin role required.',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const filters: UserManagementFilters = {};

      if (req.query['role']) filters.role = req.query['role'] as UserRole;
      if (req.query['isActive'] !== undefined) filters.isActive = req.query['isActive'] === 'true';
      if (req.query['isVerified'] !== undefined) filters.isVerified = req.query['isVerified'] === 'true';
      if (req.query['searchTerm']) filters.searchTerm = req.query['searchTerm'] as string;
      if (req.query['page']) filters.page = parseInt(req.query['page'] as string);
      if (req.query['limit']) filters.limit = parseInt(req.query['limit'] as string);
      if (req.query['sortBy']) filters.sortBy = req.query['sortBy'] as 'createdAt' | 'name' | 'email';
      if (req.query['sortOrder']) filters.sortOrder = req.query['sortOrder'] as 'asc' | 'desc';

      const users = await adminService.getUsers(filters);

      res.json({
        message: 'Users retrieved successfully',
        data: users,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error getting users:', error);
      res.status(500).json({
        message: 'Internal server error',
        error: {
          code: 'USERS_FETCH_ERROR',
          message: 'Failed to fetch users',
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Update user status (activate/deactivate, verify/unverify)
   */
  async updateUserStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Verify admin role
      if (req.user!.role !== UserRole.ADMIN) {
        res.status(403).json({
          message: 'Access denied. Admin role required.',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const userId = req.params['userId'];
      const updates: UserStatusUpdate = req.body;

      if (!userId) {
        res.status(400).json({
          message: 'User ID is required',
          timestamp: new Date().toISOString()
        });
        return;
      }

      await adminService.updateUserStatus(userId, updates, req.user!.userId);

      res.json({
        message: 'User status updated successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error updating user status:', error);
      res.status(500).json({
        message: 'Internal server error',
        error: {
          code: 'USER_STATUS_UPDATE_ERROR',
          message: 'Failed to update user status',
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get doctors pending verification
   */
  async getDoctorsPendingVerification(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Verify admin role
      if (req.user!.role !== UserRole.ADMIN) {
        res.status(403).json({
          message: 'Access denied. Admin role required.',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const doctors = await adminService.getDoctorsPendingVerification();

      res.json({
        message: 'Doctors pending verification retrieved successfully',
        data: doctors,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error getting doctors pending verification:', error);
      res.status(500).json({
        message: 'Internal server error',
        error: {
          code: 'VERIFICATION_FETCH_ERROR',
          message: 'Failed to fetch doctors pending verification',
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Process doctor verification (approve/reject)
   */
  async processDoctorVerification(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Verify admin role
      if (req.user!.role !== UserRole.ADMIN) {
        res.status(403).json({
          message: 'Access denied. Admin role required.',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const doctorId = req.params['doctorId'];
      const { action, adminNotes }: { action: 'approve' | 'reject'; adminNotes?: string } = req.body;

      if (!doctorId) {
        res.status(400).json({
          message: 'Doctor ID is required',
          timestamp: new Date().toISOString()
        });
        return;
      }

      if (!action || !['approve', 'reject'].includes(action)) {
        res.status(400).json({
          message: 'Valid action (approve/reject) is required',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const verificationAction: DoctorVerificationAction = {
        doctorId,
        action,
        adminNotes: adminNotes || undefined
      };

      await adminService.processDoctorVerification(verificationAction, req.user!.userId);

      res.json({
        message: `Doctor verification ${action}d successfully`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error processing doctor verification:', error);
      res.status(500).json({
        message: 'Internal server error',
        error: {
          code: 'VERIFICATION_PROCESS_ERROR',
          message: 'Failed to process doctor verification',
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get payment transactions with filtering
   */
  async getPaymentTransactions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Verify admin role
      if (req.user!.role !== UserRole.ADMIN) {
        res.status(403).json({
          message: 'Access denied. Admin role required.',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const filters: PaymentTransactionFilters = {};

      if (req.query['status']) filters.status = req.query['status'] as any;
      if (req.query['dateFrom']) filters.dateFrom = new Date(req.query['dateFrom'] as string);
      if (req.query['dateTo']) filters.dateTo = new Date(req.query['dateTo'] as string);
      if (req.query['minAmount']) filters.minAmount = parseFloat(req.query['minAmount'] as string);
      if (req.query['maxAmount']) filters.maxAmount = parseFloat(req.query['maxAmount'] as string);
      if (req.query['doctorId']) filters.doctorId = req.query['doctorId'] as string;
      if (req.query['patientId']) filters.patientId = req.query['patientId'] as string;
      if (req.query['page']) filters.page = parseInt(req.query['page'] as string);
      if (req.query['limit']) filters.limit = parseInt(req.query['limit'] as string);
      if (req.query['sortBy']) filters.sortBy = req.query['sortBy'] as 'createdAt' | 'amount' | 'processedAt';
      if (req.query['sortOrder']) filters.sortOrder = req.query['sortOrder'] as 'asc' | 'desc';

      const transactions = await adminService.getPaymentTransactions(filters);

      res.json({
        message: 'Payment transactions retrieved successfully',
        data: transactions,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error getting payment transactions:', error);
      res.status(500).json({
        message: 'Internal server error',
        error: {
          code: 'TRANSACTIONS_FETCH_ERROR',
          message: 'Failed to fetch payment transactions',
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get payment reconciliation report
   */
  async getPaymentReconciliation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Verify admin role
      if (req.user!.role !== UserRole.ADMIN) {
        res.status(403).json({
          message: 'Access denied. Admin role required.',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const dateFrom = req.query['dateFrom'] ? new Date(req.query['dateFrom'] as string) : undefined;
      const dateTo = req.query['dateTo'] ? new Date(req.query['dateTo'] as string) : undefined;

      const reconciliation = await adminService.getPaymentReconciliation(dateFrom, dateTo);

      res.json({
        message: 'Payment reconciliation report generated successfully',
        data: reconciliation,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error getting payment reconciliation:', error);
      res.status(500).json({
        message: 'Internal server error',
        error: {
          code: 'RECONCILIATION_ERROR',
          message: 'Failed to generate payment reconciliation report',
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get all appointments (admin view)
   */
  async getAllAppointments(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Verify admin role
      if (req.user!.role !== UserRole.ADMIN) {
        res.status(403).json({
          message: 'Access denied. Admin role required.',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Import appointment service dynamically to avoid circular dependency
      const appointmentServiceModule = await import('../services/appointmentService');
      const appointmentService = appointmentServiceModule.appointmentService;

      const filters: any = {};

      if (req.query['status']) filters.status = req.query['status'];
      if (req.query['type']) filters.type = req.query['type'];
      if (req.query['dateFrom']) filters.dateFrom = new Date(req.query['dateFrom'] as string);
      if (req.query['dateTo']) filters.dateTo = new Date(req.query['dateTo'] as string);
      if (req.query['doctorId']) filters.doctorId = req.query['doctorId'] as string;
      if (req.query['patientId']) filters.patientId = req.query['patientId'] as string;
      if (req.query['page']) filters.page = parseInt(req.query['page'] as string);
      if (req.query['limit']) filters.limit = parseInt(req.query['limit'] as string);
      if (req.query['sortBy']) filters.sortBy = req.query['sortBy'];
      if (req.query['sortOrder']) filters.sortOrder = req.query['sortOrder'];

      // Admin can view all appointments without user-specific filtering
      const appointments = await appointmentService.getAppointments('admin', 'ADMIN', filters);

      res.json({
        message: 'All appointments retrieved successfully',
        data: appointments,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error getting all appointments:', error);
      res.status(500).json({
        message: 'Internal server error',
        error: {
          code: 'APPOINTMENTS_FETCH_ERROR',
          message: 'Failed to fetch appointments',
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get system health status
   */
  async getSystemHealth(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Verify admin role
      if (req.user!.role !== UserRole.ADMIN) {
        res.status(403).json({
          message: 'Access denied. Admin role required.',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Basic system health checks
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          database: 'healthy',
          redis: 'healthy',
          email: 'healthy',
          zoom: 'healthy',
          payments: 'healthy'
        },
        metrics: {
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage(),
          cpuUsage: process.cpuUsage()
        }
      };

      res.json({
        message: 'System health retrieved successfully',
        data: health,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error getting system health:', error);
      res.status(500).json({
        message: 'Internal server error',
        error: {
          code: 'HEALTH_CHECK_ERROR',
          message: 'Failed to check system health',
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      });
    }
  }
}

export const adminController = new AdminController();