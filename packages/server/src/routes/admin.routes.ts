import { Router } from 'express';
import { authenticate, authorize } from '../middleware/authenticate';
import { UserRole } from '@skillbridge/shared';
import * as adminController from '../controllers/admin.controller';

const router = Router();

router.use(authenticate);
router.use(authorize(UserRole.ADMIN));

router.get('/dashboard', adminController.getDashboard);
router.get('/users', adminController.getUsers);
router.put('/users/:id/verify', adminController.verifyUser);
router.put('/users/:id/suspend', adminController.suspendUser);
router.get('/companies', adminController.getCompanies);
router.put('/companies/:id/verify', adminController.verifyCompany);
router.get('/projects', adminController.getProjects);
router.put('/projects/:id/status', adminController.updateProjectStatus);
router.get('/payments', adminController.getPayments);
router.get('/disputes', adminController.getDisputes);
router.put('/disputes/:id/resolve', adminController.resolveDispute);
router.get('/reports/revenue', adminController.getRevenueReport);
router.get('/reports/users', adminController.getUserReport);
router.get('/audit-logs', adminController.getAuditLogs);

export default router;
