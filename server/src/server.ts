import app from './app';
import { env } from './config/env';
import { connectDB } from './config/db';

const startServer = async () => {
  // Connect to MongoDB before accepting incoming requests
  await connectDB();

  const server = app.listen(env.PORT, () => {
    console.log(`[Server] Running on http://localhost:${env.PORT}`);
    console.log(`[Server] Accepting CORS requests from: ${env.CLIENT_URL}`);
    console.log(`[Server] Health check available at: http://localhost:${env.PORT}/api/health`);
  });

  return server;
};

const server = startServer();

export default server;
