import { Router } from 'express';
import {
    listProfesores,
    createProfesor,
    updateProfesor,
    deleteProfesor,
} from '../controllers/profesores.controller';
import {
    getDisponibilidad,
    createDisponibilidadBatch,
    deleteDisponibilidadBlock,
} from '../controllers/disponibilidad.controller';
import { authenticateUser } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Profesores
 *     description: Gestión de profesores y su vinculación con carreras
 *   - name: Disponibilidad
 *     description: Gestión de la disponibilidad horaria de los profesores
 */

// --- Rutas de Profesores ---

/**
 * @swagger
 * /profesores:
 *   get:
 *     summary: Lista los profesores accesibles al usuario según sus carreras
 *     tags: [Profesores]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de profesores obtenida con éxito
 *       401:
 *         description: No autorizado
 */
router.get('/profesores', authenticateUser, listProfesores);

/**
 * @swagger
 * /profesores:
 *   post:
 *     summary: Crea un profesor y lo vincula a una carrera (Solo Admins de esa carrera)
 *     tags: [Profesores]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre_completo
 *               - carrera_id
 *             properties:
 *               nombre_completo:
 *                 type: string
 *               email:
 *                 type: string
 *               carrera_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Profesor creado y vinculado exitosamente
 *       400:
 *         description: Datos inválidos
 *       403:
 *         description: Prohibido - No eres admin de esta carrera
 */
router.post('/profesores', authenticateUser, createProfesor);

/**
 * @swagger
 * /profesores/{id}:
 *   put:
 *     summary: Actualiza los datos de un profesor (Solo Admins de sus carreras)
 *     tags: [Profesores]
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
 *               nombre_completo:
 *                 type: string
 *               email:
 *                 type: string
 *               activo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Profesor actualizado exitosamente
 *       403:
 *         description: Prohibido
 *       404:
 *         description: No encontrado
 */
router.put('/profesores/:id', authenticateUser, updateProfesor);

/**
 * @swagger
 * /profesores/{id}:
 *   delete:
 *     summary: Elimina un profesor (Solo Admins de sus carreras)
 *     tags: [Profesores]
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
 *         description: Profesor eliminado exitosamente
 *       403:
 *         description: Prohibido
 */
router.delete('/profesores/:id', authenticateUser, deleteProfesor);

// --- Rutas de Disponibilidad ---

/**
 * @swagger
 * /profesores/{id}/disponibilidad:
 *   get:
 *     summary: Obtiene la disponibilidad de un profesor
 *     tags: [Disponibilidad]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del profesor
 *     responses:
 *       200:
 *         description: Disponibilidad obtenida con éxito
 *       403:
 *         description: Prohibido - No tienes acceso a este profesor
 *       404:
 *         description: Profesor no encontrado
 */
router.get('/profesores/:id/disponibilidad', authenticateUser, getDisponibilidad);

/**
 * @swagger
 * /profesores/{id}/disponibilidad:
 *   post:
 *     summary: Crea bloques de disponibilidad en masa (Batch Insert)
 *     tags: [Disponibilidad]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del profesor
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               required:
 *                 - dia_semana
 *                 - hora_inicio
 *                 - hora_fin
 *               properties:
 *                 dia_semana:
 *                   type: integer
 *                   description: "1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes"
 *                 hora_inicio:
 *                   type: string
 *                   format: time
 *                 hora_fin:
 *                   type: string
 *                   format: time
 *     responses:
 *       201:
 *         description: Bloques creados exitosamente
 *       400:
 *         description: Datos inválidos o formato incorrecto
 *       403:
 *         description: Prohibido
 */
router.post('/profesores/:id/disponibilidad', authenticateUser, createDisponibilidadBatch);

/**
 * @swagger
 * /disponibilidad/{id}:
 *   delete:
 *     summary: Elimina un bloque de disponibilidad específico
 *     tags: [Disponibilidad]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID del bloque de disponibilidad
 *     responses:
 *       200:
 *         description: Bloque eliminado exitosamente
 *       403:
 *         description: Prohibido
 */
router.delete('/disponibilidad/:id', authenticateUser, deleteDisponibilidadBlock);

export default router;
