import { z } from 'zod';
import { UserRole } from '../enums.js';

export const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const RegisterCustomerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Valid Pakistani mobile number required (e.g. 03001234567)').regex(/^(03[0-9]{9}|\+92[0-9]{10})$/, 'Invalid phone number format'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

export type RegisterCustomerInput = z.infer<typeof RegisterCustomerSchema>;

export const RegisterAgentSchema = z.object({
  name: z.string().min(2, 'Owner name must be at least 2 characters'),
  email: z.string().email('Valid email address required'),
  phone: z.string().min(10, 'Valid mobile number required').regex(/^(03[0-9]{9}|\+92[0-9]{10})$/, 'Invalid phone number format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  shopName: z.string().min(3, 'Shop/Business name must be at least 3 characters'),
  city: z.string().min(2, 'City is required'),
  address: z.string().min(5, 'Physical shop address is required'),
  cnicOrTaxId: z.string().min(5, 'CNIC or NTN/Business registration number is required'),
  shopDescription: z.string().optional()
});

export type RegisterAgentInput = z.infer<typeof RegisterAgentSchema>;

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Valid email required')
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Confirm password must be at least 8 characters')
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords must match',
  path: ['confirmPassword']
});
