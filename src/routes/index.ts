import { Router } from 'express';
import healthRouter from './health.route';
import asignacionesRouter from './asignaciones.routes';
import authRouter from './auth.routes';
import carrerasRouter from './carreras.routes';
import gruposRouter from './grupos.routes';
import horariosRouter from './horarios.routes';
import materiasRouter from './materias.routes';
import profesoresRouter from './profesores.routes';

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
router.use('/auth', authRouter);
router.use('/carreras', carrerasRouter);
router.use(asignacionesRouter);
router.use(gruposRouter);
router.use(horariosRouter);
router.use(materiasRouter);
router.use(profesoresRouter);

export default router;
