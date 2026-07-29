import { Router } from 'express';
import { body } from 'express-validator';
import {
  createCustomer, listCustomers, getCustomer, updateCustomer, addFollowUp,
} from '../controllers/customerController';
import { validate } from '../middleware/validate';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

const customerValidation = [
  body('name').notEmpty().withMessage('Customer name is required'),
  body('mobile').notEmpty().withMessage('Mobile number is required'),
  body('email').optional({ values: 'falsy' }).isEmail().withMessage('Invalid email'),
  body('customerType').isIn(['RETAIL', 'WHOLESALE', 'DISTRIBUTOR']).withMessage('Invalid customer type'),
  body('status').optional().isIn(['LEAD', 'ACTIVE', 'INACTIVE']),
];

// Admin & Sales can manage customers. Warehouse/Accounts have read-only access.
router.post('/', authorize('ADMIN', 'SALES'), customerValidation, validate, createCustomer);
router.get('/', listCustomers);
router.get('/:id', getCustomer);
router.put('/:id', authorize('ADMIN', 'SALES'), customerValidation, validate, updateCustomer);
router.post(
  '/:id/follow-ups',
  authorize('ADMIN', 'SALES'),
  [body('note').notEmpty().withMessage('Follow-up note is required')],
  validate,
  addFollowUp
);

export default router;
