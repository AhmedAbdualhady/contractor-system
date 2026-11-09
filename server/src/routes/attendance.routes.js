import { Router } from 'express';
import { asyncHandler as h } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { attendanceSchema, listDay, saveDay } from '../controllers/attendance.controller.js';

const router = Router();
router.use(authenticate, authorize('admin', 'site_engineer'));
router.get('/', h(listDay));
router.post('/', validate(attendanceSchema), h(saveDay));
export default router;
