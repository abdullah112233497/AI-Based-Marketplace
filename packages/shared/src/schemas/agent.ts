import { z } from 'zod';
import { AgentStatus } from '../enums.js';

export const UpdateAgentProfileSchema = z.object({
  shopName: z.string().min(3, 'Shop name is required'),
  shopDescription: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  address: z.string().min(5, 'Physical address is required'),
  contactPhone: z.string().min(10, 'Contact phone is required'),
  logoUrl: z.string().url().optional(),
  bannerUrl: z.string().url().optional(),
  workingHours: z.string().optional()
});

export const AdminReviewAgentSchema = z.object({
  status: z.enum([AgentStatus.APPROVED, AgentStatus.REJECTED, AgentStatus.SUSPENDED]),
  reviewNotes: z.string().optional(),
  commissionRatePercent: z.number().min(0).max(50).optional()
});
