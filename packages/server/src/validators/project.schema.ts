import { z } from 'zod';

export const createProjectSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  budgetMin: z.number().positive('Minimum budget must be positive'),
  budgetMax: z.number().positive('Maximum budget must be positive'),
  deadline: z.string().datetime().optional(),
  skills: z.array(z.string()).min(1, 'At least one skill is required'),
  category: z.string().min(1, 'Category is required'),
});

export const updateProjectSchema = z.object({
  title: z.string().min(5).max(200).optional(),
  description: z.string().min(20).optional(),
  budgetMin: z.number().positive().optional(),
  budgetMax: z.number().positive().optional(),
  deadline: z.string().datetime().optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
});

export const searchProjectsSchema = z.object({
  query: z.string().optional(),
  skills: z.array(z.string()).optional(),
  budgetMin: z.coerce.number().optional(),
  budgetMax: z.coerce.number().optional(),
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().positive().max(50).default(10),
});
