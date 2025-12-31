import { z } from 'zod';
import { 
  UNIVERSITY_DOMAINS, 
  MAX_FILE_SIZE, 
  ALLOWED_FILE_TYPES,
  CATEGORIES,
  LOCATIONS,
  CONTACT_INFO_OPTIONS,
  USER_ROLES,
  DATE_FORMATS
} from './constants';

// Email Schema - Updated for COMSATS emails
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .refine(
    (email) => {
      const domain = email.split('@')[1];
      return UNIVERSITY_DOMAINS.some(uniDomain => 
        domain.toLowerCase().endsWith(uniDomain.toLowerCase())
      );
    },
    {
      message: 'Please use your COMSATS University email address',
    }
  );

// Alternative email schema for login (allows personal emails too)
export const loginEmailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .refine(
    (email) => {
      const domain = email.split('@')[1]?.toLowerCase();
      return UNIVERSITY_DOMAINS.some(uniDomain => 
        domain?.endsWith(uniDomain.toLowerCase())
      ) || domain?.includes('gmail.com') || domain?.includes('yahoo.com');
    },
    {
      message: 'Please use COMSATS email or personal email (Gmail/Yahoo)',
    }
  );

export const passwordSchema = z
  .string()
  .min(1, 'Password is required')
  .min(6, 'Password must be at least 6 characters')
  .max(50, 'Password must be less than 50 characters');

export const phoneSchema = z
  .string()
  .optional()
  .refine(
    (phone) => !phone || /^[\+]?[0-9][\d]{9,14}$/.test(phone.replace(/[\s\-\(\)]/g, '')),
    {
      message: 'Please enter a valid phone number (e.g., +923001234567)',
    }
  );

export const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name must be less than 50 characters')
  .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces');

export const caseTitleSchema = z
  .string()
  .min(1, 'Title is required')
  .min(5, 'Title must be at least 5 characters')
  .max(100, 'Title must be less than 100 characters');

export const caseDescriptionSchema = z
  .string()
  .min(1, 'Description is required')
  .min(20, 'Description must be at least 20 characters')
  .max(1000, 'Description must be less than 1000 characters');

export const fileSchema = z
  .instanceof(File)
  .optional()
  .refine(
    (file) => !file || file.size <= MAX_FILE_SIZE,
    {
      message: `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
    }
  )
  .refine(
    (file) => !file || ALLOWED_FILE_TYPES.includes(file.type),
    {
      message: 'Only JPEG, PNG, JPG, and WebP images are allowed',
    }
  );

// Category schema with validation against allowed categories
export const categorySchema = z
  .string()
  .min(1, 'Please select a category')
  .refine(
    (category) => CATEGORIES.includes(category as any),
    {
      message: 'Please select a valid category',
    }
  );

// Location schema with validation against allowed locations
export const locationSchema = z
  .string()
  .min(1, 'Please select a location')
  .refine(
    (location) => LOCATIONS.includes(location as any),
    {
      message: 'Please select a valid location',
    }
  );

// Date schema for Supabase (string ISO format)
export const dateSchema = z
  .string()
  .min(1, 'Date is required')
  .refine(
    (val) => {
      const date = new Date(val);
      return !isNaN(date.getTime()) && date <= new Date();
    },
    {
      message: 'Please select a valid date (cannot be in the future)',
    }
  );

// Reward schema
export const rewardSchema = z
  .union([
    z.string().transform(val => parseFloat(val)),
    z.number()
  ])
  .optional()
  .refine(
    (val) => val === undefined || val >= 0,
    {
      message: 'Reward must be a positive number',
    }
  )
  .transform(val => val || null);

// Contact preference schema (updated field name for Supabase)
export const contactInfoSchema = z
  .enum([CONTACT_INFO_OPTIONS.CHAT, CONTACT_INFO_OPTIONS.EMAIL, CONTACT_INFO_OPTIONS.PHONE])
  .default(CONTACT_INFO_OPTIONS.CHAT);

// Student ID schema
export const studentIdSchema = z
  .string()
  .optional()
  .refine(
    (id) => !id || /^[A-Za-z0-9]{6,20}$/.test(id),
    {
      message: 'Student ID must be 6-20 alphanumeric characters',
    }
  );

// Department schema
export const departmentSchema = z
  .string()
  .max(100, 'Department must be less than 100 characters')
  .optional();
// Role schema
export const roleSchema = z
  .enum([USER_ROLES.STUDENT, USER_ROLES.FACULTY, USER_ROLES.STAFF])
  .default(USER_ROLES.STUDENT);

// Form Schemas
export const loginSchema = z.object({
  email: loginEmailSchema, // Uses more permissive email schema
  password: passwordSchema,
  rememberMe: z.boolean().optional(),
});

export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema, // Strict COMSATS email only for registration
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  phone: phoneSchema,
  studentId: studentIdSchema,
  department: departmentSchema,
  role: roleSchema,
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Updated case schema for Supabase field names
export const caseSchema = z.object({
  type: z.enum(['lost', 'found']),
  title: caseTitleSchema,
  description: caseDescriptionSchema,
  category: categorySchema,
  location: locationSchema,
  date: dateSchema,
  reward: rewardSchema,
  contact_info: contactInfoSchema, // Changed from contactPreference to contact_info
});

// Profile update schema
export const profileSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
  studentId: studentIdSchema,
  department: departmentSchema,
  display_name: z.string().max(50, 'Display name too long').optional(),
});

// Admin login schema
export const adminLoginSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  password: z.string()
    .min(1, 'Password is required'),
});

// Password reset schema
export const passwordResetSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
});

// New password schema (for reset/change)
export const newPasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Case status update schema
export const caseStatusSchema = z.object({
  status: z.enum(['active', 'claimed', 'resolved', 'closed']),
  notes: z.string().max(500, 'Notes too long').optional(),
});

// Chat message schema
export const messageSchema = z.object({
  content: z.string()
    .min(1, 'Message cannot be empty')
    .max(1000, 'Message too long'),
});

// Search schema
export const searchSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  location: z.string().optional(),
  status: z.string().optional(),
  type: z.enum(['lost', 'found', '']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

// Type inference for TypeScript
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type CaseFormData = z.infer<typeof caseSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
export type AdminLoginFormData = z.infer<typeof adminLoginSchema>;
export type PasswordResetFormData = z.infer<typeof passwordResetSchema>;
export type NewPasswordFormData = z.infer<typeof newPasswordSchema>;
export type CaseStatusFormData = z.infer<typeof caseStatusSchema>;
export type MessageFormData = z.infer<typeof messageSchema>;
export type SearchFormData = z.infer<typeof searchSchema>;
