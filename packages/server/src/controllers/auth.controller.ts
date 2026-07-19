import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { redis } from '../config/redis';
import { AppError } from '../middleware/errorHandler';
import {
  generateAccessToken,
  generateRefreshToken,
  hashPassword,
  comparePassword,
  generateVerificationToken,
  sanitizeUser,
} from '../utils/helpers';
import { sendVerificationEmail, sendPasswordResetEmail, sendOtpEmail } from '../utils/email';
import { extractDeviceInfo, isSuspiciousLogin } from '../utils/device';
import {
  createSession,
  revokeSession,
  revokeAllSessions,
  getActiveSessions,
  updateSessionActivity,
  logLoginAttempt,
  getRecentLogins,
} from '../services/session.service';
import { recordFailedAttempt, resetFailedAttempts } from '../middleware/accountLockout';
import { logger } from '../utils/logger';
import { UserRole } from '@skillbridge/shared';
import { generateOtp } from '../utils/helpers';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, name, role } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new AppError('Email already registered', 400);

    const hashed = await hashPassword(password);
    const verificationToken = generateVerificationToken();

    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        name,
        role: role as UserRole,
        verificationToken,
        wallet: { create: {} },
        ...(role === 'FREELANCER' ? { freelancer: { create: {} } } : {}),
        ...(role === 'CLIENT' ? { client: { create: {} } } : {}),
      },
      include: { freelancer: true, client: true, wallet: true },
    });

    await sendVerificationEmail(email, verificationToken);

    const device = extractDeviceInfo(req);
    const accessToken = generateAccessToken({ id: user.id, email: user.email, role: user.role, name: user.name });
    const refreshToken = generateRefreshToken({ id: user.id });

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await createSession(user.id, refreshToken, device, expiresAt);
    await logLoginAttempt(user.id, email, true, device);

    res.status(201).json({
      success: true,
      data: { user: sanitizeUser(user), accessToken, refreshToken },
      message: 'Registration successful. Please verify your email.',
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const device = extractDeviceInfo(req);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      await logLoginAttempt('unknown', email, false, device, 'User not found');
      await recordFailedAttempt(email);
      throw new AppError('Invalid email or password', 401);
    }

    const valid = await comparePassword(password, user.password);
    if (!valid) {
      await logLoginAttempt(user.id, email, false, device, 'Invalid password');
      await recordFailedAttempt(email);
      throw new AppError('Invalid email or password', 401);
    }

    if (!user.isActive) {
      await logLoginAttempt(user.id, email, false, device, 'Account suspended');
      throw new AppError('Account has been suspended', 403);
    }

    await resetFailedAttempts(email);

    const recentLogins = await getRecentLogins(user.id, 5);
    const { suspicious, reasons } = isSuspiciousLogin(
      device,
      recentLogins.filter((l) => l.success).map((l) => ({
        ipAddress: l.ipAddress || '',
        deviceType: l.deviceType || '',
        browser: l.browser || '',
      })),
    );

    if (suspicious) {
      logger.warn(`Suspicious login for ${email}: ${reasons.join(', ')}`);
    }

    await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });

    const accessToken = generateAccessToken({ id: user.id, email: user.email, role: user.role, name: user.name });
    const refreshToken = generateRefreshToken({ id: user.id });

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await createSession(user.id, refreshToken, device, expiresAt);
    await logLoginAttempt(user.id, email, true, device);

    res.json({
      success: true,
      data: { user: sanitizeUser(user), accessToken, refreshToken, suspiciousLogin: suspicious, suspiciousReasons: reasons },
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;

    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!stored || stored.expiresAt < new Date()) throw new AppError('Invalid or expired refresh token', 401);

    const user = await prisma.user.findUnique({ where: { id: stored.userId } });
    if (!user) throw new AppError('User not found', 404);

    await prisma.refreshToken.delete({ where: { id: stored.id } });

    const device = extractDeviceInfo(req);
    const newAccessToken = generateAccessToken({ id: user.id, email: user.email, role: user.role, name: user.name });
    const newRefreshToken = generateRefreshToken({ id: user.id });

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.refreshToken.create({
      data: { userId: user.id, token: newRefreshToken, expiresAt },
    });
    await createSession(user.id, newRefreshToken, device, expiresAt);

    res.json({
      success: true,
      data: { accessToken: newAccessToken, refreshToken: newRefreshToken },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (token && redis) {
      await redis.set(`blacklist:${token}`, 'true', 'EX', 900);
    }

    const refreshToken = req.body.refreshToken;
    if (refreshToken) {
      const session = await prisma.session.findUnique({ where: { refreshToken } });
      if (session) {
        await revokeSession(session.id);
      }
    }

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

export const logoutAllDevices = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const count = await revokeAllSessions(req.user!.id);
    if (redis) {
      await redis.set(`blacklist:${req.user!.id}:all`, 'true', 'EX', 7 * 24 * 60 * 60);
    }
    res.json({ success: true, message: `Logged out from ${count} sessions` });
  } catch (error) {
    next(error);
  }
};

export const getSessions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessions = await getActiveSessions(req.user!.id);
    res.json({ success: true, data: sessions });
  } catch (error) {
    next(error);
  }
};

export const revokeSpecificSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;
    const session = await prisma.session.findFirst({
      where: { id: sessionId, userId: req.user!.id },
    });
    if (!session) throw new AppError('Session not found', 404);

    await revokeSession(sessionId);
    res.json({ success: true, message: 'Session revoked' });
  } catch (error) {
    next(error);
  }
};

export const getLoginHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [logins, total] = await Promise.all([
      prisma.loginHistory.findMany({
        where: { userId: req.user!.id },
        orderBy: { createdAt: 'desc' },
        skip,
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
      }),
      prisma.loginHistory.count({ where: { userId: req.user!.id } }),
    ]);

    res.json({
      success: true,
      data: logins,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.params;

    const user = await prisma.user.findFirst({ where: { verificationToken: token } });
    if (!user) throw new AppError('Invalid or expired verification token', 400);

    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, verificationToken: null },
    });

    res.json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new AppError('User not found', 404);

    const token = generateVerificationToken();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: token,
        resetPasswordExpires: new Date(Date.now() + 3600000),
      },
    });

    await sendPasswordResetEmail(email, token);

    res.json({ success: true, message: 'Password reset email sent' });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { gt: new Date() },
      },
    });
    if (!user) throw new AppError('Invalid or expired reset token', 400);

    const hashed = await hashPassword(password);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed, resetPasswordToken: null, resetPasswordExpires: null },
    });

    await revokeAllSessions(user.id);

    res.json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        freelancer: { include: { userSkills: { include: { skill: true } }, portfolios: true, resumes: true } },
        client: true,
        admin: true,
        wallet: true,
      },
    });
    if (!user) throw new AppError('User not found', 404);

    res.json({ success: true, data: sanitizeUser(user) });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, avatar } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { ...(name && { name }), ...(avatar && { avatar }), updatedBy: req.user!.id },
    });

    res.json({ success: true, data: sanitizeUser(user) });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) throw new AppError('User not found', 404);

    const valid = await comparePassword(currentPassword, user.password);
    if (!valid) throw new AppError('Current password is incorrect', 400);

    const hashed = await hashPassword(newPassword);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });

    await revokeAllSessions(user.id, undefined);

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

export const sendEmailOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    if (!email) throw new AppError('Email is required', 400);

    const otp = generateOtp();
    if (redis) {
      await redis.set(`otp:email:${email}`, otp, 'EX', 600);
    }
    await sendOtpEmail(email, otp);

    res.json({ success: true, message: 'OTP sent to your email' });
  } catch (error) {
    next(error);
  }
};

export const verifyEmailOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) throw new AppError('Email and OTP are required', 400);

    if (redis) {
      const stored = await redis.get(`otp:email:${email}`);
      if (!stored || stored !== otp) throw new AppError('Invalid or expired OTP', 400);
      await redis.del(`otp:email:${email}`);
    } else {
      throw new AppError('OTP service unavailable', 503);
    }

    if (redis) {
      await redis.set(`verified:email:${email}`, 'true', 'EX', 1800);
    }

    res.json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    next(error);
  }
};

export const sendMobileOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone } = req.body;
    if (!phone) throw new AppError('Phone number is required', 400);

    const otp = generateOtp();
    if (redis) {
      await redis.set(`otp:mobile:${phone}`, otp, 'EX', 600);
    }

    logger.info(`[DEV SMS] To: ${phone}, OTP: ${otp}`);

    res.json({ success: true, message: 'OTP sent to your mobile' });
  } catch (error) {
    next(error);
  }
};

export const verifyMobileOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) throw new AppError('Phone and OTP are required', 400);

    if (redis) {
      const stored = await redis.get(`otp:mobile:${phone}`);
      if (!stored || stored !== otp) throw new AppError('Invalid or expired OTP', 400);
      await redis.del(`otp:mobile:${phone}`);
    } else {
      throw new AppError('OTP service unavailable', 503);
    }

    if (redis) {
      await redis.set(`verified:mobile:${phone}`, 'true', 'EX', 1800);
    }

    res.json({ success: true, message: 'Mobile verified successfully' });
  } catch (error) {
    next(error);
  }
};

export const googleLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, name, googleId, avatar } = req.body;
    const device = extractDeviceInfo(req);

    let user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      if (!user.googleId) {
        await prisma.user.update({ where: { id: user.id }, data: { googleId } });
      }
    } else {
      user = await prisma.user.create({
        data: {
          email,
          name,
          googleId,
          avatar,
          password: '',
          isVerified: true,
          role: UserRole.FREELANCER,
          wallet: { create: {} },
          freelancer: { create: {} },
        },
      });
    }

    await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });

    const accessToken = generateAccessToken({ id: user.id, email: user.email, role: user.role, name: user.name });
    const refreshToken = generateRefreshToken({ id: user.id });

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.refreshToken.create({
      data: { userId: user.id, token: refreshToken, expiresAt },
    });
    await createSession(user.id, refreshToken, device, expiresAt);
    await logLoginAttempt(user.id, email, true, device);

    res.json({
      success: true,
      data: { user: sanitizeUser(user), accessToken, refreshToken },
    });
  } catch (error) {
    next(error);
  }
};
