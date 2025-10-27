import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';
import { cacheService } from './cacheService';
import DatabaseService from './database';

/**
 * System monitoring and metrics collection service
 */
export class MonitoringService {
  private static instance: MonitoringService;
  private metrics: Map<string, any> = new Map();
  private startTime: number = Date.now();

  private constructor() {
    // Initialize metrics collection
    this.initializeMetrics();
  }

  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  /**
   * Initialize metrics collection
   */
  private initializeMetrics(): void {
    this.metrics.set('requests_total', 0);
    this.metrics.set('requests_success', 0);
    this.metrics.set('requests_error', 0);
    this.metrics.set('response_times', []);
    this.metrics.set('active_connections', 0);
    this.metrics.set('database_queries', 0);
    this.metrics.set('cache_hits', 0);
    this.metrics.set('cache_misses', 0);
  }

  /**
   * Record request metrics
   */
  public recordRequest(method: string, path: string, statusCode: number, responseTime: number): void {
    this.metrics.set('requests_total', this.metrics.get('requests_total') + 1);
    
    if (statusCode >= 200 && statusCode < 400) {
      this.metrics.set('requests_success', this.metrics.get('requests_success') + 1);
    } else if (statusCode >= 400) {
      this.metrics.set('requests_error', this.metrics.get('requests_error') + 1);
    }

    // Store response times (keep last 1000)
    const responseTimes = this.metrics.get('response_times');
    responseTimes.push(responseTime);
    if (responseTimes.length > 1000) {
      responseTimes.shift();
    }

    // Log slow requests
    if (responseTime > 1000) {
      logger.warn(`Slow request detected: ${method} ${path} - ${responseTime}ms`);
    }
  }

  /**
   * Record database query
   */
  public recordDatabaseQuery(): void {
    this.metrics.set('database_queries', this.metrics.get('database_queries') + 1);
  }

  /**
   * Record cache hit
   */
  public recordCacheHit(): void {
    this.metrics.set('cache_hits', this.metrics.get('cache_hits') + 1);
  }

  /**
   * Record cache miss
   */
  public recordCacheMiss(): void {
    this.metrics.set('cache_misses', this.metrics.get('cache_misses') + 1);
  }

  /**
   * Get current system metrics
   */
  public async getMetrics(): Promise<any> {
    const responseTimes = this.metrics.get('response_times');
    const uptime = Date.now() - this.startTime;

    // Calculate response time statistics
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a: number, b: number) => a + b, 0) / responseTimes.length 
      : 0;

    const sortedTimes = [...responseTimes].sort((a, b) => a - b);
    const p95ResponseTime = sortedTimes.length > 0 
      ? sortedTimes[Math.floor(sortedTimes.length * 0.95)] 
      : 0;

    // Get system health
    const dbHealth = await this.getDatabaseHealth();
    const cacheHealth = await this.getCacheHealth();
    const memoryUsage = process.memoryUsage();

    return {
      uptime: uptime,
      requests: {
        total: this.metrics.get('requests_total'),
        success: this.metrics.get('requests_success'),
        error: this.metrics.get('requests_error'),
        success_rate: this.calculateSuccessRate(),
      },
      performance: {
        avg_response_time: Math.round(avgResponseTime),
        p95_response_time: Math.round(p95ResponseTime),
        database_queries: this.metrics.get('database_queries'),
        cache_hits: this.metrics.get('cache_hits'),
        cache_misses: this.metrics.get('cache_misses'),
        cache_hit_rate: this.calculateCacheHitRate(),
      },
      system: {
        memory_usage: {
          rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
          heap_used: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
          heap_total: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
          external: Math.round(memoryUsage.external / 1024 / 1024), // MB
        },
        cpu_usage: process.cpuUsage(),
      },
      health: {
        database: dbHealth,
        cache: cacheHealth,
        overall: dbHealth && cacheHealth ? 'healthy' : 'degraded',
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Calculate success rate
   */
  private calculateSuccessRate(): number {
    const total = this.metrics.get('requests_total');
    const success = this.metrics.get('requests_success');
    return total > 0 ? Math.round((success / total) * 100) : 0;
  }

  /**
   * Calculate cache hit rate
   */
  private calculateCacheHitRate(): number {
    const hits = this.metrics.get('cache_hits');
    const misses = this.metrics.get('cache_misses');
    const total = hits + misses;
    return total > 0 ? Math.round((hits / total) * 100) : 0;
  }

  /**
   * Check database health
   */
  private async getDatabaseHealth(): Promise<boolean> {
    try {
      const dbService = DatabaseService.getInstance();
      return await dbService.healthCheck();
    } catch (error) {
      logger.error('Database health check failed:', error);
      return false;
    }
  }

  /**
   * Check cache health
   */
  private async getCacheHealth(): Promise<boolean> {
    try {
      return await cacheService.healthCheck();
    } catch (error) {
      logger.error('Cache health check failed:', error);
      return false;
    }
  }

  /**
   * Reset metrics (useful for testing)
   */
  public resetMetrics(): void {
    this.initializeMetrics();
    this.startTime = Date.now();
  }

  /**
   * Log system status periodically
   */
  public async logSystemStatus(): Promise<void> {
    try {
      const metrics = await this.getMetrics();
      logger.info('System Status:', {
        uptime: `${Math.round(metrics.uptime / 1000)}s`,
        requests: metrics.requests.total,
        success_rate: `${metrics.requests.success_rate}%`,
        avg_response_time: `${metrics.performance.avg_response_time}ms`,
        memory_used: `${metrics.system.memory_usage.heap_used}MB`,
        health: metrics.health.overall,
      });
    } catch (error) {
      logger.error('Failed to log system status:', error);
    }
  }
}

/**
 * Express middleware for request monitoring
 */
export const monitoringMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  const monitoring = MonitoringService.getInstance();

  // Override res.end to capture response metrics
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any): any {
    const responseTime = Date.now() - startTime;
    monitoring.recordRequest(req.method, req.path, res.statusCode, responseTime);
    
    return originalEnd.call(this, chunk, encoding);
  };

  next();
};

/**
 * Performance monitoring decorator for database queries
 */
export const monitorDatabaseQuery = <T extends (...args: any[]) => Promise<any>>(
  originalMethod: T
): T => {
  return (async (...args: any[]) => {
    const monitoring = MonitoringService.getInstance();
    monitoring.recordDatabaseQuery();
    
    const startTime = Date.now();
    try {
      const result = await originalMethod(...args);
      const duration = Date.now() - startTime;
      
      if (duration > 500) {
        logger.warn(`Slow database query detected: ${duration}ms`);
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`Database query failed after ${duration}ms:`, error);
      throw error;
    }
  }) as T;
};

/**
 * Alert system for critical issues
 */
export class AlertSystem {
  private static readonly ALERT_THRESHOLDS = {
    ERROR_RATE: 10, // 10% error rate
    RESPONSE_TIME: 2000, // 2 seconds
    MEMORY_USAGE: 80, // 80% of heap
    DATABASE_FAILURES: 5, // 5 consecutive failures
  };

  private static databaseFailureCount = 0;

  /**
   * Check for alerts based on current metrics
   */
  public static async checkAlerts(): Promise<void> {
    try {
      const monitoring = MonitoringService.getInstance();
      const metrics = await monitoring.getMetrics();

      // Check error rate
      if (metrics.requests.total > 100 && 
          (100 - metrics.requests.success_rate) > this.ALERT_THRESHOLDS.ERROR_RATE) {
        this.sendAlert('HIGH_ERROR_RATE', `Error rate: ${100 - metrics.requests.success_rate}%`);
      }

      // Check response time
      if (metrics.performance.p95_response_time > this.ALERT_THRESHOLDS.RESPONSE_TIME) {
        this.sendAlert('SLOW_RESPONSE_TIME', `P95 response time: ${metrics.performance.p95_response_time}ms`);
      }

      // Check memory usage
      const memoryUsagePercent = (metrics.system.memory_usage.heap_used / metrics.system.memory_usage.heap_total) * 100;
      if (memoryUsagePercent > this.ALERT_THRESHOLDS.MEMORY_USAGE) {
        this.sendAlert('HIGH_MEMORY_USAGE', `Memory usage: ${memoryUsagePercent.toFixed(1)}%`);
      }

      // Check database health
      if (!metrics.health.database) {
        this.databaseFailureCount++;
        if (this.databaseFailureCount >= this.ALERT_THRESHOLDS.DATABASE_FAILURES) {
          this.sendAlert('DATABASE_DOWN', 'Database health check failing');
        }
      } else {
        this.databaseFailureCount = 0;
      }

    } catch (error) {
      logger.error('Alert check failed:', error);
    }
  }

  /**
   * Send alert notification
   */
  private static sendAlert(type: string, message: string): void {
    logger.error(`ALERT [${type}]: ${message}`);
    
    // In production, you would send this to:
    // - Email notifications
    // - Slack/Teams webhooks
    // - PagerDuty/OpsGenie
    // - SMS alerts
    
    // For now, just log the alert
    console.error(`🚨 SYSTEM ALERT [${type}]: ${message}`);
  }
}

// Export singleton instance
export const monitoringService = MonitoringService.getInstance();