import { Router } from 'express';
import {
    getCarreras,
    createCarrera,
    updateCarrera,
    deleteCarrera,
} from '../controllers/carreras.controller';
import { authenticateUser } from '../middlewares/auth.middleware';
import { checkCareerRole } from '../middlewares/role.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Carreras
 *   description: Gestión de carreras y roles de usuario
 */

/**
 * @swagger
 * /carreras:
 *   get:
 *     summary: Lista las carreras a las que pertenece el usuario
 *     tags: [Carreras]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de carreras obtenida con éxito
 *       401:
 *         description: No autorizado
 */
router.get('/', authenticateUser, getCarreras);

/**
 * @swagger
 * /carreras:
 *   post:
 *     summary: Crea una nueva carrera y asigna rol de admin al creador
 *     tags: [Carreras]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *             properties:
 *               nombre:
 *                 type: string
 *               color:
 *                 type: string
 *                 example: "#3B82F6"
 *     responses:
 *       201:
 *         description: Carrera creada exitosamente
 *       400:
 *         description: Datos inválidos
 */
router.post('/', authenticateUser, createCarrera);

/**
 * @swagger
 * /carreras/{id}:
 *   put:
 *     summary: Actualiza los datos de una carrera (Solo Admins)
 *     tags: [Carreras]
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
 *               color:
 *                 type: string
 *     responses:
 *       200:
 *         description: Carrera actualizada exitosamente
 *       403:
 *         description: Forbidden - No tienes permisos de administrador
 *       404:
 *         description: Carrera no encontrada
 */
router.put('/:id', authenticateUser, checkCareerRole('admin'), updateCarrera);

/**
 * @swagger
 * /carreras/{id}:
 *   delete:
 *     summary: Elimina una carrera (Solo Admins)
 *     tags: [Carreras]
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
 *         description: Carrera eliminada exitosamente
 *       403:
 *         description: Forbidden - No tienes permisos de administrador
 *       404:
 *         description: Carrera no encontrada
 */
router.delete('/:id', authenticateUser, checkCareerRole('admin'), deleteCarrera);

export default router;
