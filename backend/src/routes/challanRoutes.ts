import { Router } from 'express';
import { body } from 'express-validator';
import {
  createChallan, listChallans, getChallan, confirmChallan, cancelChallan, generateInvoice,
} from '../controllers/challanController';
import { validate } from '../middleware/validate';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Only Sales & Admin create/confirm/cancel challans. Warehouse/Accounts can view.
router.post(
  '/',
  authorize('ADMIN', 'SALES'),
  [
    body('customerId').notEmpty().withMessage('customerId is required'),
    body('items').isArray({ min: 1 }).withMessage('At least one product line is required'),
    body('items.*.productId').notEmpty().withMessage('productId is required for each item'),
    body('items.*.quantity').isInt({ gt: 0 }).withMessage('quantity must be a positive integer'),
    body('status').optional().isIn(['DRAFT', 'CONFIRMED']),
  ],
  validate,
  createChallan
);

router.get('/', listChallans);
router.get('/:id', getChallan);
router.post('/:id/confirm', authorize('ADMIN', 'SALES'), confirmChallan);
router.post('/:id/cancel', authorize('ADMIN', 'SALES'), cancelChallan);
router.get('/:id/invoice', authorize('ADMIN', 'SALES', 'ACCOUNTS'), generateInvoice);

export default router;
