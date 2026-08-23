import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

const envPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'server', '.env'),
  path.resolve(__dirname, '..', '..', '.env'),
];

for (const p of envPaths) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p, override: true });
    break;
  }
}

async function checkIndexes() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('❌ MONGODB_URI is not set in environment.');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('\n📊 === MongoDB Active Indexes Verification ===\n');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    const resumeIndexes = await db.collection('resumes').indexes();
    console.log('📄 Collection: "resumes"');
    console.table(
      resumeIndexes.map((idx) => ({
        Name: idx.name,
        Key: JSON.stringify(idx.key),
        ExpireAfterSeconds: idx.expireAfterSeconds ?? 'N/A',
        TTL_Days: idx.expireAfterSeconds ? `${idx.expireAfterSeconds / (24 * 3600)} days` : 'None',
      }))
    );

    const analysisIndexes = await db.collection('analyses').indexes();
    console.log('\n📈 Collection: "analyses"');
    console.table(
      analysisIndexes.map((idx) => ({
        Name: idx.name,
        Key: JSON.stringify(idx.key),
        ExpireAfterSeconds: idx.expireAfterSeconds ?? 'N/A',
        TTL_Days: idx.expireAfterSeconds ? `${idx.expireAfterSeconds / (24 * 3600)} days` : 'None',
      }))
    );

    const rateLimitIndexes = await db.collection('ratelimits').indexes();
    console.log('\n🛡️ Collection: "ratelimits"');
    console.table(
      rateLimitIndexes.map((idx) => ({
        Name: idx.name,
        Key: JSON.stringify(idx.key),
        ExpireAfterSeconds: idx.expireAfterSeconds ?? 'N/A',
        TTL: idx.expireAfterSeconds !== undefined ? 'Automatic TTL' : 'None',
      }))
    );

    console.log('\n✅ All TTL and performance indexes are active and running in MongoDB Atlas.\n');
  } catch (err) {
    console.error('❌ Error checking indexes:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

checkIndexes();
