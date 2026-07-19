import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { upload } from '../middleware/upload';
import * as chatController from '../controllers/chat.controller';

const router = Router();

router.get('/contracts', authenticate, chatController.getChatContracts);
router.get('/:contractId/messages', authenticate, chatController.getMessages);
router.post('/:contractId/messages', authenticate, upload.array('attachments', 5), chatController.sendMessage);
router.put('/:contractId/read', authenticate, chatController.markAsRead);

export default router;
