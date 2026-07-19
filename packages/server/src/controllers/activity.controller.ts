import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

export const getActivityFeed = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const activities: any[] = [];

    if (user.role === 'FREELANCER') {
      const freelancer = await prisma.freelancer.findUnique({ where: { userId: user.id } });
      if (freelancer) {
        const [proposals, contracts, notifications] = await Promise.all([
          prisma.proposal.findMany({
            where: { freelancerId: freelancer.id },
            include: { project: { select: { id: true, title: true } } },
            orderBy: { createdAt: 'desc' }, take: 10,
          }),
          prisma.contract.findMany({
            where: { freelancerId: freelancer.id },
            include: { project: { select: { id: true, title: true } }, milestones: true },
            orderBy: { createdAt: 'desc' }, take: 10,
          }),
          prisma.notification.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' }, take: 10,
          }),
        ]);

        proposals.forEach((p) => activities.push({
          type: 'PROPOSAL', action: `Proposal ${p.status.toLowerCase()} for`, target: p.project?.title,
          timestamp: p.createdAt, status: p.status, projectId: p.project?.id,
        }));
        contracts.forEach((c) => activities.push({
          type: 'CONTRACT', action: `Contract ${c.status.toLowerCase().replace('_', ' ')} for`, target: c.project?.title,
          timestamp: c.createdAt, status: c.status, contractId: c.id,
        }));
        notifications.slice(0, 5).forEach((n) => activities.push({
          type: 'NOTIFICATION', action: n.title, target: n.message,
          timestamp: n.createdAt, status: n.read ? 'READ' : 'UNREAD',
        }));
      }
    } else {
      const [projects, contracts, notifications] = await Promise.all([
        prisma.project.findMany({
          where: { client: { userId: user.id } },
          orderBy: { createdAt: 'desc' }, take: 10,
        }),
        prisma.contract.findMany({
          where: { client: { userId: user.id } },
          include: { project: { select: { id: true, title: true } } },
          orderBy: { createdAt: 'desc' }, take: 10,
        }),
        prisma.notification.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' }, take: 10,
        }),
      ]);

      projects.forEach((p) => activities.push({
        type: 'PROJECT', action: `Project ${p.status.toLowerCase().replace('_', ' ')}`, target: p.title,
        timestamp: p.createdAt, status: p.status, projectId: p.id,
      }));
      contracts.forEach((c) => activities.push({
        type: 'CONTRACT', action: `Contract ${c.status.toLowerCase().replace('_', ' ')} for`, target: c.project?.title,
        timestamp: c.createdAt, status: c.status, contractId: c.id,
      }));
      notifications.slice(0, 5).forEach((n) => activities.push({
        type: 'NOTIFICATION', action: n.title, target: n.message,
        timestamp: n.createdAt, status: n.read ? 'READ' : 'UNREAD',
      }));
    }

    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const paginated = activities.slice(skip, skip + limit);

    res.json({
      success: true, data: paginated,
      pagination: { page, limit, total: activities.length, totalPages: Math.ceil(activities.length / limit) },
    });
  } catch (error) { next(error); }
};
