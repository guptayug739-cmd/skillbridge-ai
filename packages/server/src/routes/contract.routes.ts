import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import * as contractController from '../controllers/contract.controller';

const router = Router();

router.get('/', authenticate, contractController.getContracts);
router.get('/:id', authenticate, contractController.getContractById);
router.post('/:id/milestones', authenticate, contractController.addMilestone);
router.put('/milestones/:milestoneId/complete', authenticate, contractController.completeMilestone);
router.put('/milestones/:milestoneId/approve', authenticate, contractController.approveMilestone);
router.post('/:id/complete', authenticate, contractController.completeContract);
router.post('/:id/cancel', authenticate, contractController.cancelContract);

export default router;
