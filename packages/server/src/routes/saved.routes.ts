import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import * as savedController from '../controllers/saved.controller';

const router = Router();

router.post('/freelancers/:freelancerId', authenticate, savedController.saveFreelancer);
router.delete('/freelancers/:freelancerId', authenticate, savedController.unsaveFreelancer);
router.get('/freelancers', authenticate, savedController.getSavedFreelancers);
router.get('/projects', authenticate, savedController.getSavedProjects);

export default router;
