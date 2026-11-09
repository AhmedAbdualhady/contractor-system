import { Router } from 'express';
import { asyncHandler as h } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  createSchema, updateSchema, passwordSchema, listUsers, createUser, updateUser, resetPassword,
} from '../controllers/users.controller.js';

const router = Router();
router.use(authenticate, authorize('admin'));
router.get('/', h(listUsers));
router.post('/', validate(createSchema), h(createUser));
router.patch('/:id', validate(updateSchema), h(updateUser));
router.post('/:id/password', validate(passwordSchema), h(resetPassword));
export default router;
