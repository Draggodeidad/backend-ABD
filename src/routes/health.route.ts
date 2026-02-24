import { Router } from 'express';
import { healthCheck } from '../controllers/health.controller';

/**
 * @swagger
 * tags:
 *   name: Health
 *   description: Server health check
 */
const router = Router();

router.get('/', healthCheck);

export default router;
