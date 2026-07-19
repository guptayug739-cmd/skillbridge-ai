import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';
import { authLimiter, otpLimiter, passwordResetLimiter } from '../middleware/rateLimiter';
import { checkAccountLockout } from '../middleware/accountLockout';
import * as authController from '../controllers/auth.controller';

const router = Router();

router.post(
  '/register',
  authLimiter,
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('role').isIn(['FREELANCER', 'CLIENT']).withMessage('Role must be FREELANCER or CLIENT'),
  ],
  validate,
  authController.register
);

router.post(
  '/login',
  authLimiter,
  checkAccountLockout,
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  authController.login
);

router.post(
  '/refresh',
  [body('refreshToken').notEmpty().withMessage('Refresh token required')],
  validate,
  authController.refreshToken
);

router.post('/logout', authenticate, authController.logout);
router.post('/logout-all', authenticate, authController.logoutAllDevices);

router.get('/sessions', authenticate, authController.getSessions);
router.delete('/sessions/:sessionId', authenticate, authController.revokeSpecificSession);
router.get('/login-history', authenticate, authController.getLoginHistory);

router.get('/verify-email/:token', authController.verifyEmail);

router.post(
  '/forgot-password',
  passwordResetLimiter,
  [body('email').isEmail().withMessage('Valid email required')],
  validate,
  authController.forgotPassword
);

router.post(
  '/reset-password/:token',
  [body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')],
  validate,
  authController.resetPassword
);

router.get('/me', authenticate, authController.getMe);

router.put(
  '/profile',
  authenticate,
  [
    body('name').optional().trim().notEmpty(),
    body('avatar').optional().isURL(),
  ],
  validate,
  authController.updateProfile
);

router.post(
  '/change-password',
  authenticate,
  [
    body('currentPassword').notEmpty().withMessage('Current password required'),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
  ],
  validate,
  authController.changePassword
);

router.post('/send-email-otp',
  otpLimiter,
  [body('email').isEmail().withMessage('Valid email required')],
  validate,
  authController.sendEmailOtp
);

router.post('/verify-email-otp',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('Valid OTP required'),
  ],
  validate,
  authController.verifyEmailOtp
);

router.post('/send-mobile-otp',
  otpLimiter,
  [body('phone').notEmpty().withMessage('Phone number required')],
  validate,
  authController.sendMobileOtp
);

router.post('/verify-mobile-otp',
  [
    body('phone').notEmpty().withMessage('Phone number required'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('Valid OTP required'),
  ],
  validate,
  authController.verifyMobileOtp
);

router.post('/google', authLimiter, authController.googleLogin);

export default router;
