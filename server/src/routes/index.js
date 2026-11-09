import express, { Router } from 'express';
import authRoutes from './auth.routes.js';
import clientsRoutes from './clients.routes.js';
import projectsRoutes from './projects.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import portalRoutes from './portal.routes.js';
import paymentsRoutes from './payments.routes.js';
import mediaRoutes from './media.routes.js';
import quoteRequestsRoutes from './quote-requests.routes.js';
import expensesRoutes from './expenses.routes.js';
import workersRoutes from './workers.routes.js';
import attendanceRoutes from './attendance.routes.js';
import reportsRoutes from './reports.routes.js';
import { publicRouter, portfolioRouter } from './portfolio.routes.js';
import usersRoutes from './users.routes.js';
import { quotesRouter, invoicesRouter } from './documents.routes.js';
import { UPLOAD_DIR } from '../config/uploads.js';

const router = Router();

router.get('/health', (_req, res) => res.json({ success: true, status: 'ok' }));
router.use('/auth', authRoutes);
router.use('/clients', clientsRoutes);
router.use('/projects', projectsRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/portal', portalRoutes);
router.use('/payments', paymentsRoutes);
router.use('/quotes', quotesRouter);
router.use('/invoices', invoicesRouter);
router.use('/media', mediaRoutes);
router.use('/quote-requests', quoteRequestsRoutes);
router.use('/expenses', expensesRoutes);
router.use('/workers', workersRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/reports', reportsRoutes);
router.use('/public', publicRouter);
router.use('/portfolio', portfolioRouter);
router.use('/users', usersRoutes);
router.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d' })); // الصور المرفوعة

// next: '/quotes', '/invoices', '/payments', '/expenses'

export default router;
