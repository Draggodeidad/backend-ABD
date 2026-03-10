import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';

/**
 * Controller for Profesores CRUD operations
 */

export const listProfesores = async (req: Request, res: Response) => {
    const userId = req.user?.id;

    try {
        // 1. Get career IDs where the user has a role
        const { data: roles, error: roleError } = await supabaseAdmin
            .from('roles_carrera')
            .select('carrera_id')
            .eq('user_id', userId);

        if (roleError || !roles || roles.length === 0) {
            return res.status(200).json({
                status: 'success',
                data: [],
            });
        }

        const careerIds = roles.map(r => r.carrera_id);

        // 2. List professors linked to those careers
        const { data, error } = await supabaseAdmin
            .from('profesores')
            .select(`
                *,
                profesores_carrera!inner(carrera_id)
            `)
            .in('profesores_carrera.carrera_id', careerIds);

        if (error) {
            return res.status(500).json({
                status: 'error',
                message: 'Failed to fetch professors',
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
            message: 'Internal server error while fetching professors',
        });
    }
};

export const createProfesor = async (req: Request, res: Response) => {
    const { nombre_completo, email, carrera_id } = req.body;
    const userId = req.user?.id;

    if (!nombre_completo || !carrera_id) {
        return res.status(400).json({
            status: 'error',
            message: 'Nombre completo and carrera_id are required',
        });
    }

    try {
        // 1. Authorization: Check if user is admin of the career
        const { data: roleData, error: roleError } = await supabaseAdmin
            .from('roles_carrera')
            .select('rol')
            .eq('carrera_id', carrera_id)
            .eq('user_id', userId)
            .eq('rol', 'admin')
            .single();

        if (roleError || !roleData) {
            return res.status(403).json({
                status: 'error',
                message: 'Forbidden: Only career admins can add professors',
            });
        }

        // 2. Check if professor already exists by email
        let professorId: string;
        let professorData: any;

        if (email) {
            const { data: existingProf } = await supabaseAdmin
                .from('profesores')
                .select('*')
                .eq('email', email)
                .maybeSingle();

            if (existingProf) {
                professorId = existingProf.id;
                professorData = existingProf;
            }
        }

        // 3. If not found, create new professor
        if (!professorId!) {
            const { data: newProf, error: profError } = await supabaseAdmin
                .from('profesores')
                .insert({ nombre_completo, email })
                .select()
                .single();

            if (profError || !newProf) {
                return res.status(500).json({
                    status: 'error',
                    message: 'Failed to create professor',
                    details: profError?.message,
                });
            }
            professorId = newProf.id;
            professorData = newProf;
        }

        // 4. Link professor to career (using upsert to avoid error if already linked)
        const { error: linkError } = await supabaseAdmin
            .from('profesores_carrera')
            .upsert({
                profesor_id: professorId,
                carrera_id: carrera_id
            }, { onConflict: 'profesor_id, carrera_id' });

        if (linkError) {
            return res.status(500).json({
                status: 'error',
                message: 'Failed to link professor to career',
                details: linkError.message,
            });
        }

        return res.status(201).json({
            status: 'success',
            message: 'Professor processed and linked to career',
            data: professorData,
        });
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error while processing professor',
        });
    }
};

export const updateProfesor = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { nombre_completo, email, activo } = req.body;
    const userId = req.user?.id;

    try {
        // 1. Check if user is admin in at least one of the professor's careers
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
            .eq('user_id', userId)
            .eq('rol', 'admin');

        if (roleError || !roleData || roleData.length === 0) {
            return res.status(403).json({
                status: 'error',
                message: 'Forbidden: You do not have admin permissions for this professor',
            });
        }

        // 2. Update professor
        const { data: updatedProfesor, error: updateError } = await supabaseAdmin
            .from('profesores')
            .update({ nombre_completo, email, activo, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (updateError) {
            return res.status(500).json({
                status: 'error',
                message: 'Failed to update professor',
                details: updateError.message,
            });
        }

        return res.status(200).json({
            status: 'success',
            message: 'Professor updated successfully',
            data: updatedProfesor,
        });
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error while updating professor',
        });
    }
};

export const deleteProfesor = async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;

    try {
        // 1. Check if user is admin in at least one of the professor's careers
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
                message: 'Forbidden: Only career admins can delete professors',
            });
        }

        // 2. Delete the professor (cascades to disponibilidad and links)
        const { error: deleteError } = await supabaseAdmin
            .from('profesores')
            .delete()
            .eq('id', id);

        if (deleteError) {
            return res.status(500).json({
                status: 'error',
                message: 'Failed to delete professor',
                details: deleteError.message,
            });
        }

        return res.status(200).json({
            status: 'success',
            message: 'Professor deleted successfully',
        });
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error while deleting professor',
        });
    }
};
