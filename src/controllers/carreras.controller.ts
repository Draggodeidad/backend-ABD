import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';

/**
 * Controller for Carreras CRUD operations
 */
export const getCarreras = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;

        // List careers where the user has a role
        const { data, error } = await supabaseAdmin
            .from('carreras')
            .select(`
                id,
                nombre,
                color,
                created_at,
                roles_carrera!inner(rol)
            `)
            .eq('roles_carrera.user_id', userId);

        if (error) {
            return res.status(500).json({
                status: 'error',
                message: 'Failed to fetch careers',
                details: error.message,
            });
        }

        return res.status(200).json({
            status: 'success',
            data,
        });
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error while fetching careers',
        });
    }
};

export const createCarrera = async (req: Request, res: Response) => {
    const { nombre, color } = req.body;
    const userId = req.user?.id;

    if (!nombre) {
        return res.status(400).json({
            status: 'error',
            message: 'Nombre is required',
        });
    }

    try {
        // Create career and assign role in a single atomic database operation (RPC)
        // This bypasses RLS issues by using a SECURITY DEFINER function.
        const { data: carrera, error } = await supabaseAdmin.rpc('create_career_with_admin', {
            p_nombre: nombre,
            p_color: color || '#3B82F6',
            p_user_id: userId,
        });

        if (error) {
            return res.status(500).json({
                status: 'error',
                message: 'Failed to create career',
                details: error.message,
            });
        }

        return res.status(201).json({
            status: 'success',
            message: 'Career created and admin role assigned',
            data: carrera,
        });
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error while creating career',
        });
    }
};

export const updateCarrera = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { nombre, color } = req.body;

    try {
        const { data, error } = await supabaseAdmin
            .from('carreras')
            .update({ nombre, color, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return res.status(500).json({
                status: 'error',
                message: 'Failed to update career',
                details: error.message,
            });
        }

        return res.status(200).json({
            status: 'success',
            message: 'Career updated successfully',
            data,
        });
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error while updating career',
        });
    }
};

export const deleteCarrera = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const { error } = await supabaseAdmin
            .from('carreras')
            .delete()
            .eq('id', id);

        if (error) {
            // Check for foreign key constraints or other DB errors
            if (error.code === '23503') {
                return res.status(400).json({
                    status: 'error',
                    message: 'Cannot delete career: It has associated data (groups, materials, etc.)',
                });
            }

            return res.status(500).json({
                status: 'error',
                message: 'Failed to delete career',
                details: error.message,
            });
        }

        return res.status(200).json({
            status: 'success',
            message: 'Career deleted successfully',
        });
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error while deleting career',
        });
    }
};
