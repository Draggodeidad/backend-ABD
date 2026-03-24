import { Router } from 'express';
import {
    getColaboradoresPorCarrera,
    agregarColaborador,
    actualizarColaborador,
    eliminarColaborador,
} from '../controllers/colaboradores.controller';
import { authenticateUser } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Colaboradores
 *   description: Gestión de usuarios y roles que colaboran en una carrera
 */

/**
 * @swagger
 * /carreras/{carreraId}/colaboradores:
 *   get:
 *     summary: Lista los colaboradores asociados a la carrera
 *     tags: [Colaboradores]
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
 *         description: Lista de colaboradores obtenida con éxito
 *       403:
 *         description: Prohibido - No tienes acceso a esta carrera
 */
router.get('/carreras/:carreraId/colaboradores', authenticateUser, getColaboradoresPorCarrera);

/**
 * @swagger
 * /carreras/{carreraId}/colaboradores:
 *   post:
 *     summary: Agrega un colaborador a una carrera (Solo Admins)
 *     tags: [Colaboradores]
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - rol
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email del usuario (debe existir en el sistema)
 *               rol:
 *                 type: string
 *                 enum: [admin, viewer]
 *                 description: Rol que tendrá en la carrera
 *     responses:
 *       201:
 *         description: Colaborador agregado exitosamente
 *       400:
 *         description: Faltan datos o usuario ya es colaborador
 *       403:
 *         description: Prohibido - No eres admin de esta carrera
 *       404:
 *         description: Usuario no encontrado por email
 */
router.post('/carreras/:carreraId/colaboradores', authenticateUser, agregarColaborador);

/**
 * @swagger
 * /colaboradores/{id}:
 *   put:
 *     summary: Actualiza el rol de un colaborador (Solo Admins de esa carrera)
 *     tags: [Colaboradores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del registro rol de colaborador en la carrera (tabla roles_carrera)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rol
 *             properties:
 *               rol:
 *                 type: string
 *                 enum: [admin, viewer]
 *                 description: Nuevo rol
 *     responses:
 *       200:
 *         description: Rol actualizado exitosamente
 *       400:
 *         description: Datos inválidos o intentando quitar al único admin
 *       403:
 *         description: Prohibido
 *       404:
 *         description: Colaborador no encontrado
 */
router.put('/colaboradores/:id', authenticateUser, actualizarColaborador);

/**
 * @swagger
 * /colaboradores/{id}:
 *   delete:
 *     summary: Elimina el acceso de un colaborador a la carrera (Solo Admins)
 *     tags: [Colaboradores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del registro rol de colaborador
 *     responses:
 *       200:
 *         description: Colaborador eliminado exitosamente
 *       400:
 *         description: Intentando eliminar al único admin de la carrera
 *       403:
 *         description: Prohibido
 *       404:
 *         description: Colaborador no encontrado
 */
router.delete('/colaboradores/:id', authenticateUser, eliminarColaborador);

export default router;
