import { prisma } from '../config/database';
import { redis } from '../config/redis';
import { DeviceInfo } from '../utils/device';
import { logger } from '../utils/logger';

export async function createSession(
  userId: string,
  refreshToken: string,
  device: DeviceInfo,
  expiresAt: Date,
) {
  return prisma.session.create({
    data: {
      userId,
      refreshToken,
      ipAddress: device.ipAddress,
      userAgent: device.userAgent,
      deviceName: device.deviceName,
      deviceType: device.deviceType,
      browser: device.browser,
      os: device.os,
      expiresAt,
    },
  });
}

export async function revokeSession(sessionId: string) {
  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session) return null;

  await prisma.session.update({
    where: { id: sessionId },
    data: { isActive: false },
  });

  if (redis) {
    await redis.del(`session:${session.refreshToken}`);
  }

  return session;
}

export async function revokeAllSessions(userId: string, exceptSessionId?: string) {
  const where: any = { userId, isActive: true };
  if (exceptSessionId) {
    where.id = { not: exceptSessionId };
  }

  const sessions = await prisma.session.findMany({ where });
  const tokenIds = sessions.map((s) => s.refreshToken);

  await prisma.session.updateMany({
    where,
    data: { isActive: false },
  });

  if (redis && tokenIds.length > 0) {
    const pipeline = redis.pipeline();
    tokenIds.forEach((token) => pipeline.del(`session:${token}`));
    await pipeline.exec();
  }

  return sessions.length;
}

export async function getActiveSessions(userId: string) {
  return prisma.session.findMany({
    where: { userId, isActive: true },
    orderBy: { lastActiveAt: 'desc' },
    select: {
      id: true,
      deviceName: true,
      deviceType: true,
      browser: true,
      os: true,
      ipAddress: true,
      location: true,
      lastActiveAt: true,
      createdAt: true,
    },
  });
}

export async function updateSessionActivity(refreshToken: string) {
  if (redis) {
    await redis.set(`session:${refreshToken}`, '1', 'EX', 7 * 24 * 60 * 60);
  }

  await prisma.session
    .update({
      where: { refreshToken },
      data: { lastActiveAt: new Date() },
    })
    .catch(() => {});
}

export async function logLoginAttempt(
  userId: string,
  email: string,
  success: boolean,
  device: DeviceInfo,
  failureReason?: string,
) {
  await prisma.loginHistory.create({
    data: {
      userId,
      email,
      success,
      ipAddress: device.ipAddress,
      userAgent: device.userAgent,
      deviceName: device.deviceName,
      deviceType: device.deviceType,
      browser: device.browser,
      os: device.os,
      failureReason,
    },
  });
}

export async function getRecentLogins(userId: string, limit = 10) {
  return prisma.loginHistory.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      success: true,
      ipAddress: true,
      deviceName: true,
      deviceType: true,
      browser: true,
      os: true,
      location: true,
      failureReason: true,
      createdAt: true,
    },
  });
}

export async function cleanupExpiredSessions() {
  const result = await prisma.session.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  });

  if (result.count > 0) {
    logger.info(`Cleaned up ${result.count} expired sessions`);
  }

  return result.count;
}
