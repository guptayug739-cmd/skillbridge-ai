import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export const inviteFreelancer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectId, freelancerId, message } = req.body;

    const client = await prisma.client.findUnique({ where: { userId: req.user!.id } });
    if (!client) throw new AppError('Client profile not found', 404);

    const project = await prisma.project.findFirst({ where: { id: projectId, clientId: client.id } });
    if (!project) throw new AppError('Project not found or unauthorized', 404);

    const freelancer = await prisma.freelancer.findUnique({ where: { id: freelancerId } });
    if (!freelancer) throw new AppError('Freelancer not found', 404);

    const existing = await prisma.invite.findUnique({
      where: { projectId_freelancerId: { projectId, freelancerId } },
    });
    if (existing) throw new AppError('Already invited', 400);

    const invite = await prisma.invite.create({
      data: { projectId, freelancerId, clientId: client.id, message },
      include: { project: { select: { title: true } }, freelancer: { include: { user: { select: { name: true } } } } },
    });

    await prisma.notification.create({
      data: {
        userId: freelancer.userId,
        type: 'PROPOSAL_RECEIVED',
        title: 'Project Invitation',
        message: `You've been invited to "${project.title}"${message ? ': ' + message.substring(0, 100) : ''}`,
        data: { inviteId: invite.id, projectId },
      },
    });

    res.status(201).json({ success: true, data: invite });
  } catch (error) { next(error); }
};

export const respondToInvite = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    if (!['ACCEPTED', 'DECLINED'].includes(status)) throw new AppError('Invalid status', 400);

    const freelancer = await prisma.freelancer.findUnique({ where: { userId: req.user!.id } });
    if (!freelancer) throw new AppError('Freelancer profile not found', 404);

    const invite = await prisma.invite.findFirst({
      where: { id: req.params.id, freelancerId: freelancer.id, status: 'PENDING' },
    });
    if (!invite) throw new AppError('Invite not found or already responded', 404);

    await prisma.invite.update({ where: { id: req.params.id }, data: { status } });

    res.json({ success: true, message: `Invite ${status.toLowerCase()}` });
  } catch (error) { next(error); }
};

export const getMyInvites = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const freelancer = await prisma.freelancer.findUnique({ where: { userId: req.user!.id } });

    const invites = await prisma.invite.findMany({
      where: freelancer ? { freelancerId: freelancer.id } : { clientId: req.user!.id },
      include: {
        project: { select: { id: true, title: true, status: true, budgetMin: true, budgetMax: true } },
        freelancer: { include: { user: { select: { name: true, avatar: true } } } },
        client: { include: { user: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: invites });
  } catch (error) { next(error); }
};

export const getClientInvites = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const client = await prisma.client.findUnique({ where: { userId: req.user!.id } });
    if (!client) throw new AppError('Client profile not found', 404);

    const invites = await prisma.invite.findMany({
      where: { clientId: client.id },
      include: {
        project: { select: { id: true, title: true } },
        freelancer: { include: { user: { select: { name: true, avatar: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: invites });
  } catch (error) { next(error); }
};
