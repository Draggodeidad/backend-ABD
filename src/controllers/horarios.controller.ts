import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { generateSchedule } from '../services/schedulerService';

const DAY_NAMES: Record<number, string> = {
    1: 'lunes',
    2: 'martes',
    3: 'miercoles',
    4: 'jueves',
    5: 'viernes',
};

/**
 * Controller for Horarios (Schedule) operations.
 * Business logic lives in schedulerService.ts.
 */

export const generateHorario = async (req: Request, res: Response) => {
    const { grupoId } = req.params;
    const regenerar = req.query.regenerar === 'true';
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

        // 2. Authorization: User must be admin of the career
        const { data: roleData, error: roleError } = await supabaseAdmin
            .from('roles_carrera')
            .select('rol')
            .eq('carrera_id', grupo.carrera_id)
            .eq('user_id', userId)
            .eq('rol', 'admin')
            .single();

        if (roleError || !roleData) {
            return res.status(403).json({
                status: 'error',
                message: 'Forbidden: Only career admins can generate schedules',
            });
        }

        // 3. Delegate to service
        const result = await generateSchedule(grupoId as string, regenerar);

        const statusCode = result.warnings.length > 0 ? 207 : 200;

        return res.status(statusCode).json({
            status: 'success',
            message: `Schedule generated: ${result.inserted.length} blocks placed`,
            data: result.inserted,
            warnings: result.warnings,
        });
    } catch (error: any) {
        if (error.message === 'SCHEDULE_EXISTS') {
            return res.status(400).json({
                status: 'error',
                message: 'Schedule already exists for this group. Use ?regenerar=true to regenerate.',
            });
        }
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error while generating schedule',
            details: error.message,
        });
    }
};

export const getHorario = async (req: Request, res: Response) => {
    const { grupoId } = req.params;
    const userId = req.user?.id;

    try {
        // 1. Fetch group to get its career AND turno
        const { data: grupo, error: grupoError } = await supabaseAdmin
            .from('grupos')
            .select('carrera_id, turno')
            .eq('id', grupoId)
            .single();

        if (grupoError || !grupo) {
            return res.status(404).json({
                status: 'error',
                message: 'Grupo not found',
            });
        }

        // 2. Authorization: Check user has access to the career
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

        // 3. Fetch blocks with joins
        const { data: bloques, error } = await supabaseAdmin
            .from('bloques_horario')
            .select(`
                id,
                dia_semana,
                hora_inicio,
                hora_fin,
                salon_id,
                notas,
                asignacion:asignaciones(
                    id,
                    materia:materias(nombre, codigo),
                    profesor:profesores(nombre_completo, email)
                )
            `)
            .eq('grupo_id', grupoId)
            .order('hora_inicio', { ascending: true });

        if (error) {
            return res.status(500).json({
                status: 'error',
                message: 'Failed to fetch schedule',
                details: error.message,
            });
        }

        // 4. Group blocks by day name, adding tipo: 'clase'
        const schedule: Record<string, any[]> = {
            lunes: [],
            martes: [],
            miercoles: [],
            jueves: [],
            viernes: [],
        };

        for (const bloque of bloques || []) {
            const dayName = DAY_NAMES[bloque.dia_semana] || 'desconocido';
            const asig = bloque.asignacion as any;

            schedule[dayName]?.push({
                id: bloque.id,
                tipo: 'clase',
                hora_inicio: bloque.hora_inicio,
                hora_fin: bloque.hora_fin,
                materia: asig?.materia?.nombre || null,
                codigo: asig?.materia?.codigo || null,
                profesor: asig?.profesor?.nombre_completo || null,
                salon_id: bloque.salon_id,
                notas: bloque.notas,
            });
        }

        // 5. Inject synthetic receso block for matutino shifts
        if (grupo.turno === 'matutino') {
            const recesoBlock = {
                id: null,
                tipo: 'receso',
                hora_inicio: '09:30',
                hora_fin: '10:00',
                materia: null,
                codigo: null,
                profesor: null,
                salon_id: null,
                notas: 'Receso',
            };

            for (const dayKey of Object.keys(schedule)) {
                schedule[dayKey].push({ ...recesoBlock });
                // Re-sort by hora_inicio so receso sits in the right position
                schedule[dayKey].sort((a: any, b: any) =>
                    a.hora_inicio.localeCompare(b.hora_inicio)
                );
            }
        }

        return res.status(200).json({
            status: 'success',
            data: schedule,
        });
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error while fetching schedule',
        });
    }
};

export const deleteHorario = async (req: Request, res: Response) => {
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

        // 2. Authorization: User must be admin
        const { data: roleData, error: roleError } = await supabaseAdmin
            .from('roles_carrera')
            .select('rol')
            .eq('carrera_id', grupo.carrera_id)
            .eq('user_id', userId)
            .eq('rol', 'admin')
            .single();

        if (roleError || !roleData) {
            return res.status(403).json({
                status: 'error',
                message: 'Forbidden: Only career admins can delete schedules',
            });
        }

        // 3. Reset horas_asignadas before deleting blocks
        const { data: asigs } = await supabaseAdmin
            .from('asignaciones')
            .select('id')
            .eq('grupo_id', grupoId);

        if (asigs && asigs.length > 0) {
            for (const asig of asigs) {
                await supabaseAdmin
                    .from('asignaciones')
                    .update({ horas_asignadas: 0 })
                    .eq('id', asig.id);
            }
        }

        // 4. Delete all blocks
        const { error: deleteError } = await supabaseAdmin
            .from('bloques_horario')
            .delete()
            .eq('grupo_id', grupoId);

        if (deleteError) {
            return res.status(500).json({
                status: 'error',
                message: 'Failed to delete schedule',
                details: deleteError.message,
            });
        }

        return res.status(200).json({
            status: 'success',
            message: 'Schedule deleted successfully',
        });
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error while deleting schedule',
        });
    }
};
