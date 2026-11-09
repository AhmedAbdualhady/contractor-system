import { Router } from 'express';
import { asyncHandler as h } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { expenseSchema, listExpenses, createExpense, deleteExpense } from '../controllers/expenses.controller.js';

const router = Router();
router.use(authenticate);
router.get('/', authorize('admin', 'accountant', 'site_engineer'), h(listExpenses));
router.post('/', authorize('admin', 'accountant', 'site_engineer'), validate(expenseSchema), h(createExpense));
router.delete('/:id', authorize('admin', 'accountant'), h(deleteExpense));
export default router;
