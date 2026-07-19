import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { upload } from '../middleware/upload';
import * as userController from '../controllers/user.controller';

const router = Router();

router.get('/freelancer/profile', authenticate, userController.getFreelancerProfile);
router.put('/freelancer/profile', authenticate, userController.updateFreelancerProfile);
router.post('/freelancer/resume', authenticate, upload.single('resume'), userController.uploadResume);
router.delete('/freelancer/resume/:id', authenticate, userController.deleteResume);
router.post('/freelancer/portfolio', authenticate, upload.array('images', 5), userController.addPortfolioItem);
router.delete('/freelancer/portfolio/:id', authenticate, userController.deletePortfolioItem);
router.put('/freelancer/skills', authenticate, userController.updateSkills);
router.get('/freelancer/:id', userController.getPublicFreelancerProfile);

router.put('/client/profile', authenticate, userController.updateClientProfile);
router.post('/client/verify', authenticate, upload.array('documents', 5), userController.submitVerificationDocuments);

router.post('/freelancer/education', authenticate, userController.addEducation);
router.put('/freelancer/education/:id', authenticate, userController.updateEducation);
router.delete('/freelancer/education/:id', authenticate, userController.deleteEducation);

router.get('/skills', userController.getSkills);
router.get('/freelancers/top', userController.getTopFreelancers);

export default router;
