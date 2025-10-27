import { EncryptionUtils } from '../../utils/encryption';

describe('Security Tests - Standalone', () => {
  beforeAll(() => {
    // Set test encryption key
    process.env['ENCRYPTION_KEY'] = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    process.env['HASH_SALT'] = 'test-salt-for-security-tests';
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

    it('should encrypt and decrypt basic data correctly', () => {
      const plaintext = 'sensitive medical data';
      
      const encrypted = EncryptionUtils.encrypt(plaintext);
      expect(encrypted).not.toBe(plaintext);
      expect(encrypted.length).toBeGreaterThan(plaintext.length);

      const decrypted = EncryptionUtils.decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should hash data consistently for searching', () => {
      const data = 'sensitive-search-term';
      const hash1 = EncryptionUtils.hash(data);
      const hash2 = EncryptionUtils.hash(data);

      expect(hash1).toBe(hash2); // Same input should produce same hash
      expect(hash1).not.toBe(data); // Hash should be different from input
      expect(hash1.length).toBe(64); // SHA-256 produces 64-character hex string
    });
  });

  describe('Performance Under Load - Encryption', () => {
    it('should handle bulk encryption operations efficiently', () => {
      const startTime = Date.now();
      const operations = 100;
      
      const testData = Array(operations).fill(null).map((_, index) => ({
        diagnosis: `Test diagnosis ${index}`,
        prescription: `Test prescription ${index}`,
        notes: `Test notes ${index}`,
        symptoms: `Test symptoms ${index}`
      }));

      // Encrypt all data
      const encrypted = testData.map(data => EncryptionUtils.encryptMedicalData(data));
      
      // Decrypt all data
      const decrypted = encrypted.map(data => EncryptionUtils.decryptMedicalData(data));
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Verify correctness
      expect(decrypted).toEqual(testData);
      
      // Should complete within reasonable time
      expect(totalTime).toBeLessThan(5000); // 5 seconds for 100 operations
      
      // Average operation time should be reasonable
      const avgTime = totalTime / (operations * 2); // 2 operations per item (encrypt + decrypt)
      expect(avgTime).toBeLessThan(25); // 25ms per operation
    });

    it('should handle concurrent encryption operations', async () => {
      const concurrentOperations = 50;
      const startTime = Date.now();
      
      const operations = Array(concurrentOperations).fill(null).map(async (_, index) => {
        const data = {
          diagnosis: `Concurrent test ${index}`,
          prescription: `Concurrent prescription ${index}`,
          notes: `Concurrent notes ${index}`
        };
        
        const encrypted = EncryptionUtils.encryptMedicalData(data);
        const decrypted = EncryptionUtils.decryptMedicalData(encrypted);
        
        return { original: data, decrypted };
      });

      const results = await Promise.all(operations);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Verify all operations completed correctly
      results.forEach(({ original, decrypted }) => {
        expect(decrypted).toEqual(original);
      });

      // Should complete efficiently
      expect(totalTime).toBeLessThan(3000); // 3 seconds for 50 concurrent operations
    });
  });

  describe('Security Validation', () => {
    it('should validate encryption key requirements', () => {
      const invalidKeys = [
        '',
        'short-key',
        '0123456789abcdef', // Too short
        '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdefg', // Invalid hex
        'invalid-hex-characters-in-key-0123456789abcdef0123456789abcdef01'
      ];

      const originalKey = process.env['ENCRYPTION_KEY'];
      
      invalidKeys.forEach(invalidKey => {
        process.env['ENCRYPTION_KEY'] = invalidKey;
        
        expect(() => {
          EncryptionUtils.encrypt('test');
        }).toThrow();
      });
      
      // Restore original key
      process.env['ENCRYPTION_KEY'] = originalKey;
    });

    it('should produce different encrypted outputs for same input', () => {
      const plaintext = 'same input data';
      
      const encrypted1 = EncryptionUtils.encrypt(plaintext);
      const encrypted2 = EncryptionUtils.encrypt(plaintext);
      
      // Should be different due to random IV
      expect(encrypted1).not.toBe(encrypted2);
      
      // But both should decrypt to same plaintext
      expect(EncryptionUtils.decrypt(encrypted1)).toBe(plaintext);
      expect(EncryptionUtils.decrypt(encrypted2)).toBe(plaintext);
    });

    it('should handle edge cases in medical data encryption', () => {
      const edgeCases = [
        { diagnosis: '', prescription: 'test', notes: 'test' },
        { diagnosis: 'test', prescription: '', notes: 'test' },
        { diagnosis: 'test', prescription: 'test', notes: '' },
        { diagnosis: 'very'.repeat(1000), prescription: 'long'.repeat(1000), notes: 'data'.repeat(1000) },
        { diagnosis: 'Special chars: !@#$%^&*()_+{}|:"<>?[]\\;\',./', prescription: 'test', notes: 'test' }
      ];

      edgeCases.forEach(testCase => {
        const encrypted = EncryptionUtils.encryptMedicalData(testCase);
        const decrypted = EncryptionUtils.decryptMedicalData(encrypted);
        expect(decrypted).toEqual(testCase);
      });
    });
  });
});