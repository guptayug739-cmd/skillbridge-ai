import { Router } from 'express';
import { prisma } from '../config/database';
import { redis } from '../config/redis';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import projectRoutes from './project.routes';
import proposalRoutes from './proposal.routes';
import contractRoutes from './contract.routes';
import paymentRoutes from './payment.routes';
import chatRoutes from './chat.routes';
import adminRoutes from './admin.routes';
import aiRoutes from './ai.routes';
import notificationRoutes from './notification.routes';
import savedRoutes from './saved.routes';
import inviteRoutes from './invite.routes';
import activityRoutes from './activity.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/projects', projectRoutes);
router.use('/proposals', proposalRoutes);
router.use('/contracts', contractRoutes);
router.use('/payments', paymentRoutes);
router.use('/chat', chatRoutes);
router.use('/admin', adminRoutes);
router.use('/ai', aiRoutes);
router.use('/notifications', notificationRoutes);
router.use('/saved', savedRoutes);
router.use('/invites', inviteRoutes);
router.use('/activity', activityRoutes);

router.get('/health', async (_req, res) => {
  const checks: Record<string, string> = {};
  let healthy = true;

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'healthy';
  } catch {
    checks.database = 'unhealthy';
    healthy = false;
  }

  if (redis) {
    try {
      const pong = await redis.ping();
      checks.redis = pong === 'PONG' ? 'healthy' : 'unhealthy';
      if (checks.redis === 'unhealthy') healthy = false;
    } catch {
      checks.redis = 'unhealthy';
      healthy = false;
    }
  } else {
    checks.redis = 'not configured';
  }

  const status = healthy ? 200 : 503;
  res.status(status).json({
    success: healthy,
    message: healthy ? 'All systems operational' : 'Degraded health',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks,
  });
});

export default router;
