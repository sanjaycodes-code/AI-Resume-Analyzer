import mongoose from 'mongoose';
import { env } from '../config/env';
import { Resume } from '../models/Resume';
import { User } from '../models/User';
import { Analysis } from '../models/Analysis';

async function main() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('--- Connected to MongoDB ---');

    const resumes = await Resume.find({})
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    console.log(`Total recent resumes found: ${resumes.length}\n`);

    if (resumes.length === 0) {
      console.log('No resumes uploaded yet in this database.');
      await mongoose.disconnect();
      return;
    }

    for (let i = 0; i < resumes.length; i++) {
      const r = resumes[i];
      const user = r.userId ? await User.findById(r.userId).lean() : null;
      const analysis = await Analysis.findOne({ resumeId: r._id })
        .sort({ createdAt: -1 })
        .lean();

      const uploaderName = user ? user.name : 'Unknown User';
      const uploaderEmail = user ? user.email : 'No email';
      const skillsCount = r.parsedSections?.skills?.length || 0;
      const charCount = r.extractedText ? r.extractedText.length : 0;
      const uploadedAt = r.createdAt ? new Date(r.createdAt).toLocaleString() : 'N/A';

      console.log(`[#${i + 1}] File: "${r.originalFileName || 'Untitled'}" (${(r.fileType || 'N/A').toUpperCase()})`);
      console.log(`     User: ${uploaderName} (${uploaderEmail})`);
      console.log(`     Date: ${uploadedAt}`);
      console.log(`     Text Size: ~${charCount} characters | Extracted Skills: ${skillsCount}`);
      if (analysis) {
        console.log(`     Latest Analysis: Overall Match: ${analysis.overallScore}/100 | ATS Score: ${analysis.atsScore}/100`);
      } else {
        console.log(`     Latest Analysis: Not yet analyzed`);
      }
      console.log('------------------------------------------------------------');
    }

    await mongoose.disconnect();
    console.log('--- Query Complete ---');
  } catch (err) {
    console.error('Failed to query resumes:', err);
    process.exit(1);
  }
}

main();
