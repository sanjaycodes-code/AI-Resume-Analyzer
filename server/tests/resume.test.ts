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
    doc.fontSize(10).text('JavaScript, TypeScript, React, Node.js, Express, MongoDB');
    doc.fontSize(14).text('WORK EXPERIENCE');
    doc.fontSize(10).text('Senior Engineer at Tech Corp. Developed scalable web apps.');
    doc.fontSize(14).text('EDUCATION');
    doc.fontSize(10).text('B.Tech in Computer Science');
    doc.end();
  });
};

describe('Resume Upload & Management Endpoints', () => {
  let tokenUserA: string;
  let tokenUserB: string;

  beforeEach(async () => {
    // Register User A
    const resA = await request(app).post('/api/auth/register').send({
      name: 'User A',
      email: 'userA@example.com',
      password: 'Password123!',
    });
    tokenUserA = resA.body.data.accessToken;

    // Register User B
    const resB = await request(app).post('/api/auth/register').send({
      name: 'User B',
      email: 'userB@example.com',
      password: 'Password123!',
    });
    tokenUserB = resB.body.data.accessToken;
  });

  describe('POST /api/resumes/upload', () => {
    it('accepts a valid small PDF fixture and extracts sections correctly', async () => {
      const pdfBuffer = await generateValidPdfBuffer();

      const res = await request(app)
        .post('/api/resumes/upload')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .attach('file', pdfBuffer, 'jane_resume.pdf');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.resume.originalFileName).toBe('jane_resume.pdf');
      expect(res.body.data.resume.fileType).toBe('pdf');
      expect(res.body.data.resume.extractedText).toContain('Jane Developer');
      expect(res.body.data.resume.parsedSections.skills).toBeInstanceOf(Array);
    });

    it('rejects wrong file type (.exe / .png) with 415 Unsupported Media Type', async () => {
      const fakeBuffer = Buffer.from('console.log("virus");');

      const res = await request(app)
        .post('/api/resumes/upload')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .attach('file', fakeBuffer, 'script.exe');

      expect(res.status).toBe(415);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('UNSUPPORTED_MEDIA_TYPE');
    });

    it('rejects oversized file (> 5MB) with 413 Payload Too Large', async () => {
      // 5.5 MB buffer
      const largeBuffer = Buffer.alloc(5.5 * 1024 * 1024);

      const res = await request(app)
        .post('/api/resumes/upload')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .attach('file', largeBuffer, 'huge_resume.pdf');

      expect(res.status).toBe(413);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('FILE_TOO_LARGE');
    });
  });

  describe('GET & DELETE /api/resumes/:id - Ownership Enforcement', () => {
    let resumeIdUserA: string;

    beforeEach(async () => {
      const pdfBuffer = await generateValidPdfBuffer();
      const uploadRes = await request(app)
        .post('/api/resumes/upload')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .attach('file', pdfBuffer, 'userA_doc.pdf');
      resumeIdUserA = uploadRes.body.data.resume._id;
    });

    it('allows User A to view their own resume', async () => {
      const res = await request(app)
        .get(`/api/resumes/${resumeIdUserA}`)
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.resume._id).toBe(resumeIdUserA);
    });

    it('returns 403 Forbidden when User B attempts to view User A resume', async () => {
      const res = await request(app)
        .get(`/api/resumes/${resumeIdUserA}`)
        .set('Authorization', `Bearer ${tokenUserB}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('returns 403 Forbidden when User B attempts to delete User A resume', async () => {
      const res = await request(app)
        .delete(`/api/resumes/${resumeIdUserA}`)
        .set('Authorization', `Bearer ${tokenUserB}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('allows User A to delete their own resume', async () => {
      const res = await request(app)
        .delete(`/api/resumes/${resumeIdUserA}`)
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
