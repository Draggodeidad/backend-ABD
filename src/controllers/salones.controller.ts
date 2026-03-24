import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';

/**
 * Controller for Salones operations
 */

export const getSalonesByCarrera = async (req: Request, res: Response) => {
    const { carreraId } = req.params;
    const userId = req.user?.id;

    try {
        // 1. Check if user has access to the career
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

        // 2. Fetch salones. The prompt mentions "Los salones pertenecen a una carrera"
        // In the schema, salones are global, but linked via salones_carrera.
        // We will fetch salones linked to this career.
        const { data, error } = await supabaseAdmin
            .from('salones_carrera')
            .select(`
                id,
                es_principal,
                salones (
                    id,
                    nombre,
                    edificio,
                    tipo,
                    activo
                )
            `)
            .eq('carrera_id', carreraId);

        if (error) {
            return res.status(500).json({
                status: 'error',
                message: 'Failed to fetch classrooms',
                details: error.message,
            });
        }

        // Flatten the data for better frontend consumption
        const formattedData = data.map((item: any) => ({
            salones_carrera_id: item.id,
            es_principal: item.es_principal,
            id: item.salones?.id,
            nombre: item.salones?.nombre,
            edificio: item.salones?.edificio,
            tipo: item.salones?.tipo,
            activo: item.salones?.activo,
        }));

        return res.status(200).json({
            status: 'success',
            data: formattedData,
        });
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error while fetching classrooms',
        });
    }
};

export const createSalon = async (req: Request, res: Response) => {
    const { carreraId } = req.params;
    const { nombre, edificio, tipo } = req.body;
    const userId = req.user?.id;

    if (!nombre || !edificio || !tipo) {
        return res.status(400).json({
            status: 'error',
            message: 'Nombre, edificio, and tipo are required',
        });
    }

    if (!['aula', 'laboratorio', 'sala'].includes(tipo)) {
        return res.status(400).json({
            status: 'error',
            message: 'Tipo must be one of: aula, laboratorio, sala',
        });
    }

    try {
        // 1. Authorization
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
                message: 'Forbidden: Only career admins can create classrooms',
            });
        }

        // 2. Insert into salones
        const { data: salonData, error: salonError } = await supabaseAdmin
            .from('salones')
            .insert({
                nombre,
                edificio,
                tipo,
                activo: true,
            })
            .select()
            .single();

        if (salonError) {
            // Uniqueness conflict logic
            if (salonError.code === '23505') {
                return res.status(409).json({
                    status: 'error',
                    message: 'A classroom with this name already exists',
                });
            }
            return res.status(500).json({
                status: 'error',
                message: 'Failed to create classroom',
                details: salonError.message,
            });
        }

        // 3. Link it to the career
        const { error: linkError } = await supabaseAdmin
            .from('salones_carrera')
            .insert({
                salon_id: salonData.id,
                carrera_id: carreraId,
                es_principal: true,
            });

        if (linkError) {
            // Even if linking fails, the salon was created. We could rollback but there's no transaction mechanism via pure REST API.
            // But Supabase backend might not care. Returning 500.
            return res.status(500).json({
                status: 'warning',
                message: 'Classroom created globally but failed to link to career',
                details: linkError.message,
                data: salonData,
            });
        }

        return res.status(201).json({
            status: 'success',
            message: 'Classroom created successfully',
            data: salonData,
        });
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error while creating classroom',
        });
    }
};

export const updateSalon = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { nombre, edificio, tipo, activo } = req.body;
    const userId = req.user?.id;

    if (tipo && !['aula', 'laboratorio', 'sala'].includes(tipo)) {
        return res.status(400).json({
            status: 'error',
            message: 'Tipo must be one of: aula, laboratorio, sala',
        });
    }

    try {
        // 1. Authorization: Verify user is an admin in at least ONE of the careers this salon is linked to,
        // or just verify if the user is a career admin in general (based on RLS requirements).
        // Since the prompt states "Solo los admins pueden gestionarlos", let's check if the user is an admin of ANY career,
        // or specifically the career linked to this salon.
        const { data: links, error: linkError } = await supabaseAdmin
            .from('salones_carrera')
            .select('carrera_id')
            .eq('salon_id', id);

        if (linkError) {
            return res.status(500).json({
                status: 'error',
                message: 'Failed to verify classroom ownership',
            });
        }

        // Check if user is admin in any of the connected careers
        let isAdmin = false;
        if (links && links.length > 0) {
            const carreraIds = links.map(l => l.carrera_id);
            const { data: userRoles } = await supabaseAdmin
                .from('roles_carrera')
                .select('rol')
                .eq('user_id', userId)
                .in('carrera_id', carreraIds)
                .eq('rol', 'admin')
                .limit(1);

            if (userRoles && userRoles.length > 0) {
                isAdmin = true;
            }
        } else {
            // It's a completely orphaned salon? We can restrict it or allow superadmins. Let's deny if not admin.
            // Just basic fallback:
            const { data: anyAdmin } = await supabaseAdmin
                .from('roles_carrera')
                .select('rol')
                .eq('user_id', userId)
                .eq('rol', 'admin')
                .limit(1);
            if (anyAdmin && anyAdmin.length > 0) isAdmin = true;
        }

        if (!isAdmin) {
            return res.status(403).json({
                status: 'error',
                message: 'Forbidden: You must be a career admin to update this classroom',
            });
        }

        // 2. Update salon
        const updates: any = { updated_at: new Date().toISOString() };
        if (nombre !== undefined) updates.nombre = nombre;
        if (edificio !== undefined) updates.edificio = edificio;
        if (tipo !== undefined) updates.tipo = tipo;
        if (activo !== undefined) updates.activo = activo;

        const { data: updatedSalon, error: updateError } = await supabaseAdmin
            .from('salones')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (updateError) {
            if (updateError.code === '23505') {
                return res.status(409).json({
                    status: 'error',
                    message: 'A classroom with this name already exists',
                });
            }
            return res.status(500).json({
                status: 'error',
                message: 'Failed to update classroom',
                details: updateError.message,
            });
        }

        if (!updatedSalon) {
            return res.status(404).json({
                status: 'error',
                message: 'Classroom not found',
            });
        }

        return res.status(200).json({
            status: 'success',
            message: 'Classroom updated successfully',
            data: updatedSalon,
        });
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error while updating classroom',
        });
    }
};

export const deleteSalon = async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;

    try {
        // 1. Authorization: similar to update, check if user is admin in linked careers
        const { data: links } = await supabaseAdmin
            .from('salones_carrera')
            .select('carrera_id')
            .eq('salon_id', id);

        let isAdmin = false;
        if (links && links.length > 0) {
            const carreraIds = links.map(l => l.carrera_id);
            const { data: userRoles } = await supabaseAdmin
                .from('roles_carrera')
                .select('rol')
                .eq('user_id', userId)
                .in('carrera_id', carreraIds)
                .eq('rol', 'admin')
                .limit(1);

            if (userRoles && userRoles.length > 0) isAdmin = true;
        } else {
            const { data: anyAdmin } = await supabaseAdmin
                .from('roles_carrera')
                .select('rol')
                .eq('user_id', userId)
                .eq('rol', 'admin')
                .limit(1);
            if (anyAdmin && anyAdmin.length > 0) isAdmin = true;
        }

        if (!isAdmin) {
            return res.status(403).json({
                status: 'error',
                message: 'Forbidden: You must be a career admin to delete this classroom',
            });
        }

        // 2. Delete salon
        const { error: deleteError } = await supabaseAdmin
            .from('salones')
            .delete()
            .eq('id', id);

        if (deleteError) {
            return res.status(500).json({
                status: 'error',
                message: 'Failed to delete classroom',
                details: deleteError.message,
            });
        }

        return res.status(200).json({
            status: 'success',
            message: 'Classroom deleted successfully',
        });
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error while deleting classroom',
        });
    }
};
