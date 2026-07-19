import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';
import { authenticate, authorize } from '../middleware/authenticate';
import { upload } from '../middleware/upload';
import { UserRole } from '@skillbridge/shared';
import * as proposalController from '../controllers/proposal.controller';

const router = Router();

router.get('/my', authenticate, authorize(UserRole.FREELANCER), proposalController.getMyProposals);
router.get('/project/:projectId', authenticate, proposalController.getProjectProposals);

router.post(
  '/',
  authenticate,
  authorize(UserRole.FREELANCER),
  upload.array('attachments', 5),
  [
    body('projectId').notEmpty().withMessage('Project ID is required'),
    body('coverLetter').trim().notEmpty().withMessage('Cover letter is required'),
    body('bidAmount').isFloat({ min: 0 }).withMessage('Bid amount must be positive'),
    body('deliveryTime').isInt({ min: 1 }).withMessage('Delivery time must be at least 1 day'),
  ],
  validate,
  proposalController.submitProposal
);

router.put('/:id', authenticate, authorize(UserRole.FREELANCER), proposalController.updateProposal);
router.delete('/:id', authenticate, authorize(UserRole.FREELANCER), proposalController.withdrawProposal);
router.post('/:id/accept', authenticate, authorize(UserRole.CLIENT), proposalController.acceptProposal);
router.post('/:id/reject', authenticate, authorize(UserRole.CLIENT), proposalController.rejectProposal);
router.post('/:id/shortlist', authenticate, authorize(UserRole.CLIENT), proposalController.shortlistProposal);

export default router;
