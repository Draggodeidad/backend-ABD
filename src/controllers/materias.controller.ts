import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';

/**
 * Controller for Materias CRUD operations
 */

export const getMateriasByCarrera = async (req: Request, res: Response) => {
    const { carreraId } = req.params;
    const { grado } = req.query;
    const userId = req.user?.id;

    try {
        // 1. Authorization: Check if user has access to the career
        const { data: roleData, error: roleError } = await supabaseAdmin
            .from('roles_carrera')
            .select('rol')
            .eq('carrera_id', carreraId)
            .eq('user_id', userId)
            .single();

        if (roleError || !roleData) {
            return res.status(403).json({
                status: 'error',
                message: 'Forbidden: You do not have access to this career',
            });
        }

        // 2. Build query
        let query = supabaseAdmin
            .from('materias')
            .select('*')
            .eq('carrera_id', carreraId);

        // Optional filter by grado
        if (grado) {
            const gradoNum = parseInt(grado as string, 10);
            if (!isNaN(gradoNum)) {
                query = query.eq('grado', gradoNum);
            }
        }

        const { data, error } = await query
            .order('grado', { ascending: true })
            .order('nombre', { ascending: true });

        if (error) {
            return res.status(500).json({
                status: 'error',
                message: 'Failed to fetch subjects',
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
            message: 'Internal server error while fetching subjects',
        });
    }
};

export const createMateria = async (req: Request, res: Response) => {
    const { carreraId } = req.params;
    const { nombre, codigo, grado, horas_semanales } = req.body;
    const userId = req.user?.id;

    if (!nombre || !grado || !horas_semanales) {
        return res.status(400).json({
            status: 'error',
            message: 'Nombre, grado and horas_semanales are required',
        });
    }

    // Basic validation for integers
    if (grado <= 0 || horas_semanales <= 0) {
        return res.status(400).json({
            status: 'error',
            message: 'Grado and horas_semanales must be positive integers',
        });
    }

    try {
        // 1. Authorization: Check if user is admin of the career
        const { data: roleData, error: roleError } = await supabaseAdmin
            .from('roles_carrera')
            .select('rol')
            .eq('carrera_id', carreraId)
            .eq('user_id', userId)
            .eq('rol', 'admin')
            .single();

        if (roleError || !roleData) {
            return res.status(403).json({
                status: 'error',
                message: 'Forbidden: Only career admins can create subjects',
            });
        }

        // 2. Insert subject
        const { data, error } = await supabaseAdmin
            .from('materias')
            .insert({
                carrera_id: carreraId,
                nombre,
                codigo: codigo || null,
                grado,
                horas_semanales,
            })
            .select()
            .single();

        if (error) {
            return res.status(500).json({
                status: 'error',
                message: 'Failed to create subject',
                details: error.message,
            });
        }

        return res.status(201).json({
            status: 'success',
            message: 'Subject created successfully',
            data,
        });
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error while creating subject',
        });
    }
};

export const updateMateria = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { nombre, codigo, grado, horas_semanales } = req.body;
    const userId = req.user?.id;

    try {
        // 1. Find the career of the subject
        const { data: materia, error: fetchError } = await supabaseAdmin
            .from('materias')
            .select('carrera_id')
            .eq('id', id)
            .single();

        if (fetchError || !materia) {
            return res.status(404).json({
                status: 'error',
                message: 'Subject not found',
            });
        }

        // 2. Authorization: Check if user is admin of the career
        const { data: roleData, error: roleError } = await supabaseAdmin
            .from('roles_carrera')
            .select('rol')
            .eq('carrera_id', materia.carrera_id)
            .eq('user_id', userId)
            .eq('rol', 'admin')
            .single();

        if (roleError || !roleData) {
            return res.status(403).json({
                status: 'error',
                message: 'Forbidden: Only career admins can update subjects',
            });
        }

        // 3. Update subject
        const { data: updatedMateria, error: updateError } = await supabaseAdmin
            .from('materias')
            .update({
                nombre,
                codigo,
                grado,
                horas_semanales,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (updateError) {
            return res.status(500).json({
                status: 'error',
                message: 'Failed to update subject',
                details: updateError.message,
            });
        }

        return res.status(200).json({
            status: 'success',
            message: 'Subject updated successfully',
            data: updatedMateria,
        });
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error while updating subject',
        });
    }
};

export const deleteMateria = async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;

    try {
        // 1. Find the career of the subject
        const { data: materia, error: fetchError } = await supabaseAdmin
            .from('materias')
            .select('carrera_id')
            .eq('id', id)
            .single();

        if (fetchError || !materia) {
            return res.status(404).json({
                status: 'error',
                message: 'Subject not found',
            });
        }

        // 2. Authorization: Check if user is admin of the career
        const { data: roleData, error: roleError } = await supabaseAdmin
            .from('roles_carrera')
            .select('rol')
            .eq('carrera_id', materia.carrera_id)
            .eq('user_id', userId)
            .eq('rol', 'admin')
            .single();

        if (roleError || !roleData) {
            return res.status(403).json({
                status: 'error',
                message: 'Forbidden: Only career admins can delete subjects',
            });
        }

        // 3. Delete subject
        const { error: deleteError } = await supabaseAdmin
            .from('materias')
            .delete()
            .eq('id', id);

        if (deleteError) {
            return res.status(500).json({
                status: 'error',
                message: 'Failed to delete subject',
                details: deleteError.message,
            });
        }

        return res.status(200).json({
            status: 'success',
            message: 'Subject deleted successfully',
        });
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error while deleting subject',
        });
    }
};
