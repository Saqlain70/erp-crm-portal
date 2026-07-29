import { Router } from 'express';
import { body } from 'express-validator';
import multer from 'multer';
import path from 'path';
import {
  createProduct, listProducts, getProduct, updateProduct, adjustStock, uploadProductImage,
} from '../controllers/productController';
import { validate } from '../middleware/validate';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Multer configuration for product image uploads
const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', '..', 'uploads'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `product-${Date.now()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only image files (jpg, png, webp, gif) are allowed'));
  },
});

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
router.post('/:id/upload-image', authorize('ADMIN', 'WAREHOUSE'), upload.single('image'), uploadProductImage);

export default router;
