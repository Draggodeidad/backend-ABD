import { Router } from 'express';
import {
    getAsignacionesByGrupo,
    createAsignacion,
    updateAsignacion,
    deleteAsignacion,
} from '../controllers/asignaciones.controller';
import { authenticateUser } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Asignaciones
 *   description: Gestión de asignaciones (Profesor → Materia → Grupo)
 */

/**
 * @swagger
 * /grupos/{grupoId}/asignaciones:
 *   get:
 *     summary: Lista todas las asignaciones de un grupo específico
 *     tags: [Asignaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: grupoId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del grupo
 *     responses:
 *       200:
 *         description: Lista de asignaciones obtenida con éxito. Incluye los datos anidados de `materia` y `profesor`.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       materia_id:
 *                         type: string
 *                         format: uuid
 *                       profesor_id:
 *                         type: string
 *                         format: uuid
 *                       materia:
 *                         type: object
 *                         description: Datos completos de la materia
 *                       profesor:
 *                         type: object
 *                         description: Datos completos del profesor
 *       403:
 *         description: Prohibido - No tienes acceso a la carrera de este grupo
 *       404:
 *         description: Grupo no encontrado
 */
router.get('/grupos/:grupoId/asignaciones', authenticateUser, getAsignacionesByGrupo);

/**
 * @swagger
 * /grupos/{grupoId}/asignaciones:
 *   post:
 *     summary: Asigna un profesor y una materia a un grupo (Solo Admins de la carrera)
 *     tags: [Asignaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: grupoId
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
 *             required:
 *               - materia_id
 *               - profesor_id
 *             properties:
 *               materia_id:
 *                 type: string
 *                 format: uuid
 *               profesor_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Asignación creada exitosamente
 *       400:
 *         description: Datos inválidos o el profesor/materia no pertenecen a la carrera del grupo
 *       403:
 *         description: Prohibido - No eres admin de la carrera de este grupo
 *       409:
 *         description: Conflicto - Esta materia ya está asignada a este grupo
 */
router.post('/grupos/:grupoId/asignaciones', authenticateUser, createAsignacion);

/**
 * @swagger
 * /asignaciones/{id}:
 *   put:
 *     summary: Actualiza una asignación existente (Solo Admins de la carrera)
 *     tags: [Asignaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la asignación
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               materia_id:
 *                 type: string
 *                 format: uuid
 *               profesor_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Asignación actualizada exitosamente
 *       400:
 *         description: El nuevo profesor/materia no pertenecen a la carrera
 *       403:
 *         description: Prohibido
 *       404:
 *         description: Asignación no encontrada
 *       409:
 *         description: Conflicto - Asignación duplicada
 */
router.put('/asignaciones/:id', authenticateUser, updateAsignacion);

/**
 * @swagger
 * /asignaciones/{id}:
 *   delete:
 *     summary: Elimina una asignación (Solo Admins de la carrera)
 *     tags: [Asignaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la asignación
 *     responses:
 *       200:
 *         description: Asignación eliminada exitosamente
 *       403:
 *         description: Prohibido
 *       404:
 *         description: Asignación no encontrada
 */
router.delete('/asignaciones/:id', authenticateUser, deleteAsignacion);

export default router;
