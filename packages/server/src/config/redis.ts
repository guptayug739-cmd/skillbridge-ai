import Redis from 'ioredis';
import { config } from './index';
import { logger } from '../utils/logger';

let redis: Redis | null = null;

if (config.redis.url) {
  redis = new Redis(config.redis.url, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 3) return null;
      return Math.min(times * 200, 2000);
    },
  });

  redis.on('error', (err) => {
    logger.error('Redis connection error:', err.message);
  });

  redis.on('connect', () => {
    logger.info('Connected to Redis');
  });
}

export { redis };
