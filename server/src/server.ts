import app from './app';
import { env } from './config/env';
import { connectDB } from './config/db';
import { runCleanup } from './scripts/cleanupOrphanedFiles';

const startServer = async () => {
  // Connect to MongoDB before accepting incoming requests
  await connectDB();

  const server = app.listen(env.PORT, () => {
    console.log(`[Server] Running on http://localhost:${env.PORT}`);
    console.log(`[Server] Accepting CORS requests from: ${env.CLIENT_URL}`);
    console.log(`[Server] Health check available at: http://localhost:${env.PORT}/api/health`);
  });

  // Schedule automated background ephemeral storage cleanup (100% Free - In-Process)
  // Initial run 30 seconds after boot
  setTimeout(() => {
    runCleanup().catch((err) => console.error('[Background Cleanup Error]', err));
  }, 30 * 1000);

  // Periodic run every 24 hours
  setInterval(() => {
    runCleanup().catch((err) => console.error('[Background Cleanup Error]', err));
  }, 24 * 60 * 60 * 1000);

  return server;
};

const server = startServer();

export default server;
