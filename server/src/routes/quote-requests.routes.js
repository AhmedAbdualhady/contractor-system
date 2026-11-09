import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { asyncHandler as h } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { submitSchema, statusSchema, submit, list, setStatus, convert, remove } from '../controllers/quote-requests.controller.js';

const router = Router();

// عام: يحدّ من الإزعاج (5 طلبات كل 30 دقيقة لكل جهاز)
const publicLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'محاولات كثيرة، حاول بعد قليل أو تواصل معنا واتساب' },
});
router.post('/', publicLimiter, validate(submitSchema), h(submit));

// للمهندس والمحاسب فقط
router.use(authenticate, authorize('admin', 'accountant'));
router.get('/', h(list));
router.patch('/:id/status', validate(statusSchema), h(setStatus));
router.post('/:id/convert', h(convert));
router.delete('/:id', authorize('admin'), h(remove));

export default router;
