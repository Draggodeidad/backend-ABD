import { Request, Response, NextFunction } from 'express';

export const notFound = (_req: Request, res: Response, _next: NextFunction): void => {
    res.status(404).json({
        success: false,
        statusCode: 404,
        message: `Route not found: ${_req.method} ${_req.originalUrl}`,
    });
};
