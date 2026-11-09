import { Router } from 'express';
import { asyncHandler as h } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { listPublic, getPublic, publishSchema, updatePortfolio } from '../controllers/portfolio.controller.js';

// /api/public/...  (مفتوح للزوار)
export const publicRouter = Router();
publicRouter.get('/projects', h(listPublic));
publicRouter.get('/projects/:slug', h(getPublic));

// /api/portfolio/...  (للمهندس ومهندس الموقع)
export const portfolioRouter = Router();
portfolioRouter.patch('/:id', authenticate, authorize('admin', 'site_engineer'), validate(publishSchema), h(updatePortfolio));
