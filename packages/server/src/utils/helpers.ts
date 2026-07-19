import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { UserRole } from '@skillbridge/shared';

export function generateAccessToken(payload: { id: string; email: string; role: UserRole; name: string }): string {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn as any });
}

export function generateRefreshToken(payload: { id: string }): string {
  return jwt.sign(payload, config.jwt.refreshSecret, { expiresIn: config.jwt.refreshExpiresIn as any });
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateVerificationToken(): string {
  return uuidv4() + '-' + Date.now().toString(36);
}

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function generateOrderId(): string {
  return `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

export function generateTransactionRef(): string {
  return `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

export function sanitizeUser(user: any) {
  const { password, verificationToken, resetPasswordToken, resetPasswordExpires, ...sanitized } = user;
  return sanitized;
}

export function calculatePlatformFee(amount: number, isFirstProject: boolean): number {
  const rate = isFirstProject ? 0.05 : 0.15;
  return Math.round(amount * rate * 100) / 100;
}
