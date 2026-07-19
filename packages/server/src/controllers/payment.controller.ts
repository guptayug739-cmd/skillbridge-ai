import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { config } from '../config';
import { AppError } from '../middleware/errorHandler';
import { generateOrderId } from '../utils/helpers';
import { logger } from '../utils/logger';
import crypto from 'crypto';

const Razorpay = require('razorpay');

const razorpay = config.razorpay.keyId ? new Razorpay({
  key_id: config.razorpay.keyId,
  key_secret: config.razorpay.keySecret,
}) : null;

export const createPaymentOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { contractId } = req.body;

    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: { escrowAccount: true, client: true },
    });
    if (!contract || contract.client.userId !== req.user!.id) {
      throw new AppError('Contract not found or unauthorized', 404);
    }

    const escrow = contract.escrowAccount;
    if (!escrow || escrow.status !== 'HELD') throw new AppError('Escrow not ready for funding', 400);

    if (!razorpay) throw new AppError('Payment provider not configured', 500);

    const order = await razorpay.orders.create({
      amount: Math.round(contract.budget * 100),
      currency: 'INR',
      receipt: generateOrderId(),
      notes: { contractId, escrowId: escrow.id },
    });

    await prisma.escrowAccount.update({
      where: { id: escrow.id },
      data: { razorpayOrderId: order.id, status: 'FUNDED' },
    });

    res.json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: config.razorpay.keyId,
        contractId,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const verifyPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    const body = razorpayOrderId + '|' + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac('sha256', config.razorpay.keySecret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      throw new AppError('Invalid payment signature', 400);
    }

    const escrow = await prisma.escrowAccount.findFirst({
      where: { razorpayOrderId },
      include: { contract: true },
    });
    if (!escrow) throw new AppError('Escrow account not found', 404);

    await prisma.escrowAccount.update({
      where: { id: escrow.id },
      data: { razorpayPaymentId, status: 'FUNDED', fundedAt: new Date() },
    });

    await prisma.transaction.create({
      data: {
        userId: escrow.contract.clientId,
        type: 'PAYMENT',
        amount: escrow.amount,
        fee: escrow.platformFee,
        netAmount: escrow.freelancerAmount,
        status: 'COMPLETED',
        referenceType: 'contract',
        referenceId: escrow.contractId,
        razorpayId: razorpayPaymentId,
        description: `Payment for contract ${escrow.contractId}`,
      },
    });

    res.json({ success: true, message: 'Payment verified successfully' });
  } catch (error) {
    next(error);
  }
};

export const handleRazorpayWebhook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const webhookSecret = config.razorpay.webhookSecret;
    const signature = req.headers['x-razorpay-signature'] as string;

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(400).json({ success: false, error: 'Invalid webhook signature' });
    }

    const event = req.body.event;

    if (event === 'payment.captured') {
      const payment = req.body.payload.payment.entity;
      logger.info('Payment captured:', payment.id);
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const releasePayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { contractId } = req.params;

    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: { escrowAccount: true, client: true, freelancer: true },
    });
    if (!contract || contract.client.userId !== req.user!.id) {
      throw new AppError('Contract not found or unauthorized', 404);
    }

    const escrow = contract.escrowAccount;
    if (!escrow || escrow.status !== 'FUNDED') throw new AppError('Escrow not funded', 400);

    await prisma.$transaction(async (tx) => {
      await tx.escrowAccount.update({
        where: { id: escrow.id },
        data: { status: 'RELEASED', releasedAt: new Date() },
      });

      await tx.wallet.upsert({
        where: { userId: contract.freelancerId },
        update: { balance: { increment: escrow.freelancerAmount }, totalEarned: { increment: escrow.freelancerAmount } },
        create: { userId: contract.freelancerId, balance: escrow.freelancerAmount, totalEarned: escrow.freelancerAmount },
      });

      await tx.transaction.create({
        data: {
          userId: contract.freelancerId,
          type: 'RELEASE',
          amount: escrow.amount,
          fee: escrow.platformFee,
          netAmount: escrow.freelancerAmount,
          status: 'COMPLETED',
          referenceType: 'contract',
          referenceId: contractId,
          description: `Payment released for contract ${contractId}`,
        },
      });

      await tx.freelancer.update({
        where: { id: contract.freelancerId },
        data: { totalEarnings: { increment: escrow.freelancerAmount }, completedProjects: { increment: 1 } },
      });
    });

    res.json({ success: true, message: 'Payment released to freelancer' });
  } catch (error) {
    next(error);
  }
};

export const getWallet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let wallet = await prisma.wallet.findUnique({ where: { userId: req.user!.id } });
    if (!wallet) {
      wallet = await prisma.wallet.create({ data: { userId: req.user!.id } });
    }
    res.json({ success: true, data: wallet });
  } catch (error) {
    next(error);
  }
};

export const getTransactions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId: req.user!.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.transaction.count({ where: { userId: req.user!.id } }),
    ]);

    res.json({
      success: true,
      data: transactions,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

export const requestWithdrawal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { amount, accountNumber, ifscCode, accountHolder, bankName } = req.body;

    const wallet = await prisma.wallet.findUnique({ where: { userId: req.user!.id } });
    if (!wallet || wallet.balance < amount) throw new AppError('Insufficient balance', 400);

    const fee = Math.max(25, amount * 0.02);

    await prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { userId: req.user!.id },
        data: { balance: { decrement: amount }, lockedBalance: { increment: amount } },
      });

      await tx.withdrawal.create({
        data: {
          userId: req.user!.id,
          amount,
          fee,
          netAmount: amount - fee,
          accountNumber,
          ifscCode,
          accountHolder,
          bankName,
        },
      });
    });

    res.json({ success: true, message: 'Withdrawal request submitted' });
  } catch (error) {
    next(error);
  }
};
