import { z } from 'zod';

export const createPaymentOrderSchema = z.object({
  contractId: z.string().min(1, 'Contract ID is required'),
});

export const verifyPaymentSchema = z.object({
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

export const requestWithdrawalSchema = z.object({
  amount: z.number().positive().min(500, 'Minimum withdrawal is ₹500'),
  accountNumber: z.string().min(8, 'Invalid account number'),
  ifscCode: z.string().length(11, 'IFSC code must be 11 characters'),
  accountHolder: z.string().min(2, 'Account holder name is required'),
  bankName: z.string().min(2, 'Bank name is required'),
});
