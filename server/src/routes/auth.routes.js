import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { login, logout, me, loginSchema } from '../controllers/auth.controller.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'محاولات كثيرة، حاول بعد 15 دقيقة' },
});

router.post('/login', loginLimiter, validate(loginSchema), asyncHandler(login));
router.get('/me', authenticate, asyncHandler(me));
router.post('/logout', logout);

export default router;
