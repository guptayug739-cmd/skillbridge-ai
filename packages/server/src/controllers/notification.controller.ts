import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';

export const getNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const unreadOnly = req.query.unread === 'true';

    const where: any = { userId: req.user!.id };
    if (unreadOnly) where.read = false;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId: req.user!.id, read: false } }),
    ]);

    res.json({
      success: true, data: notifications, unreadCount,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) { next(error); }
};

export const markAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notification = await prisma.notification.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
    });
    if (!notification) throw new AppError('Notification not found', 404);

    await prisma.notification.update({ where: { id: req.params.id }, data: { read: true } });
    res.json({ success: true, message: 'Marked as read' });
  } catch (error) { next(error); }
};

export const markAllAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.notification.updateMany({ where: { userId: req.user!.id, read: false }, data: { read: true } });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) { next(error); }
};

export const deleteNotification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notification = await prisma.notification.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
    });
    if (!notification) throw new AppError('Notification not found', 404);

    await prisma.notification.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) { next(error); }
};

export const getUnreadCount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const count = await prisma.notification.count({ where: { userId: req.user!.id, read: false } });
    res.json({ success: true, data: { count } });
  } catch (error) { next(error); }
};
