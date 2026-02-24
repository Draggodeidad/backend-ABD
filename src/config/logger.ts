import pino from 'pino';
import { env } from './env';

export const logger = pino({
    level: env.logLevel,
    ...(env.isDevelopment && {
        transport: {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
                ignore: 'pid,hostname',
            },
        },
    }),
});
