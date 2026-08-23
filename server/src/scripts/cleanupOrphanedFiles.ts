/**
 * ==============================================================================
 * Scheduled Storage & Ephemeral File Cleanup Job
 * ==============================================================================
 *
 * PURPOSE:
 * 1. Deletes raw resume PDF/DOCX files from Cloudinary and local storage once they
 *    are older than 48 hours and their extractedText has been safely persisted.
 *    (Sets `fileUrl = null` in MongoDB, keeping all parsed sections and text intact).
 * 2. Audits storage folders against active MongoDB records to detect orphaned files
 *    (logging them for review without blind deletion).
 *
 * HOW TO RUN MANUALLY:
 * - In Development: `npm run cleanup:files` (from server directory)
 * - In Production:  `node dist/scripts/cleanupOrphanedFiles.js`
 *
 * HOW TO SCHEDULE ON RENDER CRON:
 * 1. Open Render Dashboard -> New + -> Cron Job
 * 2. Connect repository and configure environment variables (MONGODB_URI, CLOUDINARY_*, etc.)
 * 3. Set Schedule: `0 3 * * *` (runs every day at 3:00 AM UTC)
 * 4. Set Command: `npm run cleanup:files`
 * ==============================================================================
 */

import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';

// Load environment variables across common paths
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

import { Resume } from '../models/Resume';
import { deleteFile } from '../services/storage.service';

const EXPIRY_HOURS = 48; // Ephemeral raw file retention window
const localUploadDir = path.resolve(process.cwd(), 'uploads', 'resumes');

async function runCleanup() {
  console.log('\n🧹 [Cleanup Job] Starting storage cleanup and audit...');
  console.log(`⏱️  Timestamp: ${new Date().toISOString()}`);

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('❌ [Cleanup Job Error] MONGODB_URI is not set.');
    process.exit(1);
  }

  const shouldManageConnection = mongoose.connection.readyState === 0;

  try {
    if (shouldManageConnection) {
      await mongoose.connect(mongoUri);
      console.log('✅ [Cleanup Job] Connected to MongoDB Atlas.');
    }

    // -------------------------------------------------------------------------
    // Phase 1: Ephemeral File Cleanup (> 48h with extractedText safely stored)
    // -------------------------------------------------------------------------
    const cutoffTime = new Date(Date.now() - EXPIRY_HOURS * 60 * 60 * 1000);
    console.log(`🔍 [Cleanup Job] Searching for resumes created before: ${cutoffTime.toISOString()} with raw files...`);

    const expiredResumes = await Resume.find({
      createdAt: { $lt: cutoffTime },
      fileUrl: { $ne: null, $exists: true },
      extractedText: { $exists: true, $ne: '' },
    });

    console.log(`📋 Found ${expiredResumes.length} resumes eligible for raw file cleanup (> 48h).`);

    let deletedFilesCount = 0;
    for (const resume of expiredResumes) {
      if (resume.fileUrl) {
        try {
          await deleteFile(resume.fileUrl);
          await Resume.updateOne({ _id: resume._id }, { $set: { fileUrl: null } });
          deletedFilesCount++;
          console.log(`   ✓ Purged raw file for resume: ${resume._id} ("${resume.originalFileName}")`);
        } catch (fileErr) {
          console.error(`   ⚠️ Failed to purge file for resume ${resume._id}:`, fileErr);
        }
      }
    }

    console.log(`✅ [Phase 1 Complete] Purged raw storage files for ${deletedFilesCount} resumes.\n`);

    // -------------------------------------------------------------------------
    // Phase 2: Orphaned Storage Audit (Best-effort audit & logging)
    // -------------------------------------------------------------------------
    console.log('🔍 [Phase 2] Auditing storage folders for potential orphaned files...');

    // Audit Local Storage
    if (fs.existsSync(localUploadDir)) {
      const localFiles = await fs.promises.readdir(localUploadDir);
      console.log(`📁 Local storage contains ${localFiles.length} files.`);

      for (const fileName of localFiles) {
        const matchingResume = await Resume.findOne({
          fileUrl: { $regex: fileName },
        });

        if (!matchingResume) {
          console.warn(`   ⚠️ [Audit: Orphaned Local File] "${fileName}" has no matching MongoDB Resume.`);
        }
      }
    }

    // Audit Cloudinary Storage (if configured)
    if (
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    ) {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });

      try {
        const cloudResult = await cloudinary.api.resources({
          type: 'upload',
          prefix: 'ai-resume-analyzer/resumes',
          max_results: 100,
          resource_type: 'raw',
        });

        console.log(`☁️  Cloudinary folder contains ${cloudResult.resources.length} raw assets.`);
        for (const resource of cloudResult.resources) {
          const matchingResume = await Resume.findOne({
            fileUrl: { $regex: resource.public_id },
          });

          if (!matchingResume) {
            console.warn(`   ⚠️ [Audit: Orphaned Cloudinary Asset] "${resource.public_id}" has no active MongoDB Resume.`);
          }
        }
      } catch (cloudErr) {
        console.warn('   ℹ️ Cloudinary resource listing skipped or limited by permissions:', (cloudErr as Error).message);
      }
    }

    console.log('\n🎉 [Cleanup Job] All cleanup tasks and storage audits completed successfully.');
  } catch (err) {
    console.error('❌ [Cleanup Job Fatal Error]', err);
    if (shouldManageConnection) {
      process.exit(1);
    }
  } finally {
    if (shouldManageConnection) {
      await mongoose.disconnect();
      console.log('🔒 Disconnected from MongoDB.\n');
    }
  }
}

// Run immediately when executed as standalone CLI script
if (require.main === module || (process.argv[1] && process.argv[1].endsWith('cleanupOrphanedFiles.ts'))) {
  runCleanup()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { runCleanup };
