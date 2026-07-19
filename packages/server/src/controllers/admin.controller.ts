import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { DisputeStatus } from '@skillbridge/shared';

export const getDashboard = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [totalUsers, totalFreelancers, totalClients, totalProjects, totalRevenue, pendingVerifications, activeContracts, openDisputes] = await Promise.all([
      prisma.user.count(),
      prisma.freelancer.count(),
      prisma.client.count(),
      prisma.project.count(),
      prisma.transaction.aggregate({ _sum: { amount: true }, where: { status: 'COMPLETED', type: 'PAYMENT' } }),
      prisma.client.count({ where: { verificationStatus: 'PENDING' } }),
      prisma.contract.count({ where: { status: 'ACTIVE' } }),
      prisma.dispute.count({ where: { status: 'OPEN' } }),
    ]);

    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      return { month: d.toLocaleString('default', { month: 'short' }), year: d.getFullYear(), start: new Date(d.getFullYear(), d.getMonth(), 1) };
    }).reverse();

    const revenueChart = await Promise.all(
      last6Months.map(async (m) => {
        const nextMonth = new Date(m.start.getFullYear(), m.start.getMonth() + 1, 1);
        const result = await prisma.transaction.aggregate({
          _sum: { amount: true },
          where: { createdAt: { gte: m.start, lt: nextMonth }, status: 'COMPLETED', type: 'PAYMENT' },
        });
        return { month: m.month, revenue: result._sum.amount || 0 };
      })
    );

    const userGrowthChart = await Promise.all(
      last6Months.map(async (m) => {
        const nextMonth = new Date(m.start.getFullYear(), m.start.getMonth() + 1, 1);
        const count = await prisma.user.count({ where: { createdAt: { gte: m.start, lt: nextMonth } } });
        return { month: m.month, users: count };
      })
    );

    res.json({
      success: true,
      data: {
        totalUsers,
        totalFreelancers,
        totalClients,
        totalProjects,
        totalRevenue: totalRevenue._sum.amount || 0,
        pendingVerifications,
        activeContracts,
        openDisputes,
        revenueChart,
        userGrowthChart,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (req.query.role) where.role = req.query.role;
    if (req.query.search) {
      where.OR = [
        { name: { contains: req.query.search as string, mode: 'insensitive' } },
        { email: { contains: req.query.search as string, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: { id: true, name: true, email: true, role: true, isVerified: true, isActive: true, createdAt: true, lastLogin: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ success: true, data: users, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    next(error);
  }
};

export const verifyUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.user.update({ where: { id: req.params.id }, data: { isVerified: true } });
    res.json({ success: true, message: 'User verified' });
  } catch (error) {
    next(error);
  }
};

export const suspendUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) throw new AppError('User not found', 404);

    await prisma.user.update({ where: { id: req.params.id }, data: { isActive: !user.isActive } });
    res.json({ success: true, message: `User ${user.isActive ? 'suspended' : 'reactivated'}` });
  } catch (error) {
    next(error);
  }
};

export const getCompanies = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (req.query.verificationStatus) where.verificationStatus = req.query.verificationStatus;

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        include: { user: { select: { id: true, name: true, email: true, createdAt: true } } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.client.count({ where }),
    ]);

    res.json({ success: true, data: clients, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    next(error);
  }
};

export const verifyCompany = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.client.update({ where: { id: req.params.id }, data: { verificationStatus: 'VERIFIED' } });
    res.json({ success: true, message: 'Company verified' });
  } catch (error) {
    next(error);
  }
};

export const getProjects = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (req.query.status) where.status = req.query.status;

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          client: { select: { companyName: true, user: { select: { name: true } } } },
          category: true,
          _count: { select: { proposals: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.project.count({ where }),
    ]);

    res.json({ success: true, data: projects, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    next(error);
  }
};

export const updateProjectStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    await prisma.project.update({ where: { id: req.params.id }, data: { status } });
    res.json({ success: true, message: 'Project status updated' });
  } catch (error) {
    next(error);
  }
};

export const getPayments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (req.query.status) where.status = req.query.status;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: { user: { select: { id: true, name: true, email: true } } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.transaction.count({ where }),
    ]);

    res.json({ success: true, data: transactions, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    next(error);
  }
};

export const getDisputes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (req.query.status) where.status = req.query.status;

    const [disputes, total] = await Promise.all([
      prisma.dispute.findMany({
        where,
        include: {
          contract: { select: { id: true, budget: true, project: { select: { title: true } } } },
          raisedBy: { select: { id: true, name: true, email: true } },
          resolvedBy: { select: { user: { select: { name: true } } } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.dispute.count({ where }),
    ]);

    res.json({ success: true, data: disputes, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    next(error);
  }
};

export const resolveDispute = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { resolution } = req.body;
    const admin = await prisma.admin.findUnique({ where: { userId: req.user!.id } });
    if (!admin) throw new AppError('Admin profile not found', 404);

    await prisma.dispute.update({
      where: { id: req.params.id },
      data: { status: 'RESOLVED', resolvedById: admin.id, resolution, resolvedAt: new Date() },
    });

    res.json({ success: true, message: 'Dispute resolved' });
  } catch (error) {
    next(error);
  }
};

export const getRevenueReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const months = parseInt(req.query.months as string) || 12;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const transactions = await prisma.transaction.findMany({
      where: { createdAt: { gte: startDate }, status: 'COMPLETED' },
      orderBy: { createdAt: 'asc' },
    });

    const monthlyData: Record<string, { revenue: number; fees: number; transactions: number }> = {};
    transactions.forEach((t) => {
      const key = t.createdAt.toLocaleString('default', { month: 'short', year: 'numeric' });
      if (!monthlyData[key]) monthlyData[key] = { revenue: 0, fees: 0, transactions: 0 };
      monthlyData[key].revenue += t.amount;
      monthlyData[key].fees += t.fee;
      monthlyData[key].transactions += 1;
    });

    const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);
    const totalFees = transactions.reduce((sum, t) => sum + t.fee, 0);

    res.json({
      success: true,
      data: { totalRevenue, totalFees, totalTransactions: transactions.length, monthlyData, report: Object.entries(monthlyData).map(([month, data]) => ({ month, ...data })) },
    });
  } catch (error) {
    next(error);
  }
};

export const getUserReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const months = parseInt(req.query.months as string) || 12;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const users = await prisma.user.findMany({
      where: { createdAt: { gte: startDate } },
      orderBy: { createdAt: 'asc' },
      select: { id: true, role: true, createdAt: true },
    });

    const monthlyData: Record<string, { total: number; freelancers: number; clients: number }> = {};
    users.forEach((u) => {
      const key = u.createdAt.toLocaleString('default', { month: 'short', year: 'numeric' });
      if (!monthlyData[key]) monthlyData[key] = { total: 0, freelancers: 0, clients: 0 };
      monthlyData[key].total += 1;
      if (u.role === 'FREELANCER') monthlyData[key].freelancers += 1;
      if (u.role === 'CLIENT') monthlyData[key].clients += 1;
    });

    res.json({
      success: true,
      data: {
        totalUsers: users.length,
        growth: Object.entries(monthlyData).map(([month, data]) => ({ month, ...data })),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAuditLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count(),
    ]);

    res.json({ success: true, data: logs, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    next(error);
  }
};
