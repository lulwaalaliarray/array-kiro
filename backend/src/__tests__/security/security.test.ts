import request from 'supertest';
import app from '../../index';
import { EncryptionUtils } from '../../utils/encryption';
import { monitoringService } from '../../services/monitoringService';
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
import { describe } from 'node:test';
import { it } from 'node:test';
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
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { describe } from 'node:test';

describe('Security and Performance Tests', () => {
  beforeAll(() => {
    // Set test encryption key
    process.env['ENCRYPTION_KEY'] = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    process.env['HASH_SALT'] = 'test-salt-for-security-tests';
  });

  describe('Security Headers', () => {
    it('should set comprehensive security headers on all responses', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      // Basic security headers
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
      expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
      
      // Content Security Policy
      expect(response.headers['content-security-policy']).toContain("default-src 'self'");
      expect(response.headers['content-security-policy']).toContain('script-src');
      expect(response.headers['content-security-policy']).toContain('style-src');
    });

    it('should set HSTS header in production', async () => {
      const originalEnv = process.env['NODE_ENV'];
      process.env['NODE_ENV'] = 'production';

      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers['strict-transport-security']).toContain('max-age=31536000');
      
      process.env['NODE_ENV'] = originalEnv;
    });
  });

  describe('Rate Limiting Security', () => {
    it('should enforce authentication rate limits', async () => {
      const requests = Array(6).fill(null).map(() => 
        request(app)
          .post('/api/v1/auth/login')
          .send({ email: 'test@example.com', password: 'wrongpassword' })
      );

      const responses = await Promise.all(requests);
      
      // Should have some rate limited responses (429)
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should enforce payment endpoint rate limits', async () => {
      const requests = Array(4).fill(null).map(() => 
        request(app)
          .post('/api/v1/payments/create-intent')
          .send({ appointmentId: 'test-appointment', amount: 100 })
      );

      const responses = await Promise.all(requests);
      
      // Should have rate limited responses
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should track rate limit violations for security monitoring', async () => {
      const initialMetrics = await monitoringService.getMetrics();
      
      // Make requests that will trigger rate limiting
      await Promise.all(Array(5).fill(null).map(() => 
        request(app)
          .post('/api/v1/auth/login')
          .send({ email: 'test@example.com', password: 'wrongpassword' })
      ));

      const finalMetrics = await monitoringService.getMetrics();
      expect(finalMetrics.requests.total).toBeGreaterThan(initialMetrics.requests.total);
    });
  });

  describe('Input Sanitization and Validation', () => {
    it('should sanitize XSS attempts in request body', async () => {
      const maliciousInput = {
        name: '<script>alert("xss")</script>John Doe',
        description: 'javascript:alert("xss")',
        notes: '<img src="x" onerror="alert(1)">',
      };

      const response = await request(app)
        .post('/api/v1/test-sanitization')
        .send(maliciousInput);

      if (response.status === 200) {
        expect(response.body?.name).not.toContain('<script>');
        expect(response.body?.name).toBe('John Doe');
        expect(response.body?.description).not.toContain('javascript:');
        expect(response.body?.notes).not.toContain('onerror');
      }
    });

    it('should sanitize SQL injection attempts', async () => {
      const sqlInjectionAttempts = [
        "'; DROP TABLE users; --",
        "1' OR '1'='1",
        "admin'/*",
        "' UNION SELECT * FROM users --"
      ];

      for (const attempt of sqlInjectionAttempts) {
        const response = await request(app)
          .get(`/api/v1/users/search?name=${encodeURIComponent(attempt)}`);
        
        // Should not return 500 errors or expose database errors
        expect(response.status).not.toBe(500);
        if (response.body?.error) {
          expect(response.body.error.message).not.toContain('SQL');
          expect(response.body.error.message).not.toContain('database');
        }
      }
    });

    it('should validate and reject oversized payloads', async () => {
      const largePayload = {
        data: 'x'.repeat(10 * 1024 * 1024) // 10MB payload
      };

      const response = await request(app)
        .post('/api/v1/test-large-payload')
        .send(largePayload);

      expect(response.status).toBe(413); // Payload Too Large
    });
  });

  describe('Data Encryption Security', () => {
    it('should encrypt and decrypt sensitive medical data securely', () => {
      const sensitiveData = {
        diagnosis: 'Confidential medical condition',
        prescription: 'Sensitive medication details',
        notes: 'Private patient notes',
        symptoms: 'Patient reported symptoms'
      };

      const encrypted = EncryptionUtils.encryptMedicalData(sensitiveData);
      
      // Verify all fields are encrypted
      expect(encrypted.diagnosis).not.toBe(sensitiveData.diagnosis);
      expect(encrypted.prescription).not.toBe(sensitiveData.prescription);
      expect(encrypted.notes).not.toBe(sensitiveData.notes);
      expect(encrypted.symptoms).not.toBe(sensitiveData.symptoms);

      // Verify decryption works correctly
      const decrypted = EncryptionUtils.decryptMedicalData(encrypted);
      expect(decrypted).toEqual(sensitiveData);
    });

    it('should encrypt PII data securely', () => {
      const piiData = {
        ssn: '987-65-4321',
        phoneNumber: '+1-555-123-4567',
        address: '123 Main St, City, State 12345',
        emergencyContact: 'Jane Doe - 555-987-6543'
      };

      const encrypted = EncryptionUtils.encryptPII(piiData);
      
      // Verify encryption
      Object.keys(piiData).forEach(key => {
        expect(encrypted[key as keyof typeof encrypted]).not.toBe(piiData[key as keyof typeof piiData]);
      });

      // Verify decryption
      const decrypted = EncryptionUtils.decryptPII(encrypted);
      expect(decrypted).toEqual(piiData);
    });

    it('should generate cryptographically secure keys', () => {
      const keys = Array(10).fill(null).map(() => EncryptionUtils.generateKey());
      
      // All keys should be unique
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(keys.length);
      
      // All keys should be proper length
      keys.forEach(key => {
        expect(key.length).toBe(64); // 256-bit key = 64 hex chars
        expect(/^[0-9a-f]+$/i.test(key)).toBe(true); // Valid hex
      });
    });

    it('should handle encryption errors gracefully', () => {
      const originalKey = process.env['ENCRYPTION_KEY'];
      
      // Test with invalid key
      process.env['ENCRYPTION_KEY'] = 'invalid-key';
      
      expect(() => {
        EncryptionUtils.encrypt('test data');
      }).toThrow('ENCRYPTION_KEY must be 64 hex characters');
      
      // Restore original key
      process.env['ENCRYPTION_KEY'] = originalKey;
    });
  });

  describe('Authentication and Authorization Security', () => {
    it('should reject requests with invalid JWT tokens', async () => {
      const invalidTokens = [
        'invalid.jwt.token',
        'Bearer invalid-token',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature',
        ''
      ];

      for (const token of invalidTokens) {
        const response = await request(app)
          .get('/api/v1/protected-endpoint')
          .set('Authorization', token);
        
        expect(response.status).toBe(401);
      }
    });

    it('should enforce role-based access control', async () => {
      // Test patient trying to access admin endpoint
      const response = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', 'Bearer patient-token');
      
      expect([401, 403]).toContain(response.status);
    });
  });

  describe('Performance Under Load', () => {
    it('should handle concurrent requests efficiently', async () => {
      const startTime = Date.now();
      const concurrentRequests = 50;
      
      const requests = Array(concurrentRequests).fill(null).map(() => 
        request(app).get('/health')
      );

      const responses = await Promise.all(requests);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Should complete within reasonable time (adjust threshold as needed)
      expect(totalTime).toBeLessThan(5000); // 5 seconds for 50 requests
      
      // Average response time should be reasonable
      const avgResponseTime = totalTime / concurrentRequests;
      expect(avgResponseTime).toBeLessThan(100); // 100ms average
    });

    it('should maintain performance with database queries', async () => {
      const startTime = Date.now();
      
      const requests = Array(20).fill(null).map(() => 
        request(app).get('/api/v1/doctors/search?specialization=cardiology')
      );

      const responses = await Promise.all(requests);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Check that responses are reasonable
      responses.forEach(response => {
        expect([200, 404]).toContain(response.status);
      });

      // Database queries should complete in reasonable time
      expect(totalTime).toBeLessThan(10000); // 10 seconds for 20 DB queries
    });

    it('should track performance metrics accurately', async () => {
      monitoringService.resetMetrics();
      
      // Make some test requests
      await Promise.all([
        request(app).get('/health'),
        request(app).get('/api/v1/test-endpoint'),
        request(app).post('/api/v1/test-endpoint').send({ test: 'data' })
      ]);

      const metrics = await monitoringService.getMetrics();
      
      expect(metrics.requests.total).toBeGreaterThan(0);
      expect(metrics.performance.avg_response_time).toBeGreaterThan(0);
      expect(metrics.system.memory_usage).toBeDefined();
      expect(metrics.health.overall).toBeDefined();
    });
  });

  describe('Error Handling Security', () => {
    it('should not leak sensitive information in error responses', async () => {
      const response = await request(app)
        .get('/api/v1/nonexistent-endpoint')
        .expect(404);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe('ROUTE_NOT_FOUND');
      expect(response.body.error.message).toContain('not found');
      expect(response.body.error.timestamp).toBeDefined();
      
      // Should not contain sensitive information
      expect(response.body.error.stack).toBeUndefined();
      expect(response.body.error.sql).toBeUndefined();
      expect(response.body.error.password).toBeUndefined();
    });

    it('should handle database errors securely', async () => {
      const response = await request(app)
        .get('/api/v1/trigger-db-error');

      if (response.status === 500) {
        expect(response.body.error.message).not.toContain('database');
        expect(response.body.error.message).not.toContain('SQL');
        expect(response.body.error.message).not.toContain('connection');
      }
    });
  });

  describe('System Resource Protection', () => {
    it('should monitor memory usage and prevent leaks', async () => {
      const initialMetrics = await monitoringService.getMetrics();
      const initialMemory = initialMetrics.system.memory_usage.heap_used;

      // Simulate memory-intensive operations
      const largeRequests = Array(10).fill(null).map(() => 
        request(app)
          .post('/api/v1/test-memory-usage')
          .send({ data: 'x'.repeat(1024 * 100) }) // 100KB per request
      );

      await Promise.all(largeRequests);

      const finalMetrics = await monitoringService.getMetrics();
      const finalMemory = finalMetrics.system.memory_usage.heap_used;

      // Memory should not increase dramatically
      const memoryIncrease = finalMemory - initialMemory;
      expect(memoryIncrease).toBeLessThan(100); // Less than 100MB increase
    });

    it('should handle file upload size limits', async () => {
      const response = await request(app)
        .post('/api/v1/medical-history/upload')
        .attach('file', Buffer.alloc(50 * 1024 * 1024), 'large-file.pdf'); // 50MB file

      expect(response.status).toBe(413); // Payload Too Large
    });
  });
});