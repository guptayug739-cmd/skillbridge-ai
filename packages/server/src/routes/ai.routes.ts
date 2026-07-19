import { Router } from 'express';
import { authenticate, authorize } from '../middleware/authenticate';
import { upload } from '../middleware/upload';
import { UserRole } from '@skillbridge/shared';
import * as aiController from '../controllers/ai.controller';

const router = Router();

router.post(
  '/analyze-resume',
  authenticate,
  authorize(UserRole.FREELANCER),
  upload.single('resume'),
  aiController.analyzeResume
);

router.get(
  '/recommend-freelancers/:projectId',
  authenticate,
  authorize(UserRole.CLIENT),
  aiController.recommendFreelancers
);

router.post(
  '/generate-proposal',
  authenticate,
  authorize(UserRole.FREELANCER),
  aiController.generateProposal
);

router.post(
  '/score-portfolio',
  authenticate,
  authorize(UserRole.FREELANCER),
  aiController.scorePortfolio
);

router.post(
  '/detect-scam',
  authenticate,
  aiController.detectScam
);

export default router;
