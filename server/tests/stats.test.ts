import request from 'supertest';
import app from '../src/app';
import { Resume } from '../src/models/Resume';
import { Analysis } from '../src/models/Analysis';
import mongoose from 'mongoose';

describe('Public Stats Endpoint (GET /api/stats)', () => {
  it('returns status 200 and real counts of resumes and analyses', async () => {
    const res = await request(app).get('/api/stats');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(typeof res.body.data.totalResumes).toBe('number');
    expect(typeof res.body.data.totalAnalyses).toBe('number');
  });

  it('accurately reflects created documents in count', async () => {
    const dummyUserId = new mongoose.Types.ObjectId();

    const resume = await Resume.create({
      userId: dummyUserId,
      originalFileName: 'test-resume.pdf',
      fileType: 'pdf',
      fileUrl: 'http://example.com/test.pdf',
      extractedText: 'Software engineer skills',
      parsedSections: {
        skills: ['React', 'TypeScript'],
        experience: [],
        education: [],
        projects: [],
      },
    });

    await Analysis.create({
      userId: dummyUserId,
      resumeId: resume._id,
      overallScore: 85,
      atsScore: 90,
      contentHash: 'mock-hash-123',
      scoringVersion: '2.1.0-synchronized-pillars',
      strengths: ['Great skills'],
      weaknesses: ['Add metrics'],
      recommendations: ['Quantify bullet points'],
    });

    const res = await request(app).get('/api/stats');
    expect(res.status).toBe(200);
    expect(res.body.data.totalResumes).toBe(1);
    expect(res.body.data.totalAnalyses).toBe(1);
  });
});