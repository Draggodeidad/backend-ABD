import app from './app';
import { env } from './config/env';
import { logger } from './config/logger';

const server = app.listen(env.port, () => {
    logger.info(`🚀 Server running in ${env.nodeEnv} mode on port ${env.port}`);
    logger.info(`📖 Swagger docs available at http://localhost:${env.port}/api-docs`);
    logger.info(`🔗 API base URL: http://localhost:${env.port}${env.apiPrefix}`);
});

// ─── Graceful Shutdown ───────────────────────────────────────────────────────
const shutdown = (signal: string) => {
    logger.info(`Received ${signal}. Closing server...`);
    server.close(() => {
        logger.info('Server closed gracefully.');
        process.exit(0);
    });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// ─── Unhandled Errors ────────────────────────────────────────────────────────
process.on('uncaughtException', (err) => {
    logger.fatal({ err }, 'Uncaught exception');
    process.exit(1);
});

process.on('unhandledRejection', (reason) => {
    logger.fatal({ reason }, 'Unhandled rejection');
    process.exit(1);
});

export default server;
