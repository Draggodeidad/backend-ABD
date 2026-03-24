import { Router } from 'express';
import {
    getSalonesByCarrera,
    createSalon,
    updateSalon,
    deleteSalon,
} from '../controllers/salones.controller';
import { authenticateUser } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Salones
 *   description: Gestión de espacios físicos (aulas, laboratorios)
 */

/**
 * @swagger
 * /carreras/{carreraId}/salones:
 *   get:
 *     summary: Lista los salones asociados a una carrera
 *     tags: [Salones]
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
 *         description: Lista de salones obtenida con éxito
 *       403:
 *         description: Prohibido - No tienes acceso a esta carrera
 */
router.get('/carreras/:carreraId/salones', authenticateUser, getSalonesByCarrera);

/**
 * @swagger
 * /carreras/{carreraId}/salones:
 *   post:
 *     summary: Crea un nuevo salón y lo asocia a la carrera
 *     tags: [Salones]
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
 *               - nombre
 *               - edificio
 *               - tipo
 *             properties:
 *               nombre:
 *                 type: string
 *                 description: Nombre del salón (ej. "A-101")
 *               edificio:
 *                 type: string
 *                 description: Edificio al que pertenece
 *               tipo:
 *                 type: string
 *                 enum: [aula, laboratorio, sala]
 *                 description: Tipo de espacio físico
 *     responses:
 *       201:
 *         description: Salón creado exitosamente
 *       400:
 *         description: Datos inválidos
 *       403:
 *         description: Prohibido - No eres admin de la carrera
 *       409:
 *         description: Conflicto - El nombre de salón ya existe
 */
router.post('/carreras/:carreraId/salones', authenticateUser, createSalon);

/**
 * @swagger
 * /salones/{id}:
 *   put:
 *     summary: Actualiza la información de un salón globalmente
 *     tags: [Salones]
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
 *               edificio:
 *                 type: string
 *               tipo:
 *                 type: string
 *                 enum: [aula, laboratorio, sala]
 *               activo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Salón actualizado exitosamente
 *       403:
 *         description: Prohibido
 *       404:
 *         description: Salón no encontrado
 */
router.put('/salones/:id', authenticateUser, updateSalon);

/**
 * @swagger
 * /salones/{id}:
 *   delete:
 *     summary: Elimina un salón globalmente
 *     tags: [Salones]
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
 *         description: Salón eliminado exitosamente
 *       403:
 *         description: Prohibido
 */
router.delete('/salones/:id', authenticateUser, deleteSalon);

export default router;
