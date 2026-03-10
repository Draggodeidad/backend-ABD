import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';

/**
 * Middleware to authenticate users using Supabase JWT
 */
export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            status: 'error',
            message: 'No token provided',
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid or expired token',
            });
        }

        // Attach user to request object
        req.user = user;
        return next();
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error during authentication',
        });
    }
};
