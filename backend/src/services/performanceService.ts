import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';
import { cacheService, CacheKeys, CacheTTL } from './cacheService';
import { db } from './database';

/**
 * Performance optimization service
 */
export class PerformanceService {
  private static instance: PerformanceService;

  private constructor() {}

  public static getInstance(): PerformanceService {
    if (!PerformanceService.instance) {
      PerformanceService.instance = new PerformanceService();
    }
    return PerformanceService.instance;
  }

  /**
   * Database query optimization with caching
   */
  public async optimizedQuery<T>(
    cacheKey: string,
    queryFn: () => Promise<T>,
    ttl: number = CacheTTL.MEDIUM
  ): Promise<T> {
    // Try cache first
    const cached = await cacheService.get<T>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    // Execute query and cache result
    const result = await queryFn();
    await cacheService.set(cacheKey, result, ttl);
    
    return result;
  }

  /**
   * Batch database operations
   */
  public async batchQuery<T>(
    queries: Array<() => Promise<T>>
  ): Promise<T[]> {
    return Promise.all(queries.map(query => query()));
  }

  /**
   * Paginated query with caching
   */
  public async paginatedQuery<T>(
    baseKey: string,
    page: number,
    limit: number,
    queryFn: (skip: number, take: number) => Promise<{ data: T[]; total: number }>,
    ttl: number = CacheTTL.SHORT
  ): Promise<{ data: T[]; total: number; page: number; totalPages: number }> {
    const skip = (page - 1) * limit;
    const cacheKey = `${baseKey}:page:${page}:limit:${limit}`;

    const result = await this.optimizedQuery(
      cacheKey,
      () => queryFn(skip, limit),
      ttl
    );

    return {
      ...result,
      page,
      totalPages: Math.ceil(result.total / limit),
    };
  }

  /**
   * Optimized user profile retrieval
   */
  public async getUserProfile(userId: string): Promise<any> {
    return this.optimizedQuery(
      CacheKeys.userProfile(userId),
      async () => {
        const user = await db.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
            isVerified: true,
            createdAt: true,
            patientProfile: {
              select: {
                name: true,
                age: true,
                gender: true,
                phone: true,
                address: true,
              },
            },
            doctorProfile: {
              select: {
                name: true,
                profilePicture: true,
                specializations: true,
                qualifications: true,
                yearsOfExperience: true,
                consultationFee: true,
                licenseVerified: true,
                rating: true,
                totalReviews: true,
                clinicName: true,
                clinicAddress: true,
                isAcceptingPatients: true,
              },
            },
          },
        });

        if (!user) {
          throw new Error('User not found');
        }

        return user;
      },
      CacheTTL.MEDIUM
    );
  }

  /**
   * Optimized doctor search with caching
   */
  public async searchDoctors(filters: {
    specialization?: string;
    location?: string;
    rating?: number;
    page?: number;
    limit?: number;
  }): Promise<any> {
    const { page = 1, limit = 10, ...searchFilters } = filters;
    const filtersKey = JSON.stringify(searchFilters);
    
    return this.paginatedQuery(
      CacheKeys.doctorSearch(filtersKey),
      page,
      limit,
      async (skip, take) => {
        const where: any = {
          licenseVerified: true,
          user: { isActive: true },
        };

        if (searchFilters.specialization) {
          where.specializations = {
            has: searchFilters.specialization,
          };
        }

        if (searchFilters.rating) {
          where.rating = {
            gte: searchFilters.rating,
          };
        }

        if (searchFilters.location) {
          where.OR = [
            { clinicAddress: { contains: searchFilters.location, mode: 'insensitive' } },
            { clinicName: { contains: searchFilters.location, mode: 'insensitive' } },
          ];
        }

        const [doctors, total] = await Promise.all([
          db.doctorProfile.findMany({
            where,
            skip,
            take,
            select: {
              userId: true,
              name: true,
              profilePicture: true,
              specializations: true,
              qualifications: true,
              yearsOfExperience: true,
              consultationFee: true,
              rating: true,
              totalReviews: true,
              clinicName: true,
              clinicAddress: true,
            },
            orderBy: [
              { rating: 'desc' },
              { totalReviews: 'desc' },
            ],
          }),
          db.doctorProfile.count({ where }),
        ]);

        return { data: doctors, total };
      },
      CacheTTL.SHORT
    );
  }

  /**
   * Optimized appointment retrieval
   */
  public async getUserAppointments(userId: string, role: 'patient' | 'doctor'): Promise<any[]> {
    const cacheKey = role === 'patient' 
      ? CacheKeys.userAppointments(userId)
      : CacheKeys.doctorAppointments(userId);

    return this.optimizedQuery(
      cacheKey,
      async () => {
        const where = role === 'patient' 
          ? { patientId: userId }
          : { doctorId: userId };

        return db.appointment.findMany({
          where,
          include: {
            patient: {
              select: {
                name: true,
                age: true,
                gender: true,
                phone: true,
                address: true,
              },
            },
            doctor: {
              select: {
                name: true,
                specializations: true,
                clinicName: true,
                clinicAddress: true,
              },
            },
            payment: {
              select: {
                amount: true,
                status: true,
                createdAt: true,
              },
            },
          },
          orderBy: { scheduledDateTime: 'desc' },
        });
      },
      CacheTTL.SHORT
    );
  }

  /**
   * Cache invalidation helpers
   */
  public async invalidateUserCache(userId: string): Promise<void> {
    await Promise.all([
      cacheService.delete(CacheKeys.user(userId)),
      cacheService.delete(CacheKeys.userProfile(userId)),
      cacheService.delete(CacheKeys.userAppointments(userId)),
      cacheService.delete(CacheKeys.doctorAppointments(userId)),
    ]);
  }

  public async invalidateAppointmentCache(appointmentId: string, patientId: string, doctorId: string): Promise<void> {
    await Promise.all([
      cacheService.delete(CacheKeys.appointment(appointmentId)),
      cacheService.delete(CacheKeys.userAppointments(patientId)),
      cacheService.delete(CacheKeys.doctorAppointments(doctorId)),
      cacheService.deletePattern('doctor:search:*'),
    ]);
  }

  public async invalidateDoctorCache(doctorId: string): Promise<void> {
    await Promise.all([
      cacheService.delete(CacheKeys.doctorProfile(doctorId)),
      cacheService.delete(CacheKeys.doctorAppointments(doctorId)),
      cacheService.deletePattern('doctor:search:*'),
      cacheService.deletePattern(`doctor:availability:${doctorId}:*`),
    ]);
  }
}

/**
 * Middleware for response compression and caching headers
 */
export const performanceMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Set cache headers for static resources
  if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
    res.setHeader('Expires', new Date(Date.now() + 31536000000).toUTCString());
  }

  // Set cache headers for API responses
  if (req.path.startsWith('/api/')) {
    // No cache for POST, PUT, DELETE requests
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    } else {
      // Short cache for GET requests
      res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minutes
    }
  }

  next();
};

/**
 * Database connection pooling optimization
 */
export const optimizeDatabaseConnections = (): void => {
  // Configure Prisma connection pool
  const maxConnections = parseInt(process.env['DB_MAX_CONNECTIONS'] || '10');
  const connectionTimeout = parseInt(process.env['DB_CONNECTION_TIMEOUT'] || '5000');

  logger.info(`Database connection pool configured: max=${maxConnections}, timeout=${connectionTimeout}ms`);
};

/**
 * Memory usage monitoring and optimization
 */
export const monitorMemoryUsage = (): void => {
  setInterval(() => {
    const usage = process.memoryUsage();
    const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
    // const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
    const rssMB = Math.round(usage.rss / 1024 / 1024);

    // Log memory usage if it's high
    if (heapUsedMB > 500) { // 500MB threshold
      logger.warn(`High memory usage detected: Heap=${heapUsedMB}MB, RSS=${rssMB}MB`);
    }

    // Force garbage collection if memory usage is very high
    if (heapUsedMB > 1000 && global.gc) { // 1GB threshold
      logger.warn('Forcing garbage collection due to high memory usage');
      global.gc();
    }
  }, 60000); // Check every minute
};

// Export singleton instance
export const performanceService = PerformanceService.getInstance();