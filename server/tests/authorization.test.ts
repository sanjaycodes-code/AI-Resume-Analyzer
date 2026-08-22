import request from 'supertest';
import PDFDocument from 'pdfkit';
import app from '../src/app';

// Helper to generate in-memory valid PDF buffer
const generateValidPdfBuffer = (): Promise<Buffer> => {
  return new Promise((resolve) => {
    const doc = new PDFDocument();
    const buffers: Buffer[] = [];
    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));

    doc.fontSize(16).text('Jane Developer');
    doc.fontSize(12).text('Software Engineer | jane@example.com | 1234567890');
    doc.fontSize(14).text('SKILLS');
    doc.fontSize(10).text('JavaScript, TypeScript, React, Node.js');
    doc.end();
  });
};

describe('Global Authorization & Ownership Security Tests', () => {
  describe('Unauthenticated Access Rejection (401 Unauthorized)', () => {
    it('rejects GET /api/auth/me without token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.code).toBe('MISSING_BEARER_TOKEN');
    });

    it('rejects GET /api/resumes without token', async () => {
      const res = await request(app).get('/api/resumes');
      expect(res.status).toBe(401);
      expect(res.body.code).toBe('MISSING_BEARER_TOKEN');
    });

    it('rejects POST /api/resumes/upload without token', async () => {
      const res = await request(app).post('/api/resumes/upload');
      expect(res.status).toBe(401);
      expect(res.body.code).toBe('MISSING_BEARER_TOKEN');
    });

    it('rejects POST /api/job-descriptions without token', async () => {
      const res = await request(app).post('/api/job-descriptions').send({
        title: 'Software Engineer',
        rawText: 'Looking for developers with React and Node.js.',
      });
      expect(res.status).toBe(401);
      expect(res.body.code).toBe('MISSING_BEARER_TOKEN');
    });

    it('rejects POST /api/analysis without token', async () => {
      const res = await request(app).post('/api/analysis').send({
        resumeId: '000000000000000000000000',
      });
      expect(res.status).toBe(401);
      expect(res.body.code).toBe('MISSING_BEARER_TOKEN');
    });

    it('rejects GET /api/analysis without token', async () => {
      const res = await request(app).get('/api/analysis');
      expect(res.status).toBe(401);
      expect(res.body.code).toBe('MISSING_BEARER_TOKEN');
    });
  });

  describe('Cross-User Ownership Access Rejection (403 Forbidden)', () => {
    let tokenUserA: string;
    let tokenUserB: string;
    let resumeIdUserA: string;
    let jobIdUserA: string;

    beforeEach(async () => {
      // User A
      const resA = await request(app).post('/api/auth/register').send({
        name: 'User A',
        email: 'usera_auth@example.com',
        password: 'Password123!',
      });
      tokenUserA = resA.body.data.accessToken;

      // User B
      const resB = await request(app).post('/api/auth/register').send({
        name: 'User B',
        email: 'userb_auth@example.com',
        password: 'Password123!',
      });
      tokenUserB = resB.body.data.accessToken;

      // User A uploads resume
      const pdf = await generateValidPdfBuffer();
      const upRes = await request(app)
        .post('/api/resumes/upload')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .attach('file', pdf, 'resumeA.pdf');
      resumeIdUserA = upRes.body.data.resume._id;

      // User A creates job description
      const jobRes = await request(app)
        .post('/api/job-descriptions')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          title: 'User A Job',
          rawText: 'Job description for User A team.',
        });
      jobIdUserA = jobRes.body.data.jobDescription._id;
    });

    it('returns 403 when User B tries to access User A job description', async () => {
      const res = await request(app)
        .get(`/api/job-descriptions/${jobIdUserA}`)
        .set('Authorization', `Bearer ${tokenUserB}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('returns 403 when User B tries to delete User A job description', async () => {
      const res = await request(app)
        .delete(`/api/job-descriptions/${jobIdUserA}`)
        .set('Authorization', `Bearer ${tokenUserB}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('returns 403 when User B tries to analyze User A resume', async () => {
      const res = await request(app)
        .post('/api/analysis')
        .set('Authorization', `Bearer ${tokenUserB}`)
        .send({
          resumeId: resumeIdUserA,
        });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });
  });
});
