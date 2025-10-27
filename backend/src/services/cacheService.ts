import { createClient, RedisClientType } from 'redis';
import { logger } from '@/utils/logger';

/**
 * Redis-based caching service for performance optimization
 */
export class CacheService {
  private static instance: CacheService;
  private client: RedisClientType;
  private isConnected: boolean = false;

  private constructor() {
    const redisUrl = process.env['REDIS_URL'] || 'redis://localhost:6379';
    
    this.client = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries: number) => Math.min(retries * 50, 500),
      },
    });

    this.client.on('error', (error) => {
      logger.error('Redis client error:', error);
      this.isConnected = false;
    });

    this.client.on('connect', () => {
      logger.info('Redis client connected');
      this.isConnected = true;
    });

    this.client.on('disconnect', () => {
      logger.warn('Redis client disconnected');
      this.isConnected = false;
    });
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * Connect to Redis
   */
  public async connect(): Promise<void> {
    try {
      if (!this.isConnected) {
        await this.client.connect();
      }
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  /**
   * Disconnect from Redis
   */
  public async disconnect(): Promise<void> {
    try {
      if (this.isConnected) {
        await this.client.disconnect();
      }
    } catch (error) {
      logger.error('Failed to disconnect from Redis:', error);
      throw error;
    }
  }

  /**
   * Set cache value with expiration
   */
  public async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    try {
      if (!this.isConnected) {
        logger.warn('Redis not connected, skipping cache set');
        return;
      }

      const serializedValue = JSON.stringify(value);
      await this.client.setEx(key, ttlSeconds, serializedValue);
      
      logger.debug(`Cache set: ${key} (TTL: ${ttlSeconds}s)`);
    } catch (error) {
      logger.error(`Failed to set cache for key ${key}:`, error);
    }
  }

  /**
   * Get cache value
   */
  public async get<T>(key: string): Promise<T | null> {
    try {
      if (!this.isConnected) {
        logger.warn('Redis not connected, skipping cache get');
        return null;
      }

      const value = await this.client.get(key);
      
      if (value === null) {
        return null;
      }

      const parsed = JSON.parse(value);
      logger.debug(`Cache hit: ${key}`);
      return parsed;
    } catch (error) {
      logger.error(`Failed to get cache for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Delete cache value
   */
  public async delete(key: string): Promise<void> {
    try {
      if (!this.isConnected) {
        return;
      }

      await this.client.del(key);
      logger.debug(`Cache deleted: ${key}`);
    } catch (error) {
      logger.error(`Failed to delete cache for key ${key}:`, error);
    }
  }

  /**
   * Delete multiple cache keys by pattern
   */
  public async deletePattern(pattern: string): Promise<void> {
    try {
      if (!this.isConnected) {
        return;
      }

      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
        logger.debug(`Cache pattern deleted: ${pattern} (${keys.length} keys)`);
      }
    } catch (error) {
      logger.error(`Failed to delete cache pattern ${pattern}:`, error);
    }
  }

  /**
   * Check if key exists in cache
   */
  public async exists(key: string): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false;
      }

      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Failed to check cache existence for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Increment counter in cache
   */
  public async increment(key: string, ttlSeconds: number = 3600): Promise<number> {
    try {
      if (!this.isConnected) {
        return 0;
      }

      const result = await this.client.incr(key);
      
      // Set expiration only on first increment
      if (result === 1) {
        await this.client.expire(key, ttlSeconds);
      }

      return result;
    } catch (error) {
      logger.error(`Failed to increment cache for key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Cache wrapper for database queries
   */
  public async cacheQuery<T>(
    key: string,
    queryFn: () => Promise<T>,
    ttlSeconds: number = 3600
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Execute query and cache result
    const result = await queryFn();
    await this.set(key, result, ttlSeconds);
    
    return result;
  }

  /**
   * Health check for Redis connection
   */
  public async healthCheck(): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false;
      }

      await this.client.ping();
      return true;
    } catch (error) {
      logger.error('Redis health check failed:', error);
      return false;
    }
  }
}

/**
 * Cache key generators for different data types
 */
export const CacheKeys = {
  user: (userId: string) => `user:${userId}`,
  userProfile: (userId: string) => `user:profile:${userId}`,
  doctorProfile: (doctorId: string) => `doctor:profile:${doctorId}`,
  doctorSearch: (filters: string) => `doctor:search:${filters}`,
  appointment: (appointmentId: string) => `appointment:${appointmentId}`,
  userAppointments: (userId: string) => `user:appointments:${userId}`,
  doctorAppointments: (doctorId: string) => `doctor:appointments:${doctorId}`,
  doctorAvailability: (doctorId: string, date: string) => `doctor:availability:${doctorId}:${date}`,
  paymentHistory: (userId: string) => `payment:history:${userId}`,
  doctorEarnings: (doctorId: string, period: string) => `doctor:earnings:${doctorId}:${period}`,
  medicalHistory: (patientId: string) => `medical:history:${patientId}`,
  reviews: (doctorId: string) => `reviews:${doctorId}`,
  systemStats: () => 'system:stats',
  rateLimitCounter: (ip: string, endpoint: string) => `rate_limit:${ip}:${endpoint}`,
};

/**
 * Cache TTL constants (in seconds)
 */
export const CacheTTL = {
  SHORT: 300,      // 5 minutes
  MEDIUM: 1800,    // 30 minutes
  LONG: 3600,      // 1 hour
  VERY_LONG: 86400, // 24 hours
  USER_SESSION: 7200, // 2 hours
  SEARCH_RESULTS: 600, // 10 minutes
  STATIC_DATA: 86400, // 24 hours
};

// Export singleton instance
export const cacheService = CacheService.getInstance();