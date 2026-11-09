import { Router } from 'express';
import { asyncHandler as h } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  workerSchema, payDuesSchema, listWorkers, createWorker, updateWorker, deleteWorker, payDues,
} from '../controllers/workers.controller.js';

const router = Router();
router.use(authenticate);
router.get('/', authorize('admin', 'accountant', 'site_engineer'), h(listWorkers));
router.post('/', authorize('admin'), validate(workerSchema), h(createWorker));
router.put('/:id', authorize('admin'), validate(workerSchema), h(updateWorker));
router.delete('/:id', authorize('admin'), h(deleteWorker));
router.post('/:id/pay-dues', authorize('admin', 'accountant'), validate(payDuesSchema), h(payDues));
export default router;
