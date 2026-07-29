import { Router } from 'express';
import { body } from 'express-validator';
import {
  createProduct, listProducts, getProduct, updateProduct, adjustStock,
} from '../controllers/productController';
import { validate } from '../middleware/validate';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

const productValidation = [
  body('name').notEmpty().withMessage('Product name is required'),
  body('sku').notEmpty().withMessage('SKU is required'),
  body('unitPrice').isFloat({ min: 0 }).withMessage('Unit price must be a positive number'),
];

// Admin & Warehouse manage products/stock. Sales & Accounts have read-only access.
router.post('/', authorize('ADMIN', 'WAREHOUSE'), productValidation, validate, createProduct);
router.get('/', listProducts);
router.get('/:id', getProduct);
router.put('/:id', authorize('ADMIN', 'WAREHOUSE'), productValidation, validate, updateProduct);
router.post(
  '/:id/stock-movements',
  authorize('ADMIN', 'WAREHOUSE'),
  [
    body('quantity').isInt({ gt: 0 }).withMessage('Quantity must be a positive integer'),
    body('movementType').isIn(['IN', 'OUT']).withMessage('movementType must be IN or OUT'),
    body('reason').notEmpty().withMessage('Reason is required'),
  ],
  validate,
  adjustStock
);

export default router;
