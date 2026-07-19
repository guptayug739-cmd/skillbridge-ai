import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';

export const saveFreelancer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { freelancerId } = req.params;
    const freelancer = await prisma.freelancer.findUnique({ where: { id: freelancerId } });
    if (!freelancer) throw new AppError('Freelancer not found', 404);

    const existing = await prisma.savedFreelancer.findUnique({
      where: { userId_freelancerId: { userId: req.user!.id, freelancerId } },
    });
    if (existing) throw new AppError('Already saved', 400);

    await prisma.savedFreelancer.create({ data: { userId: req.user!.id, freelancerId } });
    res.json({ success: true, message: 'Freelancer saved' });
  } catch (error) { next(error); }
};

export const unsaveFreelancer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.savedFreelancer.deleteMany({
      where: { userId: req.user!.id, freelancerId: req.params.freelancerId },
    });
    res.json({ success: true, message: 'Freelancer unsaved' });
  } catch (error) { next(error); }
};

export const getSavedFreelancers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const saved = await prisma.savedFreelancer.findMany({
      where: { userId: req.user!.id },
      include: {
        freelancer: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
            userSkills: { include: { skill: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: saved });
  } catch (error) { next(error); }
};

export const getSavedProjects = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const saved = await prisma.savedProject.findMany({
      where: { userId: req.user!.id },
      include: {
        project: {
          include: {
            category: true,
            projectSkills: { include: { skill: true } },
            client: { select: { companyName: true, user: { select: { name: true } } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: saved });
  } catch (error) { next(error); }
};
