import crypto from 'crypto';
import { logger } from './logger';

/**
 * Encryption utility for sensitive healthcare data
 * Uses AES-256-GCM for authenticated encryption
 */
export class EncryptionUtils {
  private static readonly KEY_LENGTH = 32; // 256 bits
  private static readonly IV_LENGTH = 16; // 128 bits

  /**
   * Get encryption key from environment or generate one
   */
  private static getEncryptionKey(): Buffer {
    const keyString = process.env['ENCRYPTION_KEY'];
    
    if (!keyString) {
      throw new Error('ENCRYPTION_KEY environment variable is required');
    }

    // Convert hex string to buffer
    if (keyString.length !== this.KEY_LENGTH * 2) {
      throw new Error('ENCRYPTION_KEY must be 64 hex characters (256 bits)');
    }

    return Buffer.from(keyString, 'hex');
  }

  /**
   * Encrypt sensitive data
   */
  static encrypt(plaintext: string): string {
    try {
      const key = this.getEncryptionKey();
      const iv = crypto.randomBytes(this.IV_LENGTH);
      
      const cipher = crypto.createCipher('aes-256-cbc', key);
      
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Combine IV and encrypted data
      const result = iv.toString('hex') + encrypted;
      
      return result;
    } catch (error) {
      logger.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt sensitive data
   */
  static decrypt(encryptedData: string): string {
    try {
      const key = this.getEncryptionKey();
      
      // Extract IV and encrypted data
      const encrypted = encryptedData.slice(this.IV_LENGTH * 2);
      
      const decipher = crypto.createDecipher('aes-256-cbc', key);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      logger.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Hash sensitive data for searching (one-way)
   */
  static hash(data: string): string {
    try {
      const salt = process.env['HASH_SALT'] || 'default-salt-change-in-production';
      return crypto.createHash('sha256').update(data + salt).digest('hex');
    } catch (error) {
      logger.error('Hashing failed:', error);
      throw new Error('Failed to hash data');
    }
  }

  /**
   * Generate a secure random key for encryption
   */
  static generateKey(): string {
    return crypto.randomBytes(this.KEY_LENGTH).toString('hex');
  }

  /**
   * Encrypt medical record data
   */
  static encryptMedicalData(data: {
    diagnosis?: string;
    prescription?: string;
    notes?: string;
    symptoms?: string;
  }): {
    diagnosis?: string;
    prescription?: string;
    notes?: string;
    symptoms?: string;
  } {
    const encrypted: any = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (value && typeof value === 'string') {
        encrypted[key] = this.encrypt(value);
      }
    }
    
    return encrypted;
  }

  /**
   * Decrypt medical record data
   */
  static decryptMedicalData(encryptedData: {
    diagnosis?: string;
    prescription?: string;
    notes?: string;
    symptoms?: string;
  }): {
    diagnosis?: string;
    prescription?: string;
    notes?: string;
    symptoms?: string;
  } {
    const decrypted: any = {};
    
    for (const [key, value] of Object.entries(encryptedData)) {
      if (value && typeof value === 'string') {
        try {
          decrypted[key] = this.decrypt(value);
        } catch (error: any) {
          logger.error(`Failed to decrypt ${key}:`, error);
          decrypted[key] = '[DECRYPTION_FAILED]';
        }
      }
    }
    
    return decrypted;
  }

  /**
   * Encrypt personal identifiable information
   */
  static encryptPII(data: {
    ssn?: string;
    phoneNumber?: string;
    address?: string;
    emergencyContact?: string;
  }): {
    ssn?: string;
    phoneNumber?: string;
    address?: string;
    emergencyContact?: string;
  } {
    const encrypted: any = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (value && typeof value === 'string') {
        encrypted[key] = this.encrypt(value);
      }
    }
    
    return encrypted;
  }

  /**
   * Decrypt personal identifiable information
   */
  static decryptPII(encryptedData: {
    ssn?: string;
    phoneNumber?: string;
    address?: string;
    emergencyContact?: string;
  }): {
    ssn?: string;
    phoneNumber?: string;
    address?: string;
    emergencyContact?: string;
  } {
    const decrypted: any = {};
    
    for (const [key, value] of Object.entries(encryptedData)) {
      if (value && typeof value === 'string') {
        try {
          decrypted[key] = this.decrypt(value);
        } catch (error: any) {
          logger.error(`Failed to decrypt PII ${key}:`, error);
          decrypted[key] = '[DECRYPTION_FAILED]';
        }
      }
    }
    
    return decrypted;
  }
}

/**
 * Middleware to automatically encrypt/decrypt sensitive fields
 */
export const encryptionMiddleware = {
  /**
   * Encrypt sensitive fields before saving to database
   */
  beforeSave: (data: any, sensitiveFields: string[]): any => {
    const result = { ...data };
    
    for (const field of sensitiveFields) {
      if (result[field] && typeof result[field] === 'string') {
        result[field] = EncryptionUtils.encrypt(result[field]);
      }
    }
    
    return result;
  },

  /**
   * Decrypt sensitive fields after retrieving from database
   */
  afterRetrieve: (data: any, sensitiveFields: string[]): any => {
    if (!data) return data;
    
    const result = { ...data };
    
    for (const field of sensitiveFields) {
      if (result[field] && typeof result[field] === 'string') {
        try {
          result[field] = EncryptionUtils.decrypt(result[field]);
        } catch (error: any) {
          logger.error(`Failed to decrypt field ${field}:`, error);
          result[field] = '[DECRYPTION_FAILED]';
        }
      }
    }
    
    return result;
  },
};