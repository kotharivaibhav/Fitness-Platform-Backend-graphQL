import { startServer } from './server';
import { logger } from './logger';
import { disconnectDatabase } from './config/database';
import { disconnectRedis } from './config/redis';

async function main(): Promise<void> {
  const { httpServer } = await startServer();

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received, shutting down gracefully`);
    httpServer.close(async () => {
      await disconnectDatabase();
      await disconnectRedis();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((error) => {
  logger.error('Failed to start server', { error });
  process.exit(1);
});
