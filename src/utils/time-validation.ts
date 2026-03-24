const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Cuadrícula de horarios válidos por turno.
 * Cada tiempo marca un corte de bloque de 50 min donde una clase puede iniciar o terminar.
 *
 * Matutino  — 07:00‑15:00, receso 09:30‑10:00
 * Vespertino — 13:20‑20:00, sin receso
 */
const VALID_TIMES: Record<string, string[]> = {
    matutino: [
        '07:00', '07:50', '08:40', '09:30',
        '10:00', '10:50', '11:40', '12:30',
        '13:20', '14:10', '15:00',
    ],
    vespertino: [
        '13:20', '14:10', '15:00', '15:50',
        '16:40', '17:30', '18:20', '19:10', '20:00',
    ],
};

const TURNO_LIMITS: Record<string, { min: string; max: string }> = {
    matutino:   { min: '07:00', max: '15:00' },
    vespertino: { min: '13:20', max: '20:00' },
};

export interface TimeValidationResult {
    valid: boolean;
    message?: string;
}

export function validateGrupoSchedule(
    turno: string,
    hora_inicio?: string,
    hora_fin?: string,
): TimeValidationResult {
    if (!hora_inicio && !hora_fin) {
        return { valid: true };
    }

    if (!hora_inicio || !hora_fin) {
        return {
            valid: false,
            message: 'hora_inicio y hora_fin deben enviarse juntos o no enviarse',
        };
    }

    if (!TIME_REGEX.test(hora_inicio)) {
        return { valid: false, message: 'hora_inicio no tiene formato válido (HH:mm)' };
    }
    if (!TIME_REGEX.test(hora_fin)) {
        return { valid: false, message: 'hora_fin no tiene formato válido (HH:mm)' };
    }

    if (hora_inicio >= hora_fin) {
        return { valid: false, message: 'hora_inicio debe ser anterior a hora_fin' };
    }

    const limits = TURNO_LIMITS[turno];
    if (!limits) {
        return { valid: false, message: `Turno "${turno}" no es válido (matutino | vespertino)` };
    }

    if (hora_inicio < limits.min || hora_inicio > limits.max) {
        return {
            valid: false,
            message: `hora_inicio fuera del rango del turno ${turno} (${limits.min}–${limits.max})`,
        };
    }
    if (hora_fin < limits.min || hora_fin > limits.max) {
        return {
            valid: false,
            message: `hora_fin fuera del rango del turno ${turno} (${limits.min}–${limits.max})`,
        };
    }

    const grid = VALID_TIMES[turno];

    if (!grid.includes(hora_inicio)) {
        return {
            valid: false,
            message: `hora_inicio "${hora_inicio}" no coincide con un corte de módulo válido para el turno ${turno}. Valores permitidos: ${grid.join(', ')}`,
        };
    }
    if (!grid.includes(hora_fin)) {
        return {
            valid: false,
            message: `hora_fin "${hora_fin}" no coincide con un corte de módulo válido para el turno ${turno}. Valores permitidos: ${grid.join(', ')}`,
        };
    }

    return { valid: true };
}
