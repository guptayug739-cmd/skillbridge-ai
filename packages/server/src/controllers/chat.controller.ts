import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { uploadToCloudinary } from '../utils/cloudinaryUpload';

export const getChatContracts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) throw new AppError('User not found', 404);

    const contracts = await prisma.contract.findMany({
      where: user.role === 'FREELANCER'
        ? { freelancer: { userId: req.user!.id }, status: { in: ['ACTIVE', 'COMPLETED', 'DISPUTED'] } }
        : { client: { userId: req.user!.id }, status: { in: ['ACTIVE', 'COMPLETED', 'DISPUTED'] } },
      include: {
        project: { select: { id: true, title: true } },
        freelancer: { select: { id: true, user: { select: { id: true, name: true, avatar: true } } } },
        client: { select: { id: true, user: { select: { id: true, name: true, avatar: true } } } },
        _count: { select: { messages: true } },
      },
    });

    const contractsWithUnread = await Promise.all(
      contracts.map(async (contract) => {
        const unreadCount = await prisma.message.count({
          where: { contractId: contract.id, senderId: { not: req.user!.id }, readAt: null },
        });
        return { ...contract, unreadCount };
      })
    );

    res.json({ success: true, data: contractsWithUnread });
  } catch (error) {
    next(error);
  }
};

export const getMessages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { contractId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const contract = await prisma.contract.findFirst({
      where: {
        id: contractId,
        OR: [
          { freelancer: { userId: req.user!.id } },
          { client: { userId: req.user!.id } },
        ],
      },
    });
    if (!contract) throw new AppError('Contract not found or unauthorized', 404);

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { contractId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { sender: { select: { id: true, name: true, avatar: true } } },
      }),
      prisma.message.count({ where: { contractId } }),
    ]);

    res.json({
      success: true,
      data: messages.reverse(),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

export const sendMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { contractId } = req.params;
    const { content } = req.body;

    const contract = await prisma.contract.findFirst({
      where: {
        id: contractId,
        OR: [
          { freelancer: { userId: req.user!.id } },
          { client: { userId: req.user!.id } },
        ],
      },
    });
    if (!contract) throw new AppError('Contract not found or unauthorized', 404);

    let attachments: string[] = [];
    const files = req.files as Express.Multer.File[];
    if (files?.length) {
      const uploaded = await Promise.all(files.map((f) => uploadToCloudinary(f.buffer, 'skillbridge/chat')));
      attachments = uploaded.map((u) => u.url);
    }

    const message = await prisma.message.create({
      data: {
        contractId,
        senderId: req.user!.id,
        content: content || '',
        attachments,
      },
      include: { sender: { select: { id: true, name: true, avatar: true } } },
    });

    const recipientId = contract.freelancerId === req.user!.id
      ? contract.clientId
      : contract.freelancerId;

    const notification = await prisma.notification.create({
      data: {
        userId: recipientId,
        type: 'NEW_MESSAGE',
        title: 'New Message',
        message: `${req.user!.name}: ${content?.substring(0, 100)}`,
        data: { contractId, messageId: message.id },
      },
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`user:${recipientId}`).emit('new_message', message);
      io.to(`user:${recipientId}`).emit('notification', notification);
      io.to(`contract:${contractId}`).emit('message', message);
    }

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { contractId } = req.params;

    await prisma.message.updateMany({
      where: { contractId, senderId: { not: req.user!.id }, readAt: null },
      data: { readAt: new Date() },
    });

    res.json({ success: true, message: 'Messages marked as read' });
  } catch (error) {
    next(error);
  }
};
