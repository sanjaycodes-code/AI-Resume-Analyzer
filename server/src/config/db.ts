import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri || mongoUri.trim() === '') {
    console.error('[Database Error] MONGODB_URI is not defined in environment variables.');
    console.error('Please configure MONGODB_URI in server/.env before starting the server.');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(mongoUri);
    console.log(`[Database] MongoDB connected successfully: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[Database Error] Failed to connect to MongoDB: ${errorMessage}`);
    process.exit(1);
  }
};

export default connectDB;
