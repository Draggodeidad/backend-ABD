import { Router } from 'express';
import {
    generateHorario,
    getHorario,
    deleteHorario,
} from '../controllers/horarios.controller';
import { authenticateUser } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Horarios
 *   description: Generación y consulta de horarios automáticos
 */

/**
 * @swagger
 * /grupos/{grupoId}/horario/generar:
 *   post:
 *     summary: Genera automáticamente el horario de un grupo (Solo Admins)
 *     description: |
 *       Ejecuta el algoritmo de asignación round-robin que distribuye las materias
 *       equitativamente de Lunes a Viernes, verificando disponibilidad del profesor
 *       y conflictos de horario. Si no se pueden colocar todas las horas, devuelve
 *       un código 207 con los `warnings` detallando las materias incompletas.
 *     tags: [Horarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: grupoId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: regenerar
 *         required: false
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Si es `true`, elimina el horario previo antes de regenerar
 *     responses:
 *       200:
 *         description: Horario generado exitosamente sin advertencias
 *       207:
 *         description: Horario generado parcialmente (Multi-Status). Revisa el campo `warnings`.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       asignacion_id:
 *                         type: string
 *                         format: uuid
 *                       dia_semana:
 *                         type: integer
 *                       hora_inicio:
 *                         type: string
 *                       hora_fin:
 *                         type: string
 *                 warnings:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       materia:
 *                         type: string
 *                       horasFaltantes:
 *                         type: integer
 *                       motivo:
 *                         type: string
 *       400:
 *         description: Ya existe horario. Usa `?regenerar=true` para regenerar.
 *       403:
 *         description: Prohibido
 */
router.post('/grupos/:grupoId/horario/generar', authenticateUser, generateHorario);

/**
 * @swagger
 * /grupos/{grupoId}/horario:
 *   get:
 *     summary: Consulta el horario generado de un grupo (agrupado por día)
 *     description: |
 *       Devuelve los bloques de horario agrupados por día de la semana:
 *       `{ lunes: [...], martes: [...], ... }`. Cada bloque incluye datos
 *       de la materia y el profesor correspondiente.
 *     tags: [Horarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: grupoId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Horario obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     lunes:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           hora_inicio:
 *                             type: string
 *                             example: "07:00"
 *                           hora_fin:
 *                             type: string
 *                             example: "07:50"
 *                           materia:
 *                             type: string
 *                           profesor:
 *                             type: string
 *                     martes:
 *                       type: array
 *                     miercoles:
 *                       type: array
 *                     jueves:
 *                       type: array
 *                     viernes:
 *                       type: array
 *       403:
 *         description: Prohibido
 *       404:
 *         description: Grupo no encontrado
 */
router.get('/grupos/:grupoId/horario', authenticateUser, getHorario);

/**
 * @swagger
 * /grupos/{grupoId}/horario:
 *   delete:
 *     summary: Elimina todos los bloques de horario de un grupo (Solo Admins)
 *     tags: [Horarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: grupoId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Horario eliminado exitosamente
 *       403:
 *         description: Prohibido
 *       404:
 *         description: Grupo no encontrado
 */
router.delete('/grupos/:grupoId/horario', authenticateUser, deleteHorario);

export default router;
