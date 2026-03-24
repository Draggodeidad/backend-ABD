import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';

/**
 * Controller for Configuracion Carrera operations
 */

export const getConfigByCarrera = async (req: Request, res: Response) => {
    const { carreraId } = req.params;
    const userId = req.user?.id;

    try {
        // 1. Authorization
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

        // 2. Fetch config
        const { data, error } = await supabaseAdmin
            .from('configuracion_carrera')
            .select('*')
            .eq('carrera_id', carreraId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // Not found -> return global defaults or a generic object
                return res.status(200).json({
                    status: 'success',
                    data: {
                        duracion_bloque: 50,
                        hora_inicio: '07:00:00',
                        hora_fin: '15:00:00',
                        receso_matutino_inicio: null,
                        receso_matutino_fin: null,
                        receso_vespertino_inicio: null,
                        receso_vespertino_fin: null,
                    },
                    message: 'Using default configuration as no custom config exists yet.',
                });
            }
            return res.status(500).json({
                status: 'error',
                message: 'Failed to fetch configuration',
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
            message: 'Internal server error while fetching configuration',
        });
    }
};

export const updateConfigByCarrera = async (req: Request, res: Response) => {
    const { carreraId } = req.params;
    const { 
        duracion_bloque, 
        hora_inicio, 
        hora_fin, 
        receso_matutino_inicio, 
        receso_matutino_fin, 
        receso_vespertino_inicio, 
        receso_vespertino_fin 
    } = req.body;
    const userId = req.user?.id;

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
                message: 'Forbidden: Only career admins can update configuration',
            });
        }

        // 2. Validate time logical constraints roughly (optional, DB has CHECK constraints)
        if (duracion_bloque && duracion_bloque <= 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Block duration must be positive',
            });
        }

        // 3. Upsert
        // We use an upsert with onConflict on carrera_id
        const upsertData: any = {
            carrera_id: carreraId,
            ...(duracion_bloque !== undefined && { duracion_bloque }),
            ...(hora_inicio !== undefined && { hora_inicio }),
            ...(hora_fin !== undefined && { hora_fin }),
            ...(receso_matutino_inicio !== undefined && { receso_matutino_inicio }),
            ...(receso_matutino_fin !== undefined && { receso_matutino_fin }),
            ...(receso_vespertino_inicio !== undefined && { receso_vespertino_inicio }),
            ...(receso_vespertino_fin !== undefined && { receso_vespertino_fin }),
            updated_at: new Date().toISOString(),
        };

        const { data: updatedConfig, error: updateError } = await supabaseAdmin
            .from('configuracion_carrera')
            .upsert(upsertData, { onConflict: 'carrera_id' })
            .select()
            .single();

        if (updateError) {
            return res.status(500).json({
                status: 'error',
                message: 'Failed to update configuration',
                details: updateError.message,
            });
        }

        return res.status(200).json({
            status: 'success',
            message: 'Configuration updated successfully',
            data: updatedConfig,
        });
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error while updating configuration',
        });
    }
};
