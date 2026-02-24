import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { logger } from './config/logger';
import { swaggerSpec } from './config/swagger';
import router from './routes';
import { errorHandler } from './middlewares/errorHandler';
import { notFound } from './middlewares/notFound';

const app = express();

// ─── Security ───────────────────────────────────────────────────────────────
app.use(helmet());
app.use(
    cors({
        origin: env.corsOrigin,
        credentials: true,
    }),
);

// ─── Request Logging ─────────────────────────────────────────────────────────
app.use(pinoHttp({ logger }));

// ─── Body Parsers ────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Swagger UI ──────────────────────────────────────────────────────────────
app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
        customSiteTitle: 'back-bda API Docs',
        swaggerOptions: {
            persistAuthorization: true,
        },
    }),
);

// ─── API Routes ──────────────────────────────────────────────────────────────
app.use(env.apiPrefix, router);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use(notFound);

// ─── Error Handler ───────────────────────────────────────────────────────────
app.use(errorHandler);

export default app;
