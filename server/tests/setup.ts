import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { env } from '../src/config/env';

let mongoServer: MongoMemoryServer | null = null;

beforeAll(async () => {
  // If running in environment with active Atlas connection, connect cleanly to test database namespace
  if (env.MONGODB_URI && env.MONGODB_URI.trim() !== '') {
    const testDbUri = env.MONGODB_URI.includes('?')
      ? env.MONGODB_URI.replace(/\/[^/?]+(\?.*)$/, '/ai-resume-analyzer-test$1')
      : `${env.MONGODB_URI}-test`;
    await mongoose.connect(testDbUri);
  } else {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  }
}, 30000);

afterEach(async () => {
  if (mongoose.connection.db) {
    const collections = await mongoose.connection.db.collections();
    for (const collection of collections) {
      await collection.deleteMany({});
    }
  }
});

afterAll(async () => {
  if (mongoose.connection.db) {
    const collections = await mongoose.connection.db.collections();
    for (const collection of collections) {
      await collection.deleteMany({});
    }
  }
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});
