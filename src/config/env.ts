import dotenv from 'dotenv';

dotenv.config();

const getEnv = (key: string, fallback?: string): string => {
    const value = process.env[key] ?? fallback;
    if (value === undefined) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
};

export const env = {
    nodeEnv: getEnv('NODE_ENV', 'development'),
    port: Number(getEnv('PORT', '3000')),
    logLevel: getEnv('LOG_LEVEL', 'info'),
    corsOrigin: getEnv('CORS_ORIGIN', '*') === '*' 
        ? '*' 
        : getEnv('CORS_ORIGIN', '*').split(',').map(o => o.trim()),
    apiPrefix: getEnv('API_PREFIX', '/api/v1'),
    supabase: {
        url: getEnv('SUPABASE_URL'),
        anonKey: getEnv('SUPABASE_ANON_KEY'),
        serviceRoleKey: getEnv('SUPABASE_SERVICE_ROLE_KEY'),
    },
    isDevelopment: (process.env.NODE_ENV ?? 'development') === 'development',
    isProduction: process.env.NODE_ENV === 'production',
};
