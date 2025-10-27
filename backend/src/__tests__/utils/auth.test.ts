import { AuthUtils } from '../../utils/auth';

// Mock UserRole enum since Prisma client isn't available in tests
enum UserRole {
  PATIENT = 'PATIENT',
  DOCTOR = 'DOCTOR',
  ADMIN = 'ADMIN'
}

describe('AuthUtils', () => {
  describe('Password hashing and verification', () => {
    it('should hash and verify password correctly', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = await AuthUtils.hashPassword(password);
      
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(0);
      
      const isValid = await AuthUtils.verifyPassword(password, hashedPassword);
      expect(isValid).toBe(true);
      
      const isInvalid = await AuthUtils.verifyPassword('wrongpassword', hashedPassword);
      expect(isInvalid).toBe(false);
    });

    it('should handle empty password hashing', async () => {
      const hashedEmpty = await AuthUtils.hashPassword('');
      expect(hashedEmpty).toBeDefined();
      expect(typeof hashedEmpty).toBe('string');
    });

    it('should handle invalid hash verification', async () => {
      const result = await AuthUtils.verifyPassword('password', 'invalid-hash');
      expect(result).toBe(false);
    });
  });

  describe('JWT token generation and verification', () => {
    const payload = {
      userId: 'test-user-id',
      email: 'test@example.com',
      role: UserRole.PATIENT,
    };

    it('should generate and verify access token', () => {
      const token = AuthUtils.generateAccessToken(payload);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
      
      const decoded = AuthUtils.verifyAccessToken(token);
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
    });

    it('should generate and verify refresh token', () => {
      const token = AuthUtils.generateRefreshToken(payload);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
      
      const decoded = AuthUtils.verifyRefreshToken(token);
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
    });

    it('should generate both tokens with different values', () => {
      const tokens = AuthUtils.generateTokens(payload);
      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
      expect(typeof tokens.accessToken).toBe('string');
      expect(typeof tokens.refreshToken).toBe('string');
      expect(tokens.accessToken).not.toBe(tokens.refreshToken);
    });

    it('should throw error for invalid access token', () => {
      expect(() => {
        AuthUtils.verifyAccessToken('invalid-token');
      }).toThrow(/Invalid access token/);
    });

    it('should throw error for invalid refresh token', () => {
      expect(() => {
        AuthUtils.verifyRefreshToken('invalid-token');
      }).toThrow(/Invalid refresh token/);
    });

    it('should handle malformed tokens', () => {
      expect(() => {
        AuthUtils.verifyAccessToken('malformed.token');
      }).toThrow(/Invalid access token/);
      
      expect(() => {
        AuthUtils.verifyRefreshToken('malformed.token');
      }).toThrow(/Invalid refresh token/);
    });
  });

  describe('Token extraction from header', () => {
    it('should extract token from valid Bearer header', () => {
      const token = 'test-token-123';
      const header = `Bearer ${token}`;
      const extracted = AuthUtils.extractTokenFromHeader(header);
      expect(extracted).toBe(token);
    });

    it('should return null for invalid header formats', () => {
      expect(AuthUtils.extractTokenFromHeader('Invalid header')).toBeNull();
      expect(AuthUtils.extractTokenFromHeader('')).toBeNull();
      expect(AuthUtils.extractTokenFromHeader(undefined)).toBeNull();
      expect(AuthUtils.extractTokenFromHeader('Basic token')).toBeNull();
      expect(AuthUtils.extractTokenFromHeader('Bearer')).toBeNull();
    });

    it('should handle Bearer header with empty token', () => {
      const extracted = AuthUtils.extractTokenFromHeader('Bearer ');
      expect(extracted).toBe('');
    });

    it('should handle Bearer header with extra spaces', () => {
      const token = 'test-token-123';
      const header = `Bearer  ${token}`;
      const extracted = AuthUtils.extractTokenFromHeader(header);
      expect(extracted).toBe(` ${token}`); // Should include the extra space
    });
  });

  describe('Password strength validation', () => {
    it('should validate strong password', () => {
      const result = AuthUtils.validatePasswordStrength('StrongPass123!');
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should reject password that is too short', () => {
      const result = AuthUtils.validatePasswordStrength('Short1!');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('at least 8 characters'))).toBe(true);
    });

    it('should reject password without uppercase letter', () => {
      const result = AuthUtils.validatePasswordStrength('nouppercase123!');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('uppercase letter'))).toBe(true);
    });

    it('should reject password without lowercase letter', () => {
      const result = AuthUtils.validatePasswordStrength('NOLOWERCASE123!');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('lowercase letter'))).toBe(true);
    });

    it('should reject password without numbers', () => {
      const result = AuthUtils.validatePasswordStrength('NoNumbers!');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('number'))).toBe(true);
    });

    it('should reject password without special characters', () => {
      const result = AuthUtils.validatePasswordStrength('NoSpecialChars123');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('special character'))).toBe(true);
    });

    it('should return multiple errors for very weak password', () => {
      const result = AuthUtils.validatePasswordStrength('weak');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(4); // Should have multiple validation errors
    });

    it('should validate edge case passwords', () => {
      // Minimum valid password
      const minValid = AuthUtils.validatePasswordStrength('Aa1!bcde');
      expect(minValid.isValid).toBe(true);
      
      // Long password with all requirements
      const longValid = AuthUtils.validatePasswordStrength('VeryLongPassword123!WithManyCharacters');
      expect(longValid.isValid).toBe(true);
    });
  });
});