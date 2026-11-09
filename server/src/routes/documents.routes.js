import { Router } from 'express';
import { asyncHandler as h } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { quotes, invoices } from '../controllers/documents.controller.js';

function build(ctl) {
  const r = Router();
  r.use(authenticate, authorize('admin', 'accountant'));
  r.get('/', h(ctl.list));
  r.get('/:id', h(ctl.get));
  r.post('/', validate(ctl.schema), h(ctl.create));
  r.put('/:id', validate(ctl.schema), h(ctl.update));
  r.patch('/:id/status', validate(ctl.statusSchema), h(ctl.setStatus));
  r.delete('/:id', authorize('admin'), h(ctl.remove));
  return r;
}

export const quotesRouter = build(quotes);
export const invoicesRouter = build(invoices);
