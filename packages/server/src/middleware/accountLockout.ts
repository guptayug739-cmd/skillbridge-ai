import { Request, Response, NextFunction } from 'express';
import { redis } from '../config/redis';
import { AppError } from './errorHandler';
import { logger } from '../utils/logger';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60;
const WINDOW_SIZE = 15 * 60;

export const checkAccountLockout = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    if (!email || !redis) return next();

    const key = `lockout:${email.toLowerCase()}`;
    const isLocked = await redis.get(key);
    if (isLocked) {
      const ttl = await redis.ttl(key);
      logger.warn(`Locked out account attempted login: ${email}`);
      throw new AppError(
        `Account temporarily locked. Try again in ${Math.ceil(ttl / 60)} minutes.`,
        429,
      );
    }

    next();
  } catch (error) {
    if (error instanceof AppError) return next(error);
    next();
  }
};

export const recordFailedAttempt = async (email: string) => {
  if (!redis) return;

  const key = `failed:${email.toLowerCase()}`;
  const attempts = await redis.incr(key);
  if (attempts === 1) {
    await redis.expire(key, WINDOW_SIZE);
  }

  if (attempts >= MAX_FAILED_ATTEMPTS) {
    const lockKey = `lockout:${email.toLowerCase()}`;
    await redis.set(lockKey, 'locked', 'EX', LOCKOUT_DURATION);
    await redis.del(key);
    logger.warn(`Account locked after ${MAX_FAILED_ATTEMPTS} failed attempts: ${email}`);
  }
};

export const resetFailedAttempts = async (email: string) => {
  if (!redis) return;
  await redis.del(`failed:${email.toLowerCase()}`);
};
