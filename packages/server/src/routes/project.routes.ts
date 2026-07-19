import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';
import { authenticate, authorize } from '../middleware/authenticate';
import { upload } from '../middleware/upload';
import { UserRole } from '@skillbridge/shared';
import * as projectController from '../controllers/project.controller';

const router = Router();

router.get('/', projectController.getProjects);
router.get('/:id', projectController.getProjectById);

router.post(
  '/',
  authenticate,
  authorize(UserRole.CLIENT),
  upload.array('attachments', 5),
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('categoryId').notEmpty().withMessage('Category is required'),
    body('budgetMin').isFloat({ min: 0 }).withMessage('Budget min must be positive'),
    body('budgetMax').isFloat({ min: 0 }).withMessage('Budget max must be positive'),
    body('deadline').isISO8601().withMessage('Valid deadline required'),
    body('duration').notEmpty().withMessage('Duration is required'),
  ],
  validate,
  projectController.createProject
);

router.put(
  '/:id',
  authenticate,
  authorize(UserRole.CLIENT),
  projectController.updateProject
);

router.delete('/:id', authenticate, authorize(UserRole.CLIENT), projectController.deleteProject);
router.post('/:id/save', authenticate, projectController.saveProject);
router.delete('/:id/save', authenticate, projectController.unsaveProject);

export default router;
