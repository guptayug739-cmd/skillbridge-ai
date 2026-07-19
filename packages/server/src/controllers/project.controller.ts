import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { uploadToCloudinary } from '../utils/cloudinaryUpload';

export const getProjects = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const where: any = { status: 'OPEN' };

    if (req.query.category) where.categoryId = req.query.category;
    if (req.query.skill) {
      where.projectSkills = { some: { skill: { name: { contains: req.query.skill as string, mode: 'insensitive' } } } };
    }
    if (req.query.search) {
      where.OR = [
        { title: { contains: req.query.search as string, mode: 'insensitive' } },
        { description: { contains: req.query.search as string, mode: 'insensitive' } },
      ];
    }
    if (req.query.budgetMin) where.budgetMax = { gte: parseFloat(req.query.budgetMin as string) };
    if (req.query.budgetMax) where.budgetMin = { lte: parseFloat(req.query.budgetMax as string) };
    if (req.query.experienceLevel) where.experienceLevel = req.query.experienceLevel;
    if (req.query.duration) where.duration = req.query.duration;

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: req.query.sort === 'budget' ? { budgetMax: 'desc' } : { createdAt: 'desc' },
        include: {
          client: { select: { id: true, companyName: true, user: { select: { name: true, avatar: true } } } },
          category: true,
          projectSkills: { include: { skill: true } },
          _count: { select: { proposals: true } },
        },
      }),
      prisma.project.count({ where }),
    ]);

    res.json({
      success: true,
      data: projects,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

export const getProjectById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        client: { select: { id: true, companyName: true, companyDescription: true, user: { select: { name: true, avatar: true } } } },
        category: true,
        projectSkills: { include: { skill: true } },
        proposals: {
          include: {
            freelancer: {
              select: { id: true, title: true, hourlyRate: true, rating: true, aiScore: true, user: { select: { name: true, avatar: true } } },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!project) throw new AppError('Project not found', 404);

    res.json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};

export const createProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const client = await prisma.client.findUnique({ where: { userId: req.user!.id } });
    if (!client) throw new AppError('Client profile not found', 404);

    const { title, description, categoryId, budgetMin, budgetMax, budgetType, experienceLevel, duration, deadline, skills } = req.body;

    const files = req.files as Express.Multer.File[];
    let attachments: string[] = [];
    if (files?.length) {
      const uploaded = await Promise.all(files.map((f) => uploadToCloudinary(f.buffer, 'skillbridge/projects')));
      attachments = uploaded.map((u) => u.url);
    }

    const project = await prisma.project.create({
      data: {
        clientId: client.id,
        title,
        description,
        categoryId,
        budgetMin: parseFloat(budgetMin),
        budgetMax: parseFloat(budgetMax),
        budgetType: budgetType || 'FIXED',
        experienceLevel: experienceLevel || 'INTERMEDIATE',
        duration,
        deadline: new Date(deadline),
        attachments,
        projectSkills: skills
          ? { create: skills.map((skillId: string) => ({ skillId })) }
          : undefined,
      },
      include: { category: true, projectSkills: { include: { skill: true } } },
    });

    await prisma.client.update({
      where: { id: client.id },
      data: { totalProjectsPosted: { increment: 1 } },
    });

    res.status(201).json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const project = await prisma.project.findFirst({
      where: { id: req.params.id, client: { userId: req.user!.id } },
    });
    if (!project) throw new AppError('Project not found or unauthorized', 404);

    const { title, description, categoryId, budgetMin, budgetMax, budgetType, experienceLevel, duration, deadline, status } = req.body;

    const updated = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(categoryId !== undefined && { categoryId }),
        ...(budgetMin !== undefined && { budgetMin: parseFloat(budgetMin) }),
        ...(budgetMax !== undefined && { budgetMax: parseFloat(budgetMax) }),
        ...(budgetType !== undefined && { budgetType }),
        ...(experienceLevel !== undefined && { experienceLevel }),
        ...(duration !== undefined && { duration }),
        ...(deadline !== undefined && { deadline: new Date(deadline) }),
        ...(status !== undefined && { status }),
        updatedBy: req.user!.id,
      },
      include: { category: true, projectSkills: { include: { skill: true } } },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const project = await prisma.project.findFirst({
      where: { id: req.params.id, client: { userId: req.user!.id } },
    });
    if (!project) throw new AppError('Project not found or unauthorized', 404);

    await prisma.project.update({ where: { id: req.params.id }, data: { status: 'CANCELLED' } });
    res.json({ success: true, message: 'Project cancelled' });
  } catch (error) {
    next(error);
  }
};

export const saveProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.savedProject.findUnique({
      where: { userId_projectId: { userId: req.user!.id, projectId: req.params.id } },
    });
    if (existing) throw new AppError('Project already saved', 400);

    await prisma.savedProject.create({
      data: { userId: req.user!.id, projectId: req.params.id },
    });
    res.json({ success: true, message: 'Project saved' });
  } catch (error) {
    next(error);
  }
};

export const unsaveProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.savedProject.deleteMany({
      where: { userId: req.user!.id, projectId: req.params.id },
    });
    res.json({ success: true, message: 'Project unsaved' });
  } catch (error) {
    next(error);
  }
};
