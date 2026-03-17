import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';

/**
 * Controller for Asignaciones CRUD operations
 */

export const getAsignacionesByGrupo = async (req: Request, res: Response) => {
    const { grupoId } = req.params;
    const userId = req.user?.id;

    try {
        // 1. Fetch group to get its career
        const { data: grupo, error: grupoError } = await supabaseAdmin
            .from('grupos')
            .select('carrera_id')
            .eq('id', grupoId)
            .single();

        if (grupoError || !grupo) {
            return res.status(404).json({
                status: 'error',
                message: 'Grupo not found',
            });
        }

        // 2. Authorization: Check if user has access to the career
        const { data: roleData, error: roleError } = await supabaseAdmin
            .from('roles_carrera')
            .select('rol')
            .eq('carrera_id', grupo.carrera_id)
            .eq('user_id', userId)
            .single();

        if (roleError || !roleData) {
            return res.status(403).json({
                status: 'error',
                message: 'Forbidden: You do not have access to this career',
            });
        }

        // 3. Fetch asignaciones with JOINs
        const { data, error } = await supabaseAdmin
            .from('asignaciones')
            .select(`
                *,
                materia:materias(*),
                profesor:profesores(*)
            `)
            .eq('grupo_id', grupoId);

        if (error) {
            return res.status(500).json({
                status: 'error',
                message: 'Failed to fetch assignments',
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
            message: 'Internal server error while fetching assignments',
        });
    }
};

export const createAsignacion = async (req: Request, res: Response) => {
    const { grupoId } = req.params;
    const { materia_id, profesor_id } = req.body;
    const userId = req.user?.id;

    if (!materia_id || !profesor_id) {
        return res.status(400).json({
            status: 'error',
            message: 'materia_id and profesor_id are required',
        });
    }

    try {
        // 1. Fetch group and its career
        const { data: grupo, error: grupoError } = await supabaseAdmin
            .from('grupos')
            .select('carrera_id')
            .eq('id', grupoId)
            .single();

        if (grupoError || !grupo) {
            return res.status(404).json({
                status: 'error',
                message: 'Grupo not found',
            });
        }

        const carreraId = grupo.carrera_id;

        // 2. Authorization: User must be admin of the career
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
                message: 'Forbidden: Only career admins can create assignments',
            });
        }

        // 3. Validation: Verify materia_id belongs to the same career
        const { data: materia, error: materiaError } = await supabaseAdmin
            .from('materias')
            .select('id')
            .eq('id', materia_id)
            .eq('carrera_id', carreraId)
            .single();

        if (materiaError || !materia) {
            return res.status(400).json({
                status: 'error',
                message: 'Materia does not exist or does not belong to the group\'s career',
            });
        }

        // 4. Validation: Verify profesor_id belongs to the same career
        const { data: profesor, error: profesorError } = await supabaseAdmin
            .from('profesores_carrera')
            .select('id')
            .eq('profesor_id', profesor_id)
            .eq('carrera_id', carreraId)
            .single();

        if (profesorError || !profesor) {
            return res.status(400).json({
                status: 'error',
                message: 'Profesor does not exist or is not linked to the group\'s career',
            });
        }

        // 5. Insert Asignacion
        const { data: assigned, error: assignError } = await supabaseAdmin
            .from('asignaciones')
            .insert({
                grupo_id: grupoId,
                materia_id,
                profesor_id
            })
            .select(`
                *,
                materia:materias(*),
                profesor:profesores(*)
            `)
            .single();

        if (assignError) {
            // Handle UNIQUE duplicate error (23505 is standard postgres unique violation)
            if (assignError.code === '23505') {
                return res.status(409).json({
                    status: 'error',
                    message: 'This subject is already assigned to this group',
                });
            }
            return res.status(500).json({
                status: 'error',
                message: 'Failed to create assignment',
                details: assignError.message,
            });
        }

        return res.status(201).json({
            status: 'success',
            message: 'Assignment created successfully',
            data: assigned,
        });

    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error while creating assignment',
        });
    }
};

export const updateAsignacion = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { materia_id, profesor_id } = req.body;
    const userId = req.user?.id;

    try {
        // 1. Find the assignment and its group's career
        const { data: asignacion, error: fetchError } = await supabaseAdmin
            .from('asignaciones')
            .select(`
                *,
                grupo:grupos(carrera_id)
            `)
            .eq('id', id)
            .single();

        if (fetchError || !asignacion) {
            return res.status(404).json({
                status: 'error',
                message: 'Assignment not found',
            });
        }

        // Need to assert type since Supabase JS doesn't perfectly type joins deeply
        const carreraId = (asignacion.grupo as any).carrera_id;

        // 2. Authorization: Check if user is admin of the career
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
                message: 'Forbidden: Only career admins can update assignments',
            });
        }

        // 3. If materia_id is changing, validate it belongs to the career
        if (materia_id && materia_id !== asignacion.materia_id) {
            const { data: materia, error: materiaError } = await supabaseAdmin
                .from('materias')
                .select('id')
                .eq('id', materia_id)
                .eq('carrera_id', carreraId)
                .single();

            if (materiaError || !materia) {
                return res.status(400).json({
                    status: 'error',
                    message: 'New Materia does not exist or does not belong to the group\'s career',
                });
            }
        }

        // 4. If profesor_id is changing, validate it is linked to the career
        if (profesor_id && profesor_id !== asignacion.profesor_id) {
            const { data: profesor, error: profesorError } = await supabaseAdmin
                .from('profesores_carrera')
                .select('id')
                .eq('profesor_id', profesor_id)
                .eq('carrera_id', carreraId)
                .single();

            if (profesorError || !profesor) {
                return res.status(400).json({
                    status: 'error',
                    message: 'New Profesor does not exist or is not linked to the group\'s career',
                });
            }
        }

        // 5. Update assignment
        const { data: updatedAsignacion, error: updateError } = await supabaseAdmin
            .from('asignaciones')
            .update({
                materia_id: materia_id || asignacion.materia_id,
                profesor_id: profesor_id || asignacion.profesor_id,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select(`
                *,
                materia:materias(*),
                profesor:profesores(*)
            `)
            .single();

        if (updateError) {
            if (updateError.code === '23505') {
                 return res.status(409).json({
                    status: 'error',
                    message: 'This subject is already assigned to this group',
                });
            }
            return res.status(500).json({
                status: 'error',
                message: 'Failed to update assignment',
                details: updateError.message,
            });
        }

        return res.status(200).json({
            status: 'success',
            message: 'Assignment updated successfully',
            data: updatedAsignacion,
        });

    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error while updating assignment',
        });
    }
};

export const deleteAsignacion = async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;

    try {
        // 1. Find the assignment and its group's career
        const { data: asignacion, error: fetchError } = await supabaseAdmin
            .from('asignaciones')
            .select(`
                grupo:grupos(carrera_id)
            `)
            .eq('id', id)
            .single();

        if (fetchError || !asignacion) {
            return res.status(404).json({
                status: 'error',
                message: 'Assignment not found',
            });
        }

        const carreraId = (asignacion.grupo as any).carrera_id;

        // 2. Authorization: Check if user is admin of the career
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
                message: 'Forbidden: Only career admins can delete assignments',
            });
        }

        // 3. Delete assignment
        const { error: deleteError } = await supabaseAdmin
            .from('asignaciones')
            .delete()
            .eq('id', id);

        if (deleteError) {
            return res.status(500).json({
                status: 'error',
                message: 'Failed to delete assignment',
                details: deleteError.message,
            });
        }

        return res.status(200).json({
            status: 'success',
            message: 'Assignment deleted successfully',
        });
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error while deleting assignment',
        });
    }
};
