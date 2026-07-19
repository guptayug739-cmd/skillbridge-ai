import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';
import { authenticate, authorize } from '../middleware/authenticate';
import { UserRole } from '@skillbridge/shared';
import * as inviteController from '../controllers/invite.controller';

const router = Router();

router.post(
  '/',
  authenticate,
  authorize(UserRole.CLIENT),
  [
    body('projectId').notEmpty().withMessage('Project ID is required'),
    body('freelancerId').notEmpty().withMessage('Freelancer ID is required'),
  ],
  validate,
  inviteController.inviteFreelancer
);

router.put('/:id/respond', authenticate, inviteController.respondToInvite);
router.get('/', authenticate, inviteController.getMyInvites);
router.get('/client', authenticate, authorize(UserRole.CLIENT), inviteController.getClientInvites);

export default router;
