import { Router } from 'express';
import {
    getMateriasByCarrera,
    createMateria,
    updateMateria,
    deleteMateria,
} from '../controllers/materias.controller';
import { authenticateUser } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Materias
 *   description: Gestión de materias por carrera
 */

/**
 * @swagger
 * /carreras/{carreraId}/materias:
 *   get:
 *     summary: Lista las materias de una carrera (Soporta filtro por grado)
 *     tags: [Materias]
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
 *       - in: query
 *         name: grado
 *         required: false
 *         schema:
 *           type: integer
 *         description: Filtrar materias por grado/semestre
 *     responses:
 *       200:
 *         description: Lista de materias obtenida con éxito
 *       403:
 *         description: Prohibido - No tienes acceso a esta carrera
 */
router.get('/carreras/:carreraId/materias', authenticateUser, getMateriasByCarrera);

/**
 * @swagger
 * /carreras/{carreraId}/materias:
 *   post:
 *     summary: Crea una nueva materia en una carrera (Solo Admins de esa carrera)
 *     tags: [Materias]
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
 *               - nombre
 *               - grado
 *               - horas_semanales
 *             properties:
 *               nombre:
 *                 type: string
 *               codigo:
 *                 type: string
 *                 description: Código opcional (ej. ENF-101)
 *               grado:
 *                 type: integer
 *               horas_semanales:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Materia creada exitosamente
 *       400:
 *         description: Datos inválidos
 *       403:
 *         description: Prohibido - No eres admin de esta carrera
 */
router.post('/carreras/:carreraId/materias', authenticateUser, createMateria);

/**
 * @swagger
 * /materias/{id}:
 *   put:
 *     summary: Actualiza una materia (Solo Admins de la carrera)
 *     tags: [Materias]
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
 *               nombre:
 *                 type: string
 *               codigo:
 *                 type: string
 *               grado:
 *                 type: integer
 *               horas_semanales:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Materia actualizada exitosamente
 *       403:
 *         description: Prohibido
 *       404:
 *         description: Materia no encontrada
 */
router.put('/materias/:id', authenticateUser, updateMateria);

/**
 * @swagger
 * /materias/{id}:
 *   delete:
 *     summary: Elimina una materia (Solo Admins de la carrera)
 *     tags: [Materias]
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
 *         description: Materia eliminada exitosamente
 *       403:
 *         description: Prohibido
 */
router.delete('/materias/:id', authenticateUser, deleteMateria);

export default router;
