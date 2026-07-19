import { PrismaClient } from '@prisma/client';
import { softDeleteMiddleware } from '../middleware/softDelete';
import { logger } from '../utils/logger';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

prisma.$use(softDeleteMiddleware());
