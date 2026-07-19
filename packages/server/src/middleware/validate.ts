import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors: Record<string, string[]> = {};
    errors.array().forEach((err: any) => {
      const field = err.path || err.param;
      if (!formattedErrors[field]) formattedErrors[field] = [];
      formattedErrors[field].push(err.msg);
    });

    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      errors: formattedErrors,
    });
  }
  next();
};
