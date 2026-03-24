import { Router } from 'express';
import {
    getConfigByCarrera,
    updateConfigByCarrera,
} from '../controllers/config.controller';
import { authenticateUser } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Configuración
 *   description: Ajustes dinámicos de los horarios por carrera (bloques, recesos)
 */

/**
 * @swagger
 * /carreras/{carreraId}/config:
 *   get:
 *     summary: Obtiene la configuración de horarios para la carrera
 *     tags: [Configuración]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: carreraId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la carrera
 *     responses:
 *       200:
 *         description: Configuración obtenida con éxito
 *       403:
 *         description: Prohibido - No tienes acceso a esta carrera
 */
router.get('/carreras/:carreraId/config', authenticateUser, getConfigByCarrera);

/**
 * @swagger
 * /carreras/{carreraId}/config:
 *   put:
 *     summary: Actualiza u obtiene los parámetros de configuración de la carrera
 *     tags: [Configuración]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: carreraId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               duracion_bloque:
 *                 type: integer
 *                 description: Duración de cada bloque de clases en minutos (ej. 50)
 *               hora_inicio:
 *                 type: string
 *                 format: time
 *                 description: "07:00:00"
 *               hora_fin:
 *                 type: string
 *                 format: time
 *               receso_matutino_inicio:
 *                 type: string
 *                 format: time
 *                 nullable: true
 *               receso_matutino_fin:
 *                 type: string
 *                 format: time
 *                 nullable: true
 *               receso_vespertino_inicio:
 *                 type: string
 *                 format: time
 *                 nullable: true
 *               receso_vespertino_fin:
 *                 type: string
 *                 format: time
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Configuración actualizada exitosamente
 *       400:
 *         description: Datos inválidos
 *       403:
 *         description: Prohibido - No eres admin de la carrera
 */
router.put('/carreras/:carreraId/config', authenticateUser, updateConfigByCarrera);

export default router;
