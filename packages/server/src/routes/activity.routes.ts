import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import * as activityController from '../controllers/activity.controller';

const router = Router();

router.get('/', authenticate, activityController.getActivityFeed);

export default router;
