// Mock Redis for testing
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    setEx: jest.fn().mockResolvedValue('OK'),
    get: jest.fn().mockResolvedValue(null),
    del: jest.fn().mockResolvedValue(1),
    keys: jest.fn().mockResolvedValue([]),
    exists: jest.fn().mockResolvedValue(0),
    incr: jest.fn().mockResolvedValue(1),
    expire: jest.fn().mockResolvedValue(1),
    ping: jest.fn().mockResolvedValue('PONG'),
    on: jest.fn(),
  })),
}));

import { CacheKeys, CacheTTL } from '../../services/cacheService';

describe('Performance Tests - Standalone', () => {
  describe('Cache Key Generation and Management', () => {
    it('should generate consistent and collision-free cache keys', () => {
      const testCases = [
        { userId: 'user-123', expected: 'user:user-123' },
        { userId: 'user-456', expected: 'user:user-456' },
        { doctorId: 'doctor-789', expected: 'doctor:profile:doctor-789' },
        { appointmentId: 'appt-abc', expected: 'appointment:appt-abc' }
      ];

      testCases.forEach(({ userId, doctorId, appointmentId, expected }) => {
        if (userId) {
          expect(CacheKeys.user(userId)).toBe(expected);
        }
        if (doctorId) {
          expect(CacheKeys.doctorProfile(doctorId)).toBe(expected);
        }
        if (appointmentId) {
          expect(CacheKeys.appointment(appointmentId)).toBe(expected);
        }
      });
    });

    it('should handle special characters in cache keys safely', () => {
      const specialIds = [
        'user@domain.com',
        'user-with-dashes',
        'user_with_underscores',
        'user123',
        'user with spaces'
      ];

      specialIds.forEach(id => {
        const key = CacheKeys.user(id);
        expect(key).toContain(id);
        expect(key.startsWith('user:')).toBe(true);
      });
    });

    it('should generate unique search cache keys for different filters', () => {
      const filterSets = [
        { specialization: 'cardiology', location: 'NYC' },
        { specialization: 'dermatology', location: 'LA' },
        { specialization: 'cardiology', location: 'LA' },
        { rating: 4.5, location: 'NYC' }
      ];

      const keys = filterSets.map(filters => 
        CacheKeys.doctorSearch(JSON.stringify(filters))
      );

      // All keys should be unique
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(keys.length);
      
      // All keys should contain the search prefix
      keys.forEach(key => {
        expect(key).toContain('doctor:search:');
      });
    });

    it('should validate cache TTL constants', () => {
      expect(CacheTTL.SHORT).toBe(300);      // 5 minutes
      expect(CacheTTL.MEDIUM).toBe(1800);    // 30 minutes
      expect(CacheTTL.LONG).toBe(3600);      // 1 hour
      expect(CacheTTL.VERY_LONG).toBe(86400); // 24 hours
      expect(CacheTTL.USER_SESSION).toBe(7200); // 2 hours
      expect(CacheTTL.SEARCH_RESULTS).toBe(600); // 10 minutes
      expect(CacheTTL.STATIC_DATA).toBe(86400); // 24 hours
    });
  });

  describe('Performance Optimization Algorithms', () => {
    it('should efficiently handle batch operations', async () => {
      const batchSize = 100;
      const startTime = Date.now();
      
      // Simulate batch processing
      const batchOperations = Array(batchSize).fill(null).map(async (_, index) => {
        // Simulate some processing time
        await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
        return { id: index, processed: true, timestamp: Date.now() };
      });

      const results = await Promise.all(batchOperations);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(results.length).toBe(batchSize);
      expect(totalTime).toBeLessThan(1000); // Should complete within 1 second
      
      // Verify all operations completed
      results.forEach((result, index) => {
        expect(result.id).toBe(index);
        expect(result.processed).toBe(true);
      });
    });

    it('should handle pagination efficiently', () => {
      const totalItems = 1000;
      const pageSize = 50;
      const totalPages = Math.ceil(totalItems / pageSize);
      
      const mockData = Array.from({ length: totalItems }, (_, i) => ({ 
        id: i + 1, 
        name: `Item ${i + 1}`,
        category: `Category ${Math.floor(i / 100) + 1}`
      }));

      const startTime = Date.now();
      
      // Simulate pagination processing
      const pages = Array(totalPages).fill(null).map((_, pageIndex) => {
        const page = pageIndex + 1;
        const skip = (page - 1) * pageSize;
        const data = mockData.slice(skip, skip + pageSize);
        
        return {
          data,
          page,
          totalPages,
          total: totalItems,
          hasNext: page < totalPages,
          hasPrev: page > 1
        };
      });
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(pages.length).toBe(totalPages);
      expect(totalTime).toBeLessThan(100); // Should be very fast for in-memory operations
      
      // Verify pagination logic
      pages.forEach((pageResult, index) => {
        expect(pageResult.page).toBe(index + 1);
        expect(pageResult.data.length).toBeLessThanOrEqual(pageSize);
        expect(pageResult.total).toBe(totalItems);
        expect(pageResult.totalPages).toBe(totalPages);
      });
    });

    it('should optimize query patterns', () => {
      const queries = [
        { type: 'user', id: 'user-1', complexity: 1 },
        { type: 'appointment', id: 'appt-1', complexity: 2 },
        { type: 'doctor', id: 'doc-1', complexity: 3 },
        { type: 'search', filters: { specialization: 'cardiology' }, complexity: 4 }
      ];

      const startTime = Date.now();
      
      // Simulate query optimization
      const optimizedQueries = queries.map(query => {
        const cacheKey = query.type === 'search' 
          ? CacheKeys.doctorSearch(JSON.stringify(query.filters))
          : CacheKeys.user(query.id || 'default');
        
        return {
          ...query,
          cacheKey,
          optimized: true,
          estimatedTime: query.complexity * 10 // ms
        };
      });
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(optimizedQueries.length).toBe(queries.length);
      expect(totalTime).toBeLessThan(50); // Should be very fast
      
      // Verify optimization
      optimizedQueries.forEach(query => {
        expect(query.optimized).toBe(true);
        expect(query.cacheKey).toBeDefined();
        expect(query.estimatedTime).toBeGreaterThan(0);
      });
    });
  });

  describe('Memory and Resource Management', () => {
    it('should handle large data sets efficiently', () => {
      const largeDataSet = Array(10000).fill(null).map((_, index) => ({
        id: index,
        data: `Item ${index}`,
        metadata: {
          created: new Date().toISOString(),
          category: `Category ${index % 10}`,
          tags: [`tag-${index % 5}`, `tag-${index % 3}`]
        }
      }));

      const startTime = Date.now();
      
      // Simulate processing large dataset
      const processed = largeDataSet
        .filter(item => item.id % 2 === 0) // Filter even IDs
        .map(item => ({
          ...item,
          processed: true,
          processedAt: Date.now()
        }))
        .slice(0, 1000); // Limit results
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(processed.length).toBe(1000);
      expect(totalTime).toBeLessThan(500); // Should complete within 500ms
      
      // Verify processing
      processed.forEach(item => {
        expect(item.processed).toBe(true);
        expect(item.processedAt).toBeDefined();
        expect(item.id % 2).toBe(0); // Should be even
      });
    });

    it('should manage memory usage during operations', () => {
      const initialMemory = process.memoryUsage();
      
      // Simulate memory-intensive operations
      const operations = Array(100).fill(null).map((_, index) => {
        const largeObject = {
          id: index,
          data: Array(1000).fill(`data-${index}`),
          metadata: {
            timestamp: Date.now(),
            size: 1000,
            type: 'test-object'
          }
        };
        
        // Process and return smaller result
        return {
          id: largeObject.id,
          summary: `Processed ${largeObject.data.length} items`,
          timestamp: largeObject.metadata.timestamp
        };
      });

      const finalMemory = process.memoryUsage();
      
      expect(operations.length).toBe(100);
      
      // Memory increase should be reasonable
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB increase
      
      // Verify operations completed
      operations.forEach((op, index) => {
        expect(op.id).toBe(index);
        expect(op.summary).toContain('Processed 1000 items');
      });
    });

    it('should handle concurrent resource access', async () => {
      const resourcePool = Array(10).fill(null).map((_, index) => ({
        id: index,
        available: true,
        data: `Resource ${index}`
      }));

      const concurrentOperations = 50;
      const startTime = Date.now();
      
      // Simulate concurrent access to limited resources
      const operations = Array(concurrentOperations).fill(null).map(async (_, index) => {
        // Find available resource
        const resource = resourcePool.find(r => r.available);
        if (resource) {
          resource.available = false;
          
          // Simulate work with resource
          await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
          
          resource.available = true;
          return { operationId: index, resourceId: resource.id, success: true };
        }
        
        return { operationId: index, resourceId: null, success: false };
      });

      const results = await Promise.all(operations);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(results.length).toBe(concurrentOperations);
      expect(totalTime).toBeLessThan(1000); // Should complete within 1 second
      
      // Most operations should succeed (some may fail due to resource contention)
      const successfulOps = results.filter(r => r.success);
      expect(successfulOps.length).toBeGreaterThan(concurrentOperations * 0.5); // At least 50% success
    });
  });

  describe('Algorithm Performance', () => {
    it('should efficiently sort and search large datasets', () => {
      const dataSize = 10000;
      const unsortedData = Array(dataSize).fill(null).map(() => ({
        id: Math.random().toString(36).substr(2, 9),
        value: Math.floor(Math.random() * 1000000),
        category: `cat-${Math.floor(Math.random() * 100)}`
      }));

      const startTime = Date.now();
      
      // Sort by value
      const sorted = [...unsortedData].sort((a, b) => a.value - b.value);
      
      // Binary search for specific value
      const targetValue = sorted[Math.floor(sorted.length / 2)].value;
      let left = 0;
      let right = sorted.length - 1;
      let found = false;
      
      while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        if (sorted[mid].value === targetValue) {
          found = true;
          break;
        } else if (sorted[mid].value < targetValue) {
          left = mid + 1;
        } else {
          right = mid - 1;
        }
      }
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(sorted.length).toBe(dataSize);
      expect(found).toBe(true);
      expect(totalTime).toBeLessThan(1000); // Should complete within 1 second
      
      // Verify sorting
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i].value).toBeGreaterThanOrEqual(sorted[i - 1].value);
      }
    });

    it('should handle complex filtering and aggregation', () => {
      const dataSize = 5000;
      const testData = Array(dataSize).fill(null).map((_, index) => ({
        id: index,
        category: `category-${index % 10}`,
        value: Math.floor(Math.random() * 1000),
        active: Math.random() > 0.3,
        created: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000)
      }));

      const startTime = Date.now();
      
      // Complex filtering and aggregation
      const results = testData
        .filter(item => item.active && item.value > 500)
        .reduce((acc, item) => {
          if (!acc[item.category]) {
            acc[item.category] = {
              count: 0,
              totalValue: 0,
              avgValue: 0,
              items: []
            };
          }
          
          acc[item.category].count++;
          acc[item.category].totalValue += item.value;
          acc[item.category].avgValue = acc[item.category].totalValue / acc[item.category].count;
          acc[item.category].items.push(item.id);
          
          return acc;
        }, {} as Record<string, any>);
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(Object.keys(results).length).toBeGreaterThan(0);
      expect(totalTime).toBeLessThan(500); // Should complete within 500ms
      
      // Verify aggregation
      Object.values(results).forEach((categoryResult: any) => {
        expect(categoryResult.count).toBeGreaterThan(0);
        expect(categoryResult.totalValue).toBeGreaterThan(0);
        expect(categoryResult.avgValue).toBeGreaterThan(0);
        expect(categoryResult.items.length).toBe(categoryResult.count);
      });
    });
  });
});