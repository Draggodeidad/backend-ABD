import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';

/**
 * Middleware to check if a user has a specific role in a career
 * @param requiredRole 'admin' | 'viewer'
 */
export const checkCareerRole = (requiredRole: 'admin' | 'viewer') => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const { id: careerId } = req.params;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                status: 'error',
                message: 'User authentication required',
            });
        }

        if (!careerId) {
            return res.status(400).json({
                status: 'error',
                message: 'Career ID is required in URL parameters',
            });
        }

        try {
            const { data: roleData, error } = await supabaseAdmin
                .from('roles_carrera')
                .select('rol')
                .eq('carrera_id', careerId)
                .eq('user_id', userId)
                .single();

            if (error || !roleData) {
                return res.status(403).json({
                    status: 'error',
                    message: 'Forbidden: You do not have access to this career',
                });
            }

            // 'admin' can do anything. 'viewer' can only do listed 'viewer' operations.
            if (requiredRole === 'admin' && roleData.rol !== 'admin') {
                return res.status(403).json({
                    status: 'error',
                    message: 'Forbidden: Admin role required for this operation',
                });
            }

            return next();
        } catch (error) {
            return res.status(500).json({
                status: 'error',
                message: 'Internal server error while checking permissions',
            });
        }
    };
};
