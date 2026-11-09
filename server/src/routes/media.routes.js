import { Router } from 'express';
import { asyncHandler as h } from '../utils/asyncHandler.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { uploadFiles, listMedia, addMedia, removeMedia } from '../controllers/media.controller.js';

const router = Router();
router.use(authenticate, authorize('admin', 'site_engineer'));
router.get('/project/:projectId', h(listMedia));
router.post('/project/:projectId', uploadFiles, h(addMedia));
router.delete('/:id', h(removeMedia));
export default router;
