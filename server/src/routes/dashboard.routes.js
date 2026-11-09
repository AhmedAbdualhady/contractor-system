import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { stats } from '../controllers/dashboard.controller.js';

const router = Router();
router.get('/stats', authenticate, authorize('admin', 'accountant', 'site_engineer'), asyncHandler(stats));
export default router;
