import { supabaseAdmin } from '../config/supabase';

// ─── Time Helpers ────────────────────────────────────────────────
// Convert "HH:MM" to total minutes from midnight
function timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
}

// Convert total minutes from midnight back to "HH:MM"
function minutesToTime(mins: number): string {
    const h = Math.floor(mins / 60).toString().padStart(2, '0');
    const m = (mins % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
}

// ─── Types ───────────────────────────────────────────────────────
interface Slot {
    day: number;       // 1=Mon ... 5=Fri
    startMin: number;  // minutes from midnight
    endMin: number;
    taken: boolean;
}

interface AsignacionConHoras {
    id: string;
    materia_id: string;
    profesor_id: string;
    materia_nombre: string;
    horas_semanales: number;
    horas_asignadas: number;
    horasFaltantes: number;
}

interface TimeRange {
    startMin: number;
    endMin: number;
}

interface PlacedBlock {
    asignacion_id: string;
    dia_semana: number;
    hora_inicio: string;
    hora_fin: string;
}

interface ScheduleWarning {
    materia: string;
    horasFaltantes: number;
    motivo: string;
}

interface ScheduleResult {
    inserted: PlacedBlock[];
    warnings: ScheduleWarning[];
}

// ─── Step A: Get Group Config ────────────────────────────────────
async function getGrupoConfig(grupoId: string) {
    // Fetch the group (now including turno)
    const { data: grupo, error: grupoError } = await supabaseAdmin
        .from('grupos')
        .select('carrera_id, turno, hora_inicio, hora_fin, duracion_bloque')
        .eq('id', grupoId)
        .single();

    if (grupoError || !grupo) {
        throw new Error('Grupo not found');
    }

    // If any config is NULL, fallback to configuracion_global
    let horaInicio = grupo.hora_inicio;
    let horaFin = grupo.hora_fin;
    let duracionBloque = grupo.duracion_bloque;

    if (!horaInicio || !horaFin || !duracionBloque) {
        const { data: config, error: configError } = await supabaseAdmin
            .from('configuracion_global')
            .select('hora_inicio, hora_fin, duracion_bloque')
            .eq('id', 1)
            .single();

        if (configError || !config) {
            throw new Error('Global config not found');
        }

        horaInicio = horaInicio || config.hora_inicio;
        horaFin = horaFin || config.hora_fin;
        duracionBloque = duracionBloque || config.duracion_bloque;
    }

    return {
        carreraId: grupo.carrera_id as string,
        turno: grupo.turno as string,
        horaInicio: horaInicio as string,
        horaFin: horaFin as string,
        duracionBloque: duracionBloque as number,
    };
}

// ─── Step B: Build Slots Matrix ──────────────────────────────────
// Receso matutino: 09:30 (570 min) a 10:00 (600 min)
const BREAK_START = 570; // 09:30 in minutes from midnight
const BREAK_END   = 600; // 10:00 in minutes from midnight

function buildSlotsMatrix(
    horaInicio: string,
    horaFin: string,
    duracion: number,
    turno: string
): Slot[] {
    const startMin = timeToMinutes(horaInicio);
    const endMin = timeToMinutes(horaFin);
    const hasBreak = turno === 'matutino';
    const slots: Slot[] = [];

    for (let day = 1; day <= 5; day++) {
        let current = startMin;
        while (current + duracion <= endMin) {
            const slotEnd = current + duracion;

            // If matutino and slot overlaps the break window (570–600),
            // skip ahead to 10:00 (600 min) and try again
            if (hasBreak && current < BREAK_END && slotEnd > BREAK_START) {
                current = BREAK_END;
                continue;
            }

            slots.push({
                day,
                startMin: current,
                endMin: slotEnd,
                taken: false,
            });
            current += duracion;
        }
    }

    return slots;
}

// ─── Step C: Get Assignments with Remaining Hours ────────────────
async function getAsignacionesConHoras(grupoId: string): Promise<AsignacionConHoras[]> {
    const { data, error } = await supabaseAdmin
        .from('asignaciones')
        .select(`
            id,
            materia_id,
            profesor_id,
            horas_asignadas,
            materia:materias(nombre, horas_semanales)
        `)
        .eq('grupo_id', grupoId);

    if (error || !data) {
        throw new Error('Failed to fetch assignments');
    }

    return data
        .map((a: any) => ({
            id: a.id,
            materia_id: a.materia_id,
            profesor_id: a.profesor_id,
            materia_nombre: a.materia?.nombre || 'Desconocida',
            horas_semanales: a.materia?.horas_semanales || 0,
            horas_asignadas: a.horas_asignadas || 0,
            horasFaltantes: (a.materia?.horas_semanales || 0) - (a.horas_asignadas || 0),
        }))
        .filter((a: AsignacionConHoras) => a.horasFaltantes > 0);
}

// ─── Step D: Professor Availability Map ──────────────────────────
async function getDisponibilidadMap(
    profesorIds: string[]
): Promise<Map<string, Map<number, TimeRange[]>>> {
    if (profesorIds.length === 0) return new Map();

    const { data, error } = await supabaseAdmin
        .from('disponibilidad_profesores')
        .select('profesor_id, dia_semana, hora_inicio, hora_fin')
        .in('profesor_id', profesorIds);

    if (error || !data) {
        throw new Error('Failed to fetch professor availability');
    }

    const map = new Map<string, Map<number, TimeRange[]>>();

    for (const row of data) {
        if (!map.has(row.profesor_id)) {
            map.set(row.profesor_id, new Map());
        }
        const dayMap = map.get(row.profesor_id)!;
        if (!dayMap.has(row.dia_semana)) {
            dayMap.set(row.dia_semana, []);
        }
        dayMap.get(row.dia_semana)!.push({
            startMin: timeToMinutes(row.hora_inicio),
            endMin: timeToMinutes(row.hora_fin),
        });
    }

    return map;
}

// ─── Step E: Round-Robin Slot Allocation ─────────────────────────
function isProfesorAvailable(
    disponibilidad: Map<string, Map<number, TimeRange[]>>,
    profesorId: string,
    day: number,
    slotStart: number,
    slotEnd: number
): boolean {
    const dayMap = disponibilidad.get(profesorId);
    if (!dayMap) return true; // No availability data = assume available
    const ranges = dayMap.get(day);
    if (!ranges) return false; // Has availability data but not for this day

    // The slot must fall entirely within at least one availability range
    return ranges.some(r => slotStart >= r.startMin && slotEnd <= r.endMin);
}

function allocateSlots(
    slots: Slot[],
    asignaciones: AsignacionConHoras[],
    disponibilidad: Map<string, Map<number, TimeRange[]>>
): { placed: PlacedBlock[]; warnings: ScheduleWarning[] } {
    const placed: PlacedBlock[] = [];
    const warnings: ScheduleWarning[] = [];

    // Track which slots each professor already has (for in-memory conflict check)
    const professorSchedule = new Map<string, { day: number; startMin: number; endMin: number }[]>();

    // Sort assignments: most remaining hours first (greedy approach)
    const sorted = [...asignaciones].sort((a, b) => b.horasFaltantes - a.horasFaltantes);

    for (const asig of sorted) {
        let remaining = asig.horasFaltantes;
        let startDay = 1; // Start round-robin from Monday

        // Keep cycling until we place all hours or exhaust all options
        let stuckCount = 0;
        const maxAttempts = remaining * 5; // Safety valve

        while (remaining > 0 && stuckCount < maxAttempts) {
            const day = ((startDay - 1) % 5) + 1; // Cycle 1→5
            startDay++;

            // Find first free slot on this day for this assignment
            const daySlots = slots.filter(s => s.day === day && !s.taken);

            let placed_this_day = false;

            for (const slot of daySlots) {
                // Check professor availability
                if (!isProfesorAvailable(disponibilidad, asig.profesor_id, day, slot.startMin, slot.endMin)) {
                    continue;
                }

                // Check in-memory professor conflict
                const profBlocks = professorSchedule.get(asig.profesor_id) || [];
                const hasConflict = profBlocks.some(
                    b => b.day === day && b.startMin < slot.endMin && b.endMin > slot.startMin
                );
                if (hasConflict) continue;

                // Place the block
                slot.taken = true;
                profBlocks.push({ day, startMin: slot.startMin, endMin: slot.endMin });
                professorSchedule.set(asig.profesor_id, profBlocks);

                placed.push({
                    asignacion_id: asig.id,
                    dia_semana: day,
                    hora_inicio: minutesToTime(slot.startMin),
                    hora_fin: minutesToTime(slot.endMin),
                });

                remaining--;
                placed_this_day = true;
                break; // Only 1 block per day per subject (round-robin)
            }

            if (!placed_this_day) {
                stuckCount++;
            }
        }

        if (remaining > 0) {
            warnings.push({
                materia: asig.materia_nombre,
                horasFaltantes: remaining,
                motivo: 'Sin disponibilidad de profesor o sin slots libres',
            });
        }
    }

    return { placed, warnings };
}

// ─── Step F: Insert Blocks One-By-One ────────────────────────────
async function insertBloquesOneByOne(
    bloques: PlacedBlock[]
): Promise<{ inserted: PlacedBlock[]; failed: { block: PlacedBlock; reason: string }[] }> {
    const inserted: PlacedBlock[] = [];
    const failed: { block: PlacedBlock; reason: string }[] = [];

    for (const bloque of bloques) {
        const { error } = await supabaseAdmin
            .from('bloques_horario')
            .insert({
                asignacion_id: bloque.asignacion_id,
                dia_semana: bloque.dia_semana,
                hora_inicio: bloque.hora_inicio,
                hora_fin: bloque.hora_fin,
            });

        if (error) {
            failed.push({ block: bloque, reason: error.message });
        } else {
            inserted.push(bloque);
        }
    }

    return { inserted, failed };
}

// ─── Step G: Update horas_asignadas ──────────────────────────────
async function updateHorasAsignadas(insertedBlocks: PlacedBlock[]) {
    // Count how many blocks were placed per asignacion
    const countMap = new Map<string, number>();
    for (const block of insertedBlocks) {
        countMap.set(block.asignacion_id, (countMap.get(block.asignacion_id) || 0) + 1);
    }

    for (const [asignacionId, count] of countMap) {
        // Fetch current value
        const { data: current } = await supabaseAdmin
            .from('asignaciones')
            .select('horas_asignadas')
            .eq('id', asignacionId)
            .single();

        const currentHours = current?.horas_asignadas || 0;

        await supabaseAdmin
            .from('asignaciones')
            .update({ horas_asignadas: currentHours + count })
            .eq('id', asignacionId);
    }
}

// ─── Orchestrator ────────────────────────────────────────────────
export async function generateSchedule(
    grupoId: string,
    regenerar: boolean
): Promise<ScheduleResult> {
    // Step A: Config
    const config = await getGrupoConfig(grupoId);

    // If regenerating, wipe previous blocks
    if (regenerar) {
        await supabaseAdmin
            .from('bloques_horario')
            .delete()
            .eq('grupo_id', grupoId);

        // Also reset horas_asignadas for all assignments in this group
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
    } else {
        // Check if schedule already exists
        const { data: existing } = await supabaseAdmin
            .from('bloques_horario')
            .select('id')
            .eq('grupo_id', grupoId)
            .limit(1);

        if (existing && existing.length > 0) {
            throw new Error('SCHEDULE_EXISTS');
        }
    }

    // Step B: Build slots matrix
    const slots = buildSlotsMatrix(config.horaInicio, config.horaFin, config.duracionBloque, config.turno);

    // Step C: Assignments with remaining hours
    const asignaciones = await getAsignacionesConHoras(grupoId);

    if (asignaciones.length === 0) {
        return { inserted: [], warnings: [{ materia: 'N/A', horasFaltantes: 0, motivo: 'No hay asignaciones pendientes para este grupo' }] };
    }

    // Step D: Professor availability
    const profesorIds = [...new Set(asignaciones.map(a => a.profesor_id))];
    const disponibilidad = await getDisponibilidadMap(profesorIds);

    // Step E: Allocate slots
    const { placed, warnings } = allocateSlots(slots, asignaciones, disponibilidad);

    // Step F: Insert blocks
    const { inserted, failed } = await insertBloquesOneByOne(placed);

    // Add DB-level failures to warnings
    for (const f of failed) {
        warnings.push({
            materia: 'Bloque rechazado por la DB',
            horasFaltantes: 1,
            motivo: f.reason,
        });
    }

    // Step G: Update counters
    await updateHorasAsignadas(inserted);

    return {
        inserted,
        warnings,
    };
}
