import { z } from 'zod';

export const submitProposalSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  bidAmount: z.number().positive('Bid amount must be positive'),
  deliveryTime: z.number().positive('Delivery time must be positive').max(365),
  coverLetter: z.string().min(50, 'Cover letter must be at least 50 characters').max(5000),
});

export const updateProposalSchema = z.object({
  bidAmount: z.number().positive().optional(),
  deliveryTime: z.number().positive().max(365).optional(),
  coverLetter: z.string().min(50).max(5000).optional(),
});
