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
    corsOrigin: getEnv('CORS_ORIGIN', '*'),
    apiPrefix: getEnv('API_PREFIX', '/api/v1'),
    isDevelopment: (process.env.NODE_ENV ?? 'development') === 'development',
    isProduction: process.env.NODE_ENV === 'production',
};
