import { Router } from 'express';
import { asyncHandler as h } from '../utils/asyncHandler.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { projectsProfit } from '../controllers/reports.controller.js';

const router = Router();
router.get('/projects', authenticate, authorize('admin', 'accountant'), h(projectsProfit));
export default router;
