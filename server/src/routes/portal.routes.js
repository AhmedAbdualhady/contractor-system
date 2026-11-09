import { Router } from 'express';
import { asyncHandler as h } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  accountSchema, passwordSchema, myProjects, myProject, createAccount, resetPassword,
} from '../controllers/portal.controller.js';

const router = Router();
router.use(authenticate);

// للعميل: يرى مشاريعه فقط
router.get('/projects', authorize('client'), h(myProjects));
router.get('/projects/:id', authorize('client'), h(myProject));

// للمدير: إنشاء حسابات البوابة
router.post('/accounts', authorize('admin'), validate(accountSchema), h(createAccount));
router.patch('/accounts/:clientId/password', authorize('admin'), validate(passwordSchema), h(resetPassword));

export default router;
