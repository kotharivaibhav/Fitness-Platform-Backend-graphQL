import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './config';
import { authMiddleware, requestLogger } from './middleware/auth.middleware';
import { apiRateLimiter, csrfProtection, errorHandler } from './middleware/security.middleware';
import { generateCsrfToken } from './utils/helpers';

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Fitness Platform API',
      version: '1.0.0',
      description: 'REST endpoints for health checks and CSRF token management',
    },
    servers: [{ url: `http://localhost:${config.PORT}` }],
  },
  apis: ['./src/app.ts'],
});

export function createApp(): express.Application {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: config.CORS_ORIGIN.split(','),
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(requestLogger);
  app.use(apiRateLimiter);
  app.use(authMiddleware);

  /**
   * @openapi
   * /health:
   *   get:
   *     summary: Health check endpoint
   *     tags: [Health]
   *     responses:
   *       200:
   *         description: Service is healthy
   */
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  /**
   * @openapi
   * /csrf-token:
   *   get:
   *     summary: Get CSRF token for mutation requests
   *     tags: [Security]
   *     responses:
   *       200:
   *         description: CSRF token pair
   */
  app.get('/csrf-token', (_req, res) => {
    const token = generateCsrfToken();
    res.json({ csrfToken: token, csrfCookie: token });
  });

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.use(csrfProtection);
  app.use(errorHandler);

  return app;
}
