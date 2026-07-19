import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export const validateSchema = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors: Record<string, string[]> = {};
        error.errors.forEach((err) => {
          const field = err.path.join('.');
          if (!formattedErrors[field]) formattedErrors[field] = [];
          formattedErrors[field].push(err.message);
        });

        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          errors: formattedErrors,
        });
      }
      next(error);
    }
  };
};
