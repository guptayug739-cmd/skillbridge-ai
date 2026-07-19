import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';
import * as paymentController from '../controllers/payment.controller';

const router = Router();

router.post(
  '/create-order',
  authenticate,
  [
    body('contractId').notEmpty().withMessage('Contract ID is required'),
  ],
  validate,
  paymentController.createPaymentOrder
);

router.post('/verify', authenticate, paymentController.verifyPayment);
router.post('/razorpay-webhook', paymentController.handleRazorpayWebhook);
router.post(
  '/release/:contractId',
  authenticate,
  paymentController.releasePayment
);

router.get('/wallet', authenticate, paymentController.getWallet);
router.get('/transactions', authenticate, paymentController.getTransactions);
router.post(
  '/withdraw',
  authenticate,
  [
    body('amount').isFloat({ min: 500 }).withMessage('Minimum withdrawal is ₹500'),
    body('accountNumber').notEmpty().withMessage('Account number required'),
    body('ifscCode').notEmpty().withMessage('IFSC code required'),
    body('accountHolder').notEmpty().withMessage('Account holder name required'),
    body('bankName').notEmpty().withMessage('Bank name required'),
  ],
  validate,
  paymentController.requestWithdrawal
);

export default router;
