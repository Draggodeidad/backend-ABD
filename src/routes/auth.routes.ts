import { Router } from 'express';
import { syncProfile } from '../controllers/auth.controller';
import { authenticateUser } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * /auth/sync-profile:
 *   post:
 *     summary: Sincroniza el perfil del usuario con los datos de Google OAuth
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil sincronizado correctamente
 *       401:
 *         description: No autorizado (Token inválido o no proporcionado)
 *       500:
 *         description: Error interno del servidor
 */
router.post('/sync-profile', authenticateUser, syncProfile);

export default router;
