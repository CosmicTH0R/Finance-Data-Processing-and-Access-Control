import { env } from './config/env';
import app from './app';
import { prisma } from './config/database';

const PORT = parseInt(env.PORT, 10);

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${env.NODE_ENV} mode`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
const shutdown = async (signal: string) => {
  console.log(`${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    await prisma.$disconnect();
    console.log('Database disconnected. Server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
