import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';

/**
 * Controller for Profesor Availability operations
 */

export const getDisponibilidad = async (req: Request, res: Response) => {
    const { id } = req.params; // Professor ID
    const userId = req.user?.id;

    try {
        // 1. Authorization: Check if user has access to this professor
        const { data: careers, error: careerError } = await supabaseAdmin
            .from('profesores_carrera')
            .select('carrera_id')
            .eq('profesor_id', id);

        if (careerError || !careers || careers.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Professor not found or not linked to any career',
            });
        }

        const careerIds = careers.map(c => c.carrera_id);
        const { data: roleData, error: roleError } = await supabaseAdmin
            .from('roles_carrera')
            .select('carrera_id')
            .in('carrera_id', careerIds)
            .eq('user_id', userId);

        if (roleError || !roleData || roleData.length === 0) {
            return res.status(403).json({
                status: 'error',
                message: 'Forbidden: You do not have access to view this professor\'s availability',
            });
        }

        // 2. Fetch availability
        const { data, error } = await supabaseAdmin
            .from('disponibilidad_profesores')
            .select('*')
            .eq('profesor_id', id)
            .order('dia_semana', { ascending: true })
            .order('hora_inicio', { ascending: true });

        if (error) {
            return res.status(500).json({
                status: 'error',
                message: 'Failed to fetch availability',
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
            message: 'Internal server error while fetching availability',
        });
    }
};

export const createDisponibilidadBatch = async (req: Request, res: Response) => {
    const { id } = req.params; // Professor ID
    const availabilityBlocks: any[] = req.body; // Array of { dia_semana, hora_inicio, hora_fin }
    const userId = req.user?.id;

    if (!Array.isArray(availabilityBlocks) || availabilityBlocks.length === 0) {
        return res.status(400).json({
            status: 'error',
            message: 'An array of availability blocks is required',
        });
    }

    try {
        // 1. Authorization: Check if user is admin in at least one of the professor's careers
        const { data: careers, error: careerError } = await supabaseAdmin
            .from('profesores_carrera')
            .select('carrera_id')
            .eq('profesor_id', id);

        if (careerError || !careers || careers.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Professor not found',
            });
        }

        const careerIds = careers.map(c => c.carrera_id);
        const { data: roleData, error: roleError } = await supabaseAdmin
            .from('roles_carrera')
            .select('carrera_id')
            .in('carrera_id', careerIds)
            .eq('user_id', userId)
            .eq('rol', 'admin');

        if (roleError || !roleData || roleData.length === 0) {
            return res.status(403).json({
                status: 'error',
                message: 'Forbidden: Only career admins can manage availability',
            });
        }

        // 2. Validate blocks
        for (const block of availabilityBlocks) {
            if (!block.dia_semana || !block.hora_inicio || !block.hora_fin) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Each block must have dia_semana, hora_inicio and hora_fin',
                });
            }
            if (block.dia_semana < 1 || block.dia_semana > 5) {
                return res.status(400).json({
                    status: 'error',
                    message: 'dia_semana must be between 1 and 5',
                });
            }
            if (block.hora_inicio >= block.hora_fin) {
                return res.status(400).json({
                    status: 'error',
                    message: `Invalid time range: ${block.hora_inicio} to ${block.hora_fin}`,
                });
            }
            // Assign professor_id to each block
            block.profesor_id = id;
        }

        // 3. Batch Insert
        const { data, error } = await supabaseAdmin
            .from('disponibilidad_profesores')
            .insert(availabilityBlocks)
            .select();

        if (error) {
            return res.status(500).json({
                status: 'error',
                message: 'Failed to save availability blocks',
                details: error.message,
            });
        }

        return res.status(201).json({
            status: 'success',
            message: 'Availability blocks created successfully',
            data,
        });
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error while saving availability',
        });
    }
};

export const deleteDisponibilidadBlock = async (req: Request, res: Response) => {
    const { id } = req.params; // Block ID
    const userId = req.user?.id;

    try {
        // 1. Find professor of the block
        const { data: block, error: blockError } = await supabaseAdmin
            .from('disponibilidad_profesores')
            .select('profesor_id')
            .eq('id', id)
            .single();

        if (blockError || !block) {
            return res.status(404).json({
                status: 'error',
                message: 'Availability block not found',
            });
        }

        // 2. Find professor's careers
        const { data: careers, error: careerError } = await supabaseAdmin
            .from('profesores_carrera')
            .select('carrera_id')
            .eq('profesor_id', block.profesor_id);

        if (careerError || !careers || careers.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Professor associated with this block is not linked to any career',
            });
        }

        // 3. Authorization check
        const careerIds = careers.map(c => c.carrera_id);
        const { data: roleData, error: roleError } = await supabaseAdmin
            .from('roles_carrera')
            .select('carrera_id')
            .in('carrera_id', careerIds)
            .eq('user_id', userId)
            .eq('rol', 'admin');

        if (roleError || !roleData || roleData.length === 0) {
            return res.status(403).json({
                status: 'error',
                message: 'Forbidden: Only career admins can delete availability blocks',
            });
        }

        // 4. Delete the block
        const { error: deleteError } = await supabaseAdmin
            .from('disponibilidad_profesores')
            .delete()
            .eq('id', id);

        if (deleteError) {
            return res.status(500).json({
                status: 'error',
                message: 'Failed to delete availability block',
                details: deleteError.message,
            });
        }

        return res.status(200).json({
            status: 'success',
            message: 'Availability block deleted successfully',
        });
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error while deleting availability block',
        });
    }
};
