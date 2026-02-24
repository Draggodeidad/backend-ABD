import { Request, Response } from 'express';

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     description: Returns the current status of the API server.
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: OK
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   description: Server uptime in seconds
 */
export const healthCheck = (_req: Request, res: Response): void => {
    res.status(200).json({
        success: true,
        message: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
};
