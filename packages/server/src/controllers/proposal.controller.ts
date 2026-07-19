import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { uploadToCloudinary } from '../utils/cloudinaryUpload';
import { ProposalStatus } from '@skillbridge/shared';

export const getMyProposals = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const freelancer = await prisma.freelancer.findUnique({ where: { userId: req.user!.id } });
    if (!freelancer) throw new AppError('Freelancer profile not found', 404);

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status as string | undefined;

    const where: any = { freelancerId: freelancer.id };
    if (status) where.status = status;

    const [proposals, total] = await Promise.all([
      prisma.proposal.findMany({
        where,
        include: {
          project: {
            select: { id: true, title: true, status: true, budgetMin: true, budgetMax: true, budgetType: true, duration: true, deadline: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.proposal.count({ where }),
    ]);

    res.json({
      success: true,
      data: proposals,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

export const getProjectProposals = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const proposals = await prisma.proposal.findMany({
      where: { projectId: req.params.projectId },
      include: {
        freelancer: {
          select: { id: true, title: true, hourlyRate: true, rating: true, aiScore: true, user: { select: { name: true, avatar: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: proposals });
  } catch (error) {
    next(error);
  }
};

export const submitProposal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectId, coverLetter, bidAmount, deliveryTime } = req.body;
    const freelancer = await prisma.freelancer.findUnique({ where: { userId: req.user!.id } });
    if (!freelancer) throw new AppError('Freelancer profile not found', 404);

    const existing = await prisma.proposal.findUnique({
      where: { projectId_freelancerId: { projectId, freelancerId: freelancer.id } },
    });
    if (existing) throw new AppError('You have already submitted a proposal for this project', 400);

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.status !== 'OPEN') throw new AppError('Project not found or not accepting proposals', 404);

    const files = req.files as Express.Multer.File[];
    let attachments: string[] = [];
    if (files?.length) {
      const uploaded = await Promise.all(files.map((f) => uploadToCloudinary(f.buffer, 'skillbridge/proposals')));
      attachments = uploaded.map((u) => u.url);
    }

    const proposal = await prisma.proposal.create({
      data: {
        projectId,
        freelancerId: freelancer.id,
        coverLetter,
        bidAmount: parseFloat(bidAmount),
        deliveryTime: parseInt(deliveryTime),
        attachments,
      },
      include: {
        freelancer: { select: { id: true, title: true, user: { select: { name: true, avatar: true } } } },
      },
    });

    await prisma.project.update({ where: { id: projectId }, data: { proposalsCount: { increment: 1 } } });

    const notification = await prisma.notification.create({
      data: {
        userId: project.clientId,
        type: 'PROPOSAL_RECEIVED',
        title: 'New Proposal Received',
        message: `${req.user!.name} has submitted a proposal for ${project.title}`,
        data: { proposalId: proposal.id, projectId },
      },
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`user:${project.clientId}`).emit('notification', notification);
    }

    res.status(201).json({ success: true, data: proposal });
  } catch (error) {
    next(error);
  }
};

export const updateProposal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const proposal = await prisma.proposal.findFirst({
      where: { id: req.params.id, freelancer: { userId: req.user!.id }, status: 'PENDING' },
    });
    if (!proposal) throw new AppError('Proposal not found or cannot be updated', 404);

    const updated = await prisma.proposal.update({
      where: { id: req.params.id },
      data: req.body,
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const withdrawProposal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const proposal = await prisma.proposal.findFirst({
      where: { id: req.params.id, freelancer: { userId: req.user!.id } },
    });
    if (!proposal) throw new AppError('Proposal not found', 404);

    await prisma.proposal.update({ where: { id: req.params.id }, data: { status: 'WITHDRAWN' } });
    await prisma.project.update({ where: { id: proposal.projectId }, data: { proposalsCount: { decrement: 1 } } });

    res.json({ success: true, message: 'Proposal withdrawn' });
  } catch (error) {
    next(error);
  }
};

export const acceptProposal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const proposal = await prisma.proposal.findUnique({
      where: { id: req.params.id },
      include: { project: true },
    });
    if (!proposal || proposal.project.client.userId !== req.user!.id) {
      throw new AppError('Proposal not found or unauthorized', 404);
    }
    if (proposal.status !== 'PENDING') throw new AppError('Proposal cannot be accepted', 400);

    await prisma.$transaction(async (tx) => {
      await tx.proposal.update({ where: { id: proposal.id }, data: { status: 'ACCEPTED' } });
      await tx.proposal.updateMany({
        where: { projectId: proposal.projectId, id: { not: proposal.id }, status: 'PENDING' },
        data: { status: 'REJECTED' },
      });

      const contract = await tx.contract.create({
        data: {
          projectId: proposal.projectId,
          freelancerId: proposal.freelancerId,
          clientId: proposal.project.clientId,
          budget: proposal.bidAmount,
          platformFee: proposal.bidAmount * 0.15,
          freelancerAmount: proposal.bidAmount * 0.85,
          terms: 'Standard contract terms apply.',
          status: 'ACTIVE',
        },
      });

      await tx.escrowAccount.create({
        data: {
          contractId: contract.id,
          amount: proposal.bidAmount,
          platformFee: proposal.bidAmount * 0.15,
          freelancerAmount: proposal.bidAmount * 0.85,
          status: 'HELD',
        },
      });

      await tx.project.update({
        where: { id: proposal.projectId },
        data: { status: 'IN_PROGRESS', hiredFreelancerId: proposal.freelancerId },
      });
    });

    res.json({ success: true, message: 'Proposal accepted, contract created' });
  } catch (error) {
    next(error);
  }
};

export const rejectProposal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const proposal = await prisma.proposal.findUnique({
      where: { id: req.params.id },
      include: { project: true },
    });
    if (!proposal || proposal.project.client.userId !== req.user!.id) {
      throw new AppError('Proposal not found or unauthorized', 404);
    }

    await prisma.proposal.update({ where: { id: req.params.id }, data: { status: 'REJECTED' } });
    res.json({ success: true, message: 'Proposal rejected' });
  } catch (error) {
    next(error);
  }
};

export const shortlistProposal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const proposal = await prisma.proposal.findUnique({
      where: { id: req.params.id },
      include: { project: true },
    });
    if (!proposal || proposal.project.client.userId !== req.user!.id) {
      throw new AppError('Proposal not found or unauthorized', 404);
    }

    await prisma.proposal.update({ where: { id: req.params.id }, data: { status: 'SHORTLISTED' } });
    res.json({ success: true, message: 'Proposal shortlisted' });
  } catch (error) {
    next(error);
  }
};
