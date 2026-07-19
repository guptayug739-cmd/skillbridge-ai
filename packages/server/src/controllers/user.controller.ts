import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { uploadToCloudinary } from '../utils/cloudinaryUpload';

export const getFreelancerProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await prisma.freelancer.findUnique({
      where: { userId: req.user!.id },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true, createdAt: true } },
        userSkills: { include: { skill: true } },
        portfolios: true,
        resumes: true,
      },
    });
    if (!profile) throw new AppError('Freelancer profile not found', 404);
    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};

export const updateFreelancerProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      title,
      bio,
      hourlyRate,
      experienceYears,
      location,
      languages,
      socialLinks,
      addressLine,
      city,
      state,
      pincode,
      country,
      identityType,
      identityNumber,
      identityDocumentUrl,
      resumeUrl,
      dateOfBirth,
      gender,
    } = req.body;

    if (dateOfBirth !== undefined || gender !== undefined) {
      await prisma.user.update({
        where: { id: req.user!.id },
        data: {
          ...(dateOfBirth !== undefined && { dateOfBirth: new Date(dateOfBirth) }),
          ...(gender !== undefined && { gender }),
        },
      });
    }

    const profile = await prisma.freelancer.update({
      where: { userId: req.user!.id },
      data: {
        ...(title !== undefined && { title }),
        ...(bio !== undefined && { bio }),
        ...(hourlyRate !== undefined && { hourlyRate }),
        ...(experienceYears !== undefined && { experienceYears }),
        ...(location !== undefined && { location }),
        ...(languages !== undefined && { languages }),
        ...(socialLinks !== undefined && { socialLinks }),
        ...(addressLine !== undefined && { addressLine }),
        ...(city !== undefined && { city }),
        ...(state !== undefined && { state }),
        ...(pincode !== undefined && { pincode }),
        ...(country !== undefined && { country }),
        ...(identityType !== undefined && { identityType }),
        ...(identityNumber !== undefined && { identityNumber }),
        ...(identityDocumentUrl !== undefined && { identityDocumentUrl }),
        ...(resumeUrl !== undefined && { resumeUrl }),
      },
    });
    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};

export const addEducation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { degree, institution, fieldOfStudy, startYear, endYear, grade } = req.body;
    const freelancer = await prisma.freelancer.findUnique({ where: { userId: req.user!.id } });
    if (!freelancer) throw new AppError('Freelancer profile not found', 404);

    const education = await prisma.education.create({
      data: {
        freelancerId: freelancer.id,
        degree,
        institution,
        fieldOfStudy,
        startYear,
        endYear,
        grade,
      },
    });
    res.status(201).json({ success: true, data: education });
  } catch (error) {
    next(error);
  }
};

export const updateEducation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { degree, institution, fieldOfStudy, startYear, endYear, grade } = req.body;
    const edu = await prisma.education.findFirst({
      where: { id, freelancer: { userId: req.user!.id } },
    });
    if (!edu) throw new AppError('Education record not found', 404);

    const updated = await prisma.education.update({
      where: { id },
      data: { degree, institution, fieldOfStudy, startYear, endYear, grade },
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteEducation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const edu = await prisma.education.findFirst({
      where: { id: req.params.id, freelancer: { userId: req.user!.id } },
    });
    if (!edu) throw new AppError('Education record not found', 404);
    await prisma.education.delete({ where: { id: edu.id } });
    res.json({ success: true, message: 'Education deleted' });
  } catch (error) {
    next(error);
  }
};

export const uploadResume = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) throw new AppError('Resume file is required', 400);

    const result = await uploadToCloudinary(req.file.buffer, 'skillbridge/resumes');
    const freelancer = await prisma.freelancer.findUnique({ where: { userId: req.user!.id } });
    if (!freelancer) throw new AppError('Freelancer profile not found', 404);

    const resume = await prisma.resume.create({
      data: {
        freelancerId: freelancer.id,
        fileUrl: result.url,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        isPrimary: false,
      },
    });

    res.status(201).json({ success: true, data: resume });
  } catch (error) {
    next(error);
  }
};

export const deleteResume = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const resume = await prisma.resume.findFirst({
      where: { id: req.params.id, freelancer: { userId: req.user!.id } },
    });
    if (!resume) throw new AppError('Resume not found', 404);

    await prisma.resume.delete({ where: { id: resume.id } });
    res.json({ success: true, message: 'Resume deleted' });
  } catch (error) {
    next(error);
  }
};

export const addPortfolioItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description, projectUrl, tags } = req.body;
    const freelancer = await prisma.freelancer.findUnique({ where: { userId: req.user!.id } });
    if (!freelancer) throw new AppError('Freelancer profile not found', 404);

    const files = req.files as Express.Multer.File[];
    const uploadedImages = await Promise.all(
      files.map((f) => uploadToCloudinary(f.buffer, 'skillbridge/portfolio')),
    );

    const portfolio = await prisma.portfolio.create({
      data: {
        freelancerId: freelancer.id,
        title,
        description,
        imageUrl: uploadedImages[0]?.url || '',
        projectUrl,
        tags: tags || [],
      },
    });

    res.status(201).json({ success: true, data: portfolio });
  } catch (error) {
    next(error);
  }
};

export const deletePortfolioItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = await prisma.portfolio.findFirst({
      where: { id: req.params.id, freelancer: { userId: req.user!.id } },
    });
    if (!item) throw new AppError('Portfolio item not found', 404);
    await prisma.portfolio.delete({ where: { id: item.id } });
    res.json({ success: true, message: 'Portfolio item deleted' });
  } catch (error) {
    next(error);
  }
};

export const updateSkills = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { skills } = req.body;
    const freelancer = await prisma.freelancer.findUnique({ where: { userId: req.user!.id } });
    if (!freelancer) throw new AppError('Freelancer profile not found', 404);

    await prisma.userSkill.deleteMany({ where: { freelancerId: freelancer.id } });

    const skillRecords = await Promise.all(
      skills.map(async (s: { id: string; proficiency?: string }) => {
        const skill = await prisma.skill.findUnique({ where: { id: s.id } });
        if (!skill) throw new AppError(`Skill ${s.id} not found`, 404);
        return prisma.userSkill.create({
          data: { freelancerId: freelancer.id, skillId: s.id, proficiency: s.proficiency },
        });
      }),
    );

    res.json({ success: true, data: skillRecords });
  } catch (error) {
    next(error);
  }
};

export const getPublicFreelancerProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const freelancer = await prisma.freelancer.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true, createdAt: true } },
        userSkills: { include: { skill: true } },
        portfolios: true,
        reviews: { include: { reviewer: { select: { name: true, avatar: true } } } },
      },
    });
    if (!freelancer) throw new AppError('Freelancer not found', 404);
    res.json({ success: true, data: freelancer });
  } catch (error) {
    next(error);
  }
};

export const updateClientProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { companyName, companyWebsite, companySize, industry, companyDescription } = req.body;
    const client = await prisma.client.update({
      where: { userId: req.user!.id },
      data: {
        ...(companyName !== undefined && { companyName }),
        ...(companyWebsite !== undefined && { companyWebsite }),
        ...(companySize !== undefined && { companySize }),
        ...(industry !== undefined && { industry }),
        ...(companyDescription !== undefined && { companyDescription }),
      },
    });
    res.json({ success: true, data: client });
  } catch (error) {
    next(error);
  }
};

export const submitVerificationDocuments = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) throw new AppError('At least one document is required', 400);

    const uploadedDocs = await Promise.all(
      files.map((f) => uploadToCloudinary(f.buffer, 'skillbridge/verification')),
    );

    const client = await prisma.client.update({
      where: { userId: req.user!.id },
      data: {
        verificationDocuments: uploadedDocs.map((d) => d.url),
        verificationStatus: 'PENDING',
      },
    });

    res.json({ success: true, data: client });
  } catch (error) {
    next(error);
  }
};

export const getSkills = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const skills = await prisma.skill.findMany({ orderBy: { name: 'asc' } });
    res.json({ success: true, data: skills });
  } catch (error) {
    next(error);
  }
};

export const getTopFreelancers = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const freelancers = await prisma.freelancer.findMany({
      where: { available: true },
      orderBy: { rating: 'desc' },
      take: 10,
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
        userSkills: { include: { skill: true } },
      },
    });
    res.json({ success: true, data: freelancers });
  } catch (error) {
    next(error);
  }
};
