import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { UserRole } from '@skillbridge/shared';

export const getContracts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) throw new AppError('User not found', 404);

    const where = user.role === 'FREELANCER'
      ? { freelancer: { userId: req.user!.id } }
      : { client: { userId: req.user!.id } };

    const contracts = await prisma.contract.findMany({
      where,
      include: {
        project: { select: { id: true, title: true, budgetMin: true, budgetMax: true } },
        freelancer: { select: { id: true, title: true, user: { select: { name: true, avatar: true } } } },
        client: { select: { id: true, companyName: true, user: { select: { name: true } } } },
        milestones: { orderBy: { dueDate: 'asc' } },
        escrowAccount: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: contracts });
  } catch (error) {
    next(error);
  }
};

export const getContractById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const contract = await prisma.contract.findUnique({
      where: { id: req.params.id },
      include: {
        project: { include: { category: true, projectSkills: { include: { skill: true } } } },
        freelancer: { select: { id: true, title: true, hourlyRate: true, user: { select: { name: true, avatar: true } } } },
        client: { select: { id: true, companyName: true, user: { select: { name: true } } } },
        milestones: { orderBy: { dueDate: 'asc' } },
        escrowAccount: true,
      },
    });
    if (!contract) throw new AppError('Contract not found', 404);

    res.json({ success: true, data: contract });
  } catch (error) {
    next(error);
  }
};

export const addMilestone = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description, amount, dueDate } = req.body;
    const contract = await prisma.contract.findFirst({
      where: { id: req.params.id, client: { userId: req.user!.id } },
    });
    if (!contract) throw new AppError('Contract not found or unauthorized', 404);

    const milestone = await prisma.milestone.create({
      data: {
        contractId: contract.id,
        title,
        description,
        amount: parseFloat(amount),
        dueDate: new Date(dueDate),
      },
    });

    res.status(201).json({ success: true, data: milestone });
  } catch (error) {
    next(error);
  }
};

export const completeMilestone = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const milestone = await prisma.milestone.findFirst({
      where: { id: req.params.milestoneId, contract: { freelancer: { userId: req.user!.id } } },
    });
    if (!milestone || milestone.status !== 'PENDING') throw new AppError('Milestone not found or already completed', 404);

    await prisma.milestone.update({
      where: { id: req.params.milestoneId },
      data: { status: 'IN_REVIEW', completedAt: new Date() },
    });

    res.json({ success: true, message: 'Milestone submitted for review' });
  } catch (error) {
    next(error);
  }
};

export const approveMilestone = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const milestone = await prisma.milestone.findFirst({
      where: { id: req.params.milestoneId, contract: { client: { userId: req.user!.id } } },
    });
    if (!milestone || milestone.status !== 'IN_REVIEW') throw new AppError('Milestone not found or not in review', 404);

    await prisma.milestone.update({
      where: { id: req.params.milestoneId },
      data: { status: 'APPROVED' },
    });

    res.json({ success: true, message: 'Milestone approved' });
  } catch (error) {
    next(error);
  }
};

export const completeContract = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const contract = await prisma.contract.findFirst({
      where: { id: req.params.id, client: { userId: req.user!.id } },
      include: { milestones: true, escrowAccount: true },
    });
    if (!contract) throw new AppError('Contract not found or unauthorized', 404);

    const allApproved = contract.milestones.every((m) => m.status === 'APPROVED');
    if (contract.milestones.length > 0 && !allApproved) {
      throw new AppError('All milestones must be approved before completing the contract', 400);
    }

    await prisma.contract.update({
      where: { id: req.params.id },
      data: { status: 'COMPLETED', endDate: new Date() },
    });

    await prisma.project.update({
      where: { id: contract.projectId },
      data: { status: 'COMPLETED' },
    });

    res.json({ success: true, message: 'Contract completed' });
  } catch (error) {
    next(error);
  }
};

export const cancelContract = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const isClient = await prisma.contract.findFirst({
      where: { id: req.params.id, client: { userId: req.user!.id } },
    });

    const isFreelancer = await prisma.contract.findFirst({
      where: { id: req.params.id, freelancer: { userId: req.user!.id } },
    });

    if (!isClient && !isFreelancer) throw new AppError('Contract not found or unauthorized', 404);

    await prisma.contract.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' },
    });

    res.json({ success: true, message: 'Contract cancelled' });
  } catch (error) {
    next(error);
  }
};
