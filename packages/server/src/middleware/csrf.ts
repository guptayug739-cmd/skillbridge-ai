import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

const CSRF_TOKEN_NAME = 'XSRF-TOKEN';
const CSRF_HEADER_NAME = 'x-xsrf-token';
const CSRF_SECRET =
  process.env.CSRF_SECRET || process.env.JWT_SECRET || 'skillbridge-csrf-fallback';

export const generateCsrfToken = (_req: Request, res: Response, next: NextFunction) => {
  const token = crypto
    .createHmac('sha256', CSRF_SECRET)
    .update(crypto.randomBytes(32).toString('hex'))
    .digest('hex');

  res.cookie(CSRF_TOKEN_NAME, token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 3600000,
  });

  res.setHeader('X-CSRF-Token', token);
  next();
};

export const validateCsrfToken = (req: Request, _res: Response, next: NextFunction) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const cookieToken = req.cookies?.[CSRF_TOKEN_NAME];
  const headerToken = req.headers[CSRF_HEADER_NAME] as string | undefined;

  if (!cookieToken || !headerToken) {
    return next();
  }

  if (cookieToken !== headerToken) {
    return _res.status(403).json({ success: false, error: 'Invalid CSRF token' });
  }

  next();
};
