import { Request, Response, NextFunction } from 'express';
import xss from 'xss';

const sanitizeValue = (value: any): any => {
  if (typeof value === 'string') return xss(value);
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (value && typeof value === 'object') {
    return Object.keys(value).reduce(
      (acc, key) => {
        acc[key] = sanitizeValue(value[key]);
        return acc;
      },
      {} as Record<string, any>,
    );
  }
  return value;
};

export const sanitizeInput = (req: Request, _res: Response, next: NextFunction) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    const sanitized: Record<string, any> = {};
    for (const [key, val] of Object.entries(req.query)) {
      sanitized[key] = sanitizeValue(val);
    }
    req.query = sanitized;
  }
  if (req.params && typeof req.params === 'object') {
    const sanitized: Record<string, any> = {};
    for (const [key, val] of Object.entries(req.params)) {
      sanitized[key] = sanitizeValue(val);
    }
    req.params = sanitized;
  }
  next();
};
