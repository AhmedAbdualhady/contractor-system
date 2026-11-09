import { Router } from 'express';
import { asyncHandler as h } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { authenticate, authorize } from '../middleware/auth.js';
import * as c from '../controllers/clients.controller.js';

const router = Router();
router.use(authenticate, authorize('admin', 'accountant', 'site_engineer'));

router.get('/', h(c.listClients));
router.post('/', authorize('admin'), validate(c.clientSchema), h(c.createClient));
router.patch('/:id', authorize('admin'), validate(c.clientPatchSchema), h(c.updateClient));
router.delete('/:id', authorize('admin'), h(c.deleteClient));

export default router;
