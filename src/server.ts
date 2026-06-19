import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { WebSocketServer } from 'ws';
import http from 'http';
import { config } from './config';
import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';
import { createApp } from './app';
import { schema } from './graphql';
import { createContext, GraphQLContext } from './graphql/context';
import { createLoaders } from './graphql/loaders';
import {
  depthLimitValidationRule,
  createComplexityPlugin,
  createLoggingPlugin,
  apolloErrorFormatter,
  resolvePersistedQuery,
} from './middleware/graphql.security';
import { verifyAccessToken, extractBearerToken } from './utils/jwt';
import { Request } from 'express';
import { logger } from './logger';

// graphql-ws subpath export requires runtime require under CommonJS moduleResolution
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { useServer } = require('graphql-ws/use/ws') as typeof import('graphql-ws/dist/use/ws');

export async function startServer(): Promise<{
  httpServer: http.Server;
  apolloServer: ApolloServer<GraphQLContext>;
}> {
  await connectDatabase();
  await connectRedis();

  const app = createApp();
  const httpServer = http.createServer(app);

  const wsServer = new WebSocketServer({ server: httpServer, path: '/graphql' });

  const serverCleanup = useServer(
    {
      schema,
      context: (ctx: { connectionParams?: Record<string, unknown> }) => {
        const authHeader = ctx.connectionParams?.authorization as string | undefined;
        const token = extractBearerToken(authHeader);
        let user = null;
        if (token) {
          try {
            user = verifyAccessToken(token);
          } catch {
            user = null;
          }
        }
        return {
          user,
          loaders: createLoaders(),
          req: {} as Request,
        };
      },
    },
    wsServer,
  );

  const apolloServer = new ApolloServer<GraphQLContext>({
    schema,
    validationRules: [depthLimitValidationRule],
    plugins: [
      createComplexityPlugin(),
      createLoggingPlugin(),
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
    ],
    formatError: apolloErrorFormatter,
    persistedQueries: {
      cache: {
        async get(key: string) {
          const result = await resolvePersistedQuery(key);
          return result ?? undefined;
        },
        async set(key: string, value: string) {
          const { cacheService } = await import('./cache/cache.service');
          await cacheService.setPersistedQuery(key, value);
        },
        async delete(_key: string) {
          // no-op
        },
      },
      ttl: 3600,
    },
  });

  await apolloServer.start();

  app.use(
    '/graphql',
    expressMiddleware(apolloServer, {
      context: async ({ req }) => createContext(req),
    }),
  );

  return new Promise((resolve) => {
    httpServer.listen({ port: config.PORT, host: config.HOST }, () => {
      logger.info(`Server ready at http://${config.HOST}:${config.PORT}/graphql`);
      logger.info(`WebSocket subscriptions at ws://${config.HOST}:${config.PORT}/graphql`);
      logger.info(`Swagger docs at http://${config.HOST}:${config.PORT}/api-docs`);
      resolve({ httpServer, apolloServer });
    });
  });
}
