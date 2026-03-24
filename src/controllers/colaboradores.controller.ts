import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';

/**
 * Controller for Colaboradores (roles_carrera) operations
 */

export const getColaboradoresPorCarrera = async (req: Request, res: Response) => {
    const { carreraId } = req.params;
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

        // 2. Fetch collaborators with profile data
        const { data, error } = await supabaseAdmin
            .from('roles_carrera')
            .select(`
                id,
                rol,
                created_at,
                carrera_id,
                user_id,
                profiles:user_id (
                    email,
                    full_name,
                    avatar_url
                )
            `)
            .eq('carrera_id', carreraId)
            .order('created_at', { ascending: true });

        if (error) {
            return res.status(500).json({
                status: 'error',
                message: 'Failed to fetch collaborators',
                details: error.message,
            });
        }

        // Flatten the profiles object for easier consumption by the frontend
        const formattedData = data.map((item: any) => ({
            id: item.id,
            carrera_id: item.carrera_id,
            user_id: item.user_id,
            rol: item.rol,
            created_at: item.created_at,
            email: item.profiles?.email,
            full_name: item.profiles?.full_name,
            avatar_url: item.profiles?.avatar_url,
        }));

        return res.status(200).json({
            status: 'success',
            data: formattedData,
        });
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error while fetching collaborators',
        });
    }
};

export const agregarColaborador = async (req: Request, res: Response) => {
    const { carreraId } = req.params;
    const { email, rol } = req.body;
    const userId = req.user?.id;

    if (!email || !rol) {
        return res.status(400).json({
            status: 'error',
            message: 'Email and rol are required',
        });
    }

    if (!['admin', 'viewer'].includes(rol)) {
        return res.status(400).json({
            status: 'error',
            message: 'Rol must be admin or viewer',
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
                message: 'Forbidden: Only career admins can add collaborators',
            });
        }

        // 2. Find user in profiles by email
        const { data: profileData, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('email', email)
            .single();

        if (profileError || !profileData) {
            return res.status(404).json({
                status: 'error',
                message: 'User with the specified email does not exist in the platform',
            });
        }

        // 3. Prevent adding the same user twice
        const { data: existingRole } = await supabaseAdmin
            .from('roles_carrera')
            .select('id')
            .eq('carrera_id', carreraId)
            .eq('user_id', profileData.id)
            .single();

        if (existingRole) {
            return res.status(400).json({
                status: 'error',
                message: 'User is already a collaborator in this career',
            });
        }

        // 4. Insert role
        const { data, error } = await supabaseAdmin
            .from('roles_carrera')
            .insert({
                carrera_id: carreraId,
                user_id: profileData.id,
                rol,
            })
            .select()
            .single();

        if (error) {
            return res.status(500).json({
                status: 'error',
                message: 'Failed to add collaborator',
                details: error.message,
            });
        }

        return res.status(201).json({
            status: 'success',
            message: 'Collaborator added successfully',
            data,
        });
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error while adding collaborator',
        });
    }
};

export const actualizarColaborador = async (req: Request, res: Response) => {
    const { id } = req.params; // roles_carrera ID
    const { rol } = req.body;
    const userId = req.user?.id;

    if (!rol || !['admin', 'viewer'].includes(rol)) {
        return res.status(400).json({
            status: 'error',
            message: 'Valid rol is required (admin or viewer)',
        });
    }

    try {
        // 1. Fetch the collaborator record to find out which career it belongs to
        const { data: colabRecord, error: colabError } = await supabaseAdmin
            .from('roles_carrera')
            .select('carrera_id, user_id, rol')
            .eq('id', id)
            .single();

        if (colabError || !colabRecord) {
            return res.status(404).json({
                status: 'error',
                message: 'Collaborator not found',
            });
        }

        // 2. Authorization: Check if requester is admin of the career
        const { data: roleData, error: roleError } = await supabaseAdmin
            .from('roles_carrera')
            .select('rol')
            .eq('carrera_id', colabRecord.carrera_id)
            .eq('user_id', userId)
            .eq('rol', 'admin')
            .single();

        if (roleError || !roleData) {
            return res.status(403).json({
                status: 'error',
                message: 'Forbidden: Only career admins can update collaborators',
            });
        }

        // 3. Avoid removing admin from oneself if they are the only admin
        if (colabRecord.user_id === userId && rol === 'viewer') {
            // Count total admins
            const { count, error: countError } = await supabaseAdmin
                .from('roles_carrera')
                .select('*', { count: 'exact', head: true })
                .eq('carrera_id', colabRecord.carrera_id)
                .eq('rol', 'admin');

            if (countError) {
                console.error(countError);
                return res.status(500).json({
                    status: 'error',
                    message: 'Error verifying admins count',
                });
            }

            if (count !== null && count <= 1) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Cannot demote the only admin of the career',
                });
            }
        }

        // 4. Update role
        const { data: updatedColab, error: updateError } = await supabaseAdmin
            .from('roles_carrera')
            .update({ rol })
            .eq('id', id)
            .select()
            .single();

        if (updateError) {
            return res.status(500).json({
                status: 'error',
                message: 'Failed to update collaborator',
                details: updateError.message,
            });
        }

        return res.status(200).json({
            status: 'success',
            message: 'Collaborator updated successfully',
            data: updatedColab,
        });
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error while updating collaborator',
        });
    }
};

export const eliminarColaborador = async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;

    try {
        // 1. Fetch the collaborator record
        const { data: colabRecord, error: colabError } = await supabaseAdmin
            .from('roles_carrera')
            .select('carrera_id, user_id, rol')
            .eq('id', id)
            .single();

        if (colabError || !colabRecord) {
            return res.status(404).json({
                status: 'error',
                message: 'Collaborator not found',
            });
        }

        // 2. Authorization: Check if requester is admin of the career
        const { data: roleData, error: roleError } = await supabaseAdmin
            .from('roles_carrera')
            .select('rol')
            .eq('carrera_id', colabRecord.carrera_id)
            .eq('user_id', userId)
            .eq('rol', 'admin')
            .single();

        if (roleError || !roleData) {
            return res.status(403).json({
                status: 'error',
                message: 'Forbidden: Only career admins can remove collaborators',
            });
        }

        // 3. Avoid deleting oneself if they are the only admin
        if (colabRecord.user_id === userId && colabRecord.rol === 'admin') {
            const { count, error: countError } = await supabaseAdmin
                .from('roles_carrera')
                .select('*', { count: 'exact', head: true })
                .eq('carrera_id', colabRecord.carrera_id)
                .eq('rol', 'admin');

            if (countError) {
                console.error(countError);
                return res.status(500).json({
                    status: 'error',
                    message: 'Error verifying admins count',
                });
            }

            if (count !== null && count <= 1) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Cannot delete the only admin of the career',
                });
            }
        }

        // 4. Delete role
        const { error: deleteError } = await supabaseAdmin
            .from('roles_carrera')
            .delete()
            .eq('id', id);

        if (deleteError) {
            return res.status(500).json({
                status: 'error',
                message: 'Failed to remove collaborator',
                details: deleteError.message,
            });
        }

        return res.status(200).json({
            status: 'success',
            message: 'Collaborator removed successfully',
        });
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error while removing collaborator',
        });
    }
};
