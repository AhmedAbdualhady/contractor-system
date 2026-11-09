import { Router } from 'express';
import { asyncHandler as h } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { paymentSchema, listPayments, createPayment, deletePayment } from '../controllers/payments.controller.js';

const router = Router();
router.use(authenticate, authorize('admin', 'accountant'));
router.get('/', h(listPayments));
router.post('/', validate(paymentSchema), h(createPayment));
router.delete('/:id', authorize('admin'), h(deletePayment));
export default router;
