import { Router } from 'express';
import { asyncHandler as h } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { authenticate, authorize } from '../middleware/auth.js';
import * as c from '../controllers/projects.controller.js';

const router = Router();
router.use(authenticate, authorize('admin', 'accountant', 'site_engineer'));
const editors = authorize('admin', 'site_engineer'); // مهندس الموقع يحدّث المراحل فقط

router.get('/', h(c.listProjects));
router.get('/:id', h(c.getProject));
router.post('/', authorize('admin'), validate(c.projectSchema), h(c.createProject));
router.patch('/:id', authorize('admin'), validate(c.projectPatchSchema), h(c.updateProject));
router.delete('/:id', authorize('admin'), h(c.deleteProject));

router.post('/:id/phases', editors, validate(c.phaseSchema), h(c.addPhase));
router.patch('/:id/phases/:phaseId', editors, validate(c.phasePatchSchema), h(c.updatePhase));
router.delete('/:id/phases/:phaseId', editors, h(c.deletePhase));

export default router;
