import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { config } from '../config';
import { AppError } from '../middleware/errorHandler';
import { uploadToCloudinary } from '../utils/cloudinaryUpload';
import { logger } from '../utils/logger';

const getAIResponse = async (prompt: string): Promise<string> => {
  if (config.ai.provider === 'gemini' && config.ai.geminiKey) {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(config.ai.geminiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(prompt);
    return result.response.text();
  }

  if (config.ai.openaiKey) {
    const OpenAI = require('openai');
    const openai = new OpenAI({ apiKey: config.ai.openaiKey });
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000,
    });
    return response.choices[0]?.message?.content || '';
  }

  if (config.ai.geminiKey) {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(config.ai.geminiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(prompt);
    return result.response.text();
  }

  throw new AppError('No AI provider configured. Set OPENAI_API_KEY or GEMINI_API_KEY.', 500);
};

const parseJSON = (text: string): any => {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/) || text.match(/\[[\s\S]*\]/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return { text };
  } catch {
    return { text };
  }
};

export const analyzeResume = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) throw new AppError('Resume file is required', 400);

    const result = await uploadToCloudinary(req.file.buffer, 'skillbridge/ai-analysis');

    const freelancer = await prisma.freelancer.findUnique({ where: { userId: req.user!.id } });
    if (!freelancer) throw new AppError('Freelancer profile not found', 404);

    const prompt = `Analyze this freelancer resume. Extract: skills, experience level (BEGINNER/INTERMEDIATE/EXPERT), years of experience, key strengths, and recommendations for improvement. Provide a score from 0-100.

Return as JSON: { "skills": string[], "experienceLevel": string, "experienceYears": number, "keyStrengths": string[], "recommendations": string[], "overallScore": number }`;

    let analysisData: any = {
      skills: [],
      experienceLevel: 'INTERMEDIATE',
      experienceYears: 0,
      keyStrengths: [],
      recommendations: ['Update your resume with more detail'],
      overallScore: 70,
    };

    try {
      const aiResponse = await getAIResponse(prompt);
      analysisData = parseJSON(aiResponse);
    } catch (aiError) {
      logger.error('AI analysis failed, using defaults:', aiError);
    }

    await prisma.aIAnalysis.create({
      data: {
        freelancerId: freelancer.id,
        type: 'RESUME_ANALYSIS',
        score: analysisData.overallScore,
        summary: analysisData.keyStrengths?.join(', ') || '',
        details: analysisData,
      },
    });

    await prisma.freelancer.update({
      where: { id: freelancer.id },
      data: { aiScore: analysisData.overallScore },
    });

    res.json({ success: true, data: analysisData });
  } catch (error) {
    next(error);
  }
};

export const recommendFreelancers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectId } = req.params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { projectSkills: { include: { skill: true } } },
    });
    if (!project) throw new AppError('Project not found', 404);

    const freelancers = await prisma.freelancer.findMany({
      where: { available: true },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        userSkills: { include: { skill: true } },
        _count: { select: { reviews: true } },
      },
      take: 20,
    });

    const projectSkills = project.projectSkills.map((ps) => ps.skill.name.toLowerCase());

    const scored = freelancers.map((f) => {
      const freelancerSkills = f.userSkills.map((us) => us.skill.name.toLowerCase());
      const matchedSkills = projectSkills.filter((s) => freelancerSkills.includes(s));
      const skillMatch = projectSkills.length > 0 ? matchedSkills.length / projectSkills.length : 0;
      const ratingScore = f.rating ? f.rating / 5 : 0;

      const score = Math.round((skillMatch * 0.5 + ratingScore * 0.3 + (f.aiScore ? f.aiScore / 100 * 0.2 : 0)) * 100);

      return {
        freelancerId: f.id,
        score,
        matchReason: `Matched ${matchedSkills.length}/${projectSkills.length} skills`,
        skillMatch,
        experienceMatch: 0.5,
        ratingScore,
        freelancer: {
          id: f.id,
          name: f.user.name,
          avatar: f.user.avatar,
          title: f.title,
          hourlyRate: f.hourlyRate,
          rating: f.rating,
          aiScore: f.aiScore,
          skills: f.userSkills.map((us) => us.skill.name),
        },
      };
    });

    const sorted = scored.sort((a, b) => b.score - a.score).slice(0, 10);

    await Promise.all(
      sorted.map((rec) =>
        prisma.aIRecommendation.upsert({
          where: { id: `${project.id}_${rec.freelancerId}` },
          update: { score: rec.score, matchReason: rec.matchReason, skillMatch: rec.skillMatch, experienceMatch: rec.experienceMatch, ratingScore: rec.ratingScore },
          create: { projectId, freelancerId: rec.freelancerId, score: rec.score, matchReason: rec.matchReason, skillMatch: rec.skillMatch, experienceMatch: rec.experienceMatch, ratingScore: rec.ratingScore },
        }).catch(() => {})
      )
    );

    res.json({ success: true, data: sorted });
  } catch (error) {
    next(error);
  }
};

export const generateProposal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectId, bidAmount, deliveryTime } = req.body;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { projectSkills: { include: { skill: true } } },
    });
    if (!project) throw new AppError('Project not found', 404);

    const freelancer = await prisma.freelancer.findUnique({
      where: { userId: req.user!.id },
      include: { userSkills: { include: { skill: true } } },
    });
    if (!freelancer) throw new AppError('Freelancer profile not found', 404);

    const prompt = `Generate a professional cover letter for this freelance project proposal.

Project: "${project.title}"
Description: "${project.description.substring(0, 500)}"
Skills needed: ${project.projectSkills.map((s) => s.skill.name).join(', ')}

Freelancer: ${req.user!.name}
Freelancer skills: ${freelancer.userSkills.map((s) => s.skill.name).join(', ')}

Write a compelling cover letter (2-3 paragraphs) that:
1. Shows understanding of the project
2. Highlights relevant skills and experience
3. Explains approach to the work
4. Includes bid: ₹${bidAmount}, delivery: ${deliveryTime} days`;

    let coverLetter = `I am excited to apply for your project "${project.title}". With my expertise in ${freelancer.userSkills.map((s) => s.skill.name).slice(0, 3).join(', ')}, I am confident I can deliver exceptional results.

I understand you're looking for someone who can handle ${project.title.toLowerCase()}. My approach would be to first understand the requirements thoroughly, then deliver high-quality work within the agreed timeline.

I can complete this project in ${deliveryTime} days within a budget of ₹${bidAmount}. I look forward to discussing this further.

Best regards,
${req.user!.name}`;

    try {
      const aiResponse = await getAIResponse(prompt);
      coverLetter = aiResponse;
    } catch (aiError) {
      logger.error('AI proposal generation failed, using template:', aiError);
    }

    res.json({ success: true, data: { coverLetter, projectId, bidAmount, deliveryTime } });
  } catch (error) {
    next(error);
  }
};

export const scorePortfolio = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const freelancer = await prisma.freelancer.findUnique({
      where: { userId: req.user!.id },
      include: { portfolios: true },
    });
    if (!freelancer) throw new AppError('Freelancer profile not found', 404);

    const portfolioCount = freelancer.portfolios.length;
    const hasImages = freelancer.portfolios.filter((p) => p.imageUrl).length;

    const score = Math.min(100, Math.round((portfolioCount * 15 + (hasImages / Math.max(1, portfolioCount)) * 20) * (freelancer.rating ? freelancer.rating / 5 : 0.5)));

    await prisma.aIAnalysis.create({
      data: {
        freelancerId: freelancer.id,
        type: 'PORTFOLIO_SCORE',
        score,
        summary: `Portfolio contains ${portfolioCount} items`,
        details: { portfolioCount, hasImages, score },
      },
    });

    res.json({ success: true, data: { score, portfolioCount, recommendations: portfolioCount < 3 ? ['Add more portfolio items to improve your score'] : [] } });
  } catch (error) {
    next(error);
  }
};

export const detectScam = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectId, userId } = req.body;

    const project = projectId ? await prisma.project.findUnique({ where: { id: projectId } }) : null;
    const user = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null;

    let riskScore = 0;
    const flags: string[] = [];

    if (project) {
      if (project.budgetMax > 100000 && !project.description) { riskScore += 20; flags.push('High budget without description'); }
      if (project.clientId) {
        const client = await prisma.client.findUnique({ where: { id: project.clientId } });
        if (client && client.verificationStatus !== 'VERIFIED') { riskScore += 15; flags.push('Unverified client'); }
      }
    }

    if (user) {
      if (!user.isVerified) { riskScore += 15; flags.push('Unverified user'); }
      if (user.createdAt > new Date(Date.now() - 24 * 60 * 60 * 1000)) { riskScore += 10; flags.push('Account created less than 24 hours ago'); }
    }

    const isScam = riskScore >= 30;

    res.json({
      success: true,
      data: { isScam, riskScore, flags, recommendation: isScam ? 'Flag for review' : 'Appears legitimate' },
    });
  } catch (error) {
    next(error);
  }
};
