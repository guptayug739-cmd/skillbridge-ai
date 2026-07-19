import nodemailer from 'nodemailer';
import { config } from '../config';
import { logger } from './logger';

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.port === 465,
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
});

export async function sendEmail(to: string, subject: string, html: string) {
  if (config.nodeEnv === 'development') {
    logger.info(`[DEV EMAIL] To: ${to}, Subject: ${subject}`);
    return;
  }

  try {
    await transporter.sendMail({
      from: `"SkillBridge AI" <${config.smtp.user}>`,
      to,
      subject,
      html,
    });
  } catch (error) {
    logger.error('Email send failed:', error);
  }
}

export function sendVerificationEmail(to: string, token: string) {
  const url = `${config.clientUrl}/verify-email?token=${token}`;
  return sendEmail(
    to,
    'Verify your SkillBridge AI account',
    `<h1>Welcome to SkillBridge AI!</h1><p>Click <a href="${url}">here</a> to verify your email address.</p><p>Or paste this link: ${url}</p>`,
  );
}

export function sendOtpEmail(to: string, otp: string) {
  return sendEmail(
    to,
    'Your SkillBridge AI OTP Code',
    `
    <div style="font-family: 'Inter', sans-serif; max-width: 480px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 32px; text-align: center; border-radius: 16px 16px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">SkillBridge AI</h1>
      </div>
      <div style="background: #ffffff; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px;">
        <h2 style="color: #111827; margin: 0 0 8px;">Email Verification</h2>
        <p style="color: #6b7280; margin: 0 0 24px;">Use the OTP below to verify your email address.</p>
        <div style="background: #f3f4f6; border-radius: 12px; padding: 20px; text-align: center; letter-spacing: 12px; font-size: 32px; font-weight: 700; color: #4f46e5;">${otp}</div>
        <p style="color: #9ca3af; font-size: 12px; margin: 16px 0 0;">This OTP expires in 10 minutes.</p>
      </div>
    </div>
    `,
  );
}

export function sendPasswordResetEmail(to: string, token: string) {
  const url = `${config.clientUrl}/reset-password?token=${token}`;
  return sendEmail(
    to,
    'Reset your SkillBridge AI password',
    `<h1>Password Reset</h1><p>Click <a href="${url}">here</a> to reset your password.</p><p>Or paste this link: ${url}</p><p>This link expires in 1 hour.</p>`,
  );
}
