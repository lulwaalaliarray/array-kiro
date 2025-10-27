import Joi from 'joi';
// Validation schemas for PatientCare API

// Common validation patterns
const emailSchema = Joi.string().email().required();
const passwordSchema = Joi.string()
  .min(8)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/)
  .required()
  .messages({
    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    'string.min': 'Password must be at least 8 characters long',
  });

const phoneSchema = Joi.string()
  .pattern(/^\+?[\d\s\-\(\)]+$/)
  .min(10)
  .max(15)
  .required()
  .messages({
    'string.pattern.base': 'Phone number must contain only digits, spaces, hyphens, and parentheses',
  });

// User registration validation schemas
export const patientRegistrationSchema = Joi.object({
  email: emailSchema,
  password: passwordSchema,
  name: Joi.string().min(2).max(100).required(),
  age: Joi.number().integer().min(1).max(120).required(),
  gender: Joi.string().valid('male', 'female', 'other').required(),
  phone: phoneSchema,
  address: Joi.string().min(10).max(500).required(),
});

export const doctorRegistrationSchema = Joi.object({
  email: emailSchema,
  password: passwordSchema,
  name: Joi.string().min(2).max(100).required(),
  profilePicture: Joi.string().uri().optional(),
  medicalLicenseNumber: Joi.string().min(5).max(50).required(),
  qualifications: Joi.array().items(Joi.string().min(2).max(100)).min(1).required(),
  yearsOfExperience: Joi.number().integer().min(0).max(60).required(),
  specializations: Joi.array().items(Joi.string().min(2).max(100)).min(1).required(),
  phone: phoneSchema,
  clinicName: Joi.string().min(2).max(200).required(),
  clinicAddress: Joi.string().min(10).max(500).required(),
  consultationFee: Joi.number().positive().precision(2).required(),
});

export const adminRegistrationSchema = Joi.object({
  email: emailSchema,
  password: passwordSchema,
  name: Joi.string().min(2).max(100).required(),
  phone: phoneSchema,
});

// Login validation schema
export const loginSchema = Joi.object({
  email: emailSchema,
  password: Joi.string().required(),
});

// Token refresh validation schema
export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

// Password reset validation schemas
export const forgotPasswordSchema = Joi.object({
  email: emailSchema,
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  newPassword: passwordSchema,
});

// Profile update validation schemas
export const updatePatientProfileSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  age: Joi.number().integer().min(1).max(120).optional(),
  gender: Joi.string().valid('male', 'female', 'other').optional(),
  phone: phoneSchema.optional(),
  address: Joi.string().min(10).max(500).optional(),
});

export const updateDoctorProfileSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  profilePicture: Joi.string().uri().optional(),
  qualifications: Joi.array().items(Joi.string().min(2).max(100)).min(1).optional(),
  yearsOfExperience: Joi.number().integer().min(0).max(60).optional(),
  specializations: Joi.array().items(Joi.string().min(2).max(100)).min(1).optional(),
  phone: phoneSchema.optional(),
  clinicName: Joi.string().min(2).max(200).optional(),
  clinicAddress: Joi.string().min(10).max(500).optional(),
  consultationFee: Joi.number().positive().precision(2).optional(),
  isAcceptingPatients: Joi.boolean().optional(),
});

// Validation middleware helper
export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: errors,
          timestamp: new Date().toISOString(),
        },
      });
    }

    req.body = value;
    next();
  };
};