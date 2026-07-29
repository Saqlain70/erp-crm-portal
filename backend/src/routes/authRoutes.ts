import { Router } from 'express';
import { body } from 'express-validator';
import { login, register, me } from '../controllers/authController';
import { validate } from '../middleware/validate';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.post(
  '/login',
  [body('email').isEmail().withMessage('Valid email required'), body('password').notEmpty().withMessage('Password required')],
  validate,
  login
);

// Only Admins can create new staff accounts.
router.post(
  '/register',
  authenticate,
  authorize('ADMIN'),
  [
    body('name').notEmpty(),
    body('email').isEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS']),
  ],
  validate,
  register
);

router.get('/me', authenticate, me);

export default router;
