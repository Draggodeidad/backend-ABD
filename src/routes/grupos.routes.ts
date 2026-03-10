import { Router } from 'express';
import {
    getGruposByCarrera,
    createGrupo,
    updateGrupo,
    deleteGrupo,
} from '../controllers/grupos.controller';
import { authenticateUser } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Grupos
 *   description: Gestión de grupos escolares (ej. 1A, 5B)
 */

/**
 * @swagger
 * /carreras/{carreraId}/grupos:
 *   get:
 *     summary: Lista todos los grupos de una carrera específica
 *     tags: [Grupos]
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
 *         description: Lista de grupos obtenida con éxito
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error del servidor
 */
router.get('/carreras/:carreraId/grupos', authenticateUser, getGruposByCarrera);

/**
 * @swagger
 * /carreras/{carreraId}/grupos:
 *   post:
 *     summary: Crea un nuevo grupo en una carrera (Solo Admins de esa carrera)
 *     tags: [Grupos]
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
 *             required:
 *               - grado
 *               - seccion
 *               - turno
 *             properties:
 *               grado:
 *                 type: integer
 *               seccion:
 *                 type: string
 *               turno:
 *                 type: string
 *                 enum: [matutino, vespertino]
 *               hora_inicio:
 *                 type: string
 *                 format: time
 *               hora_fin:
 *                 type: string
 *                 format: time
 *               duracion_bloque:
 *                 type: integer
 *                 default: 50
 *     responses:
 *       201:
 *         description: Grupo creado exitosamente (incluye el nombre generado)
 *       400:
 *         description: Datos inválidos
 *       403:
 *         description: Prohibido - No eres admin de esta carrera
 */
router.post('/carreras/:carreraId/grupos', authenticateUser, createGrupo);

/**
 * @swagger
 * /grupos/{id}:
 *   put:
 *     summary: Actualiza los datos de un grupo (Solo Admins de la carrera)
 *     tags: [Grupos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               grado:
 *                 type: integer
 *               seccion:
 *                 type: string
 *               turno:
 *                 type: string
 *                 enum: [matutino, vespertino]
 *               hora_inicio:
 *                 type: string
 *                 format: time
 *               hora_fin:
 *                 type: string
 *                 format: time
 *               duracion_bloque:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Grupo actualizado exitosamente
 *       403:
 *         description: Prohibido - No eres admin de la carrera del grupo
 *       404:
 *         description: Grupo no encontrado
 */
router.put('/:id', authenticateUser, updateGrupo);

/**
 * @swagger
 * /grupos/{id}:
 *   delete:
 *     summary: Elimina un grupo (Solo Admins de la carrera)
 *     tags: [Grupos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Grupo eliminado exitosamente
 *       403:
 *         description: Prohibido - No eres admin de la carrera del grupo
 *       404:
 *         description: Grupo no encontrado
 */
router.delete('/:id', authenticateUser, deleteGrupo);

export default router;
