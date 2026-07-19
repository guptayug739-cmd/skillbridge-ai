import dotenv from 'dotenv';
dotenv.config();

import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL: z.string().default('redis://localhost:6379'),

  JWT_SECRET: z.string().min(8, 'JWT_SECRET must be at least 8 characters'),
  JWT_REFRESH_SECRET: z.string().min(8, 'JWT_REFRESH_SECRET must be at least 8 characters'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  GOOGLE_CLIENT_ID: z.string().optional().default(''),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(''),
  GOOGLE_CALLBACK_URL: z
    .string()
    .url()
    .optional()
    .default('http://localhost:5000/api/auth/google/callback'),

  RAZORPAY_KEY_ID: z.string().optional().default(''),
  RAZORPAY_KEY_SECRET: z.string().optional().default(''),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional().default(''),

  OPENAI_API_KEY: z.string().optional().default(''),
  GEMINI_API_KEY: z.string().optional().default(''),
  AI_PROVIDER: z.enum(['openai', 'gemini']).default('openai'),

  CLOUDINARY_CLOUD_NAME: z.string().optional().default(''),
  CLOUDINARY_API_KEY: z.string().optional().default(''),
  CLOUDINARY_API_SECRET: z.string().optional().default(''),

  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.format();
    const errors = result.error.flatten().fieldErrors;

    console.error('\x1b[31m[ENV VALIDATION]\x1b[0m Environment validation failed:');
    for (const [field, messages] of Object.entries(errors)) {
      console.error(`  \x1b[33m${field}\x1b[0m: ${messages?.join(', ')}`);
    }
    console.error('');

    if (process.env.NODE_ENV === 'production') {
      console.error('\x1b[31mExiting due to missing environment variables in production.\x1b[0m');
      process.exit(1);
    }

    console.warn(
      '\x1b[33m[ENV VALIDATION]\x1b[0m Using defaults for missing vars (development mode)\n',
    );

    const fallback = envSchema.parse({
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/skillbridge?schema=public',
      JWT_SECRET: process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production',
      JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-in-production',
    });

    return fallback;
  }

  return result.data;
}

export const env = validateEnv();
