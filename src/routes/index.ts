import { Router } from 'express';
import healthRouter from './health.route';

const router = Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check
 */
router.use('/health', healthRouter);

// Add new route modules here
// router.use('/users', usersRouter);
// router.use('/auth', authRouter);

export default router;
