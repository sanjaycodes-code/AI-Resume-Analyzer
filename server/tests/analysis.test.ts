import request from 'supertest';
import PDFDocument from 'pdfkit';
import app from '../src/app';
import { aiService } from '../src/services/ai/aiService';
import { Analysis } from '../src/models/Analysis';
import { AIAnalysisResult } from '../src/validators/aiAnalysis.validator';

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
    doc.fontSize(10).text('JavaScript, TypeScript, React, Node.js, Express, MongoDB, AWS, Docker');
    doc.fontSize(14).text('WORK EXPERIENCE');
    doc.fontSize(10).text('Senior Engineer at Tech Corp. Developed scalable web apps.');
    doc.fontSize(14).text('EDUCATION');
    doc.fontSize(10).text('B.Tech in Computer Science');
    doc.end();
  });
};

describe('Analysis Endpoints with Mocked AI Engine', () => {
  let tokenUser: string;
  let resumeId: string;
  let jobDescriptionId: string;

  const mockValidAIPayload: AIAnalysisResult = {
    executiveSummary: 'Candidate demonstrates strong full-stack foundations with modern JavaScript frameworks.',
    skillsFound: ['React', 'Node.js', 'TypeScript', 'MongoDB'],
    missingSkills: ['Kubernetes', 'GraphQL'],
    strengths: ['Solid JavaScript foundation', 'Clear full-stack experience'],
    weaknesses: ['Could demonstrate more cloud deployment expertise'],
    recommendations: ['Include specific Kubernetes cluster management experience'],
    keywordAnalysis: {
      keywordDensityScore: 85,
      matchedKeywords: ['React', 'Node.js', 'MongoDB'],
      missingKeywords: ['Kubernetes'],
    },
    experienceAnalysis: {
      rating: 85,
      feedback: 'Strong engineering track record.',
      bulletPointSuggestions: ['Add performance benchmark percentages.'],
    },
    educationAnalysis: {
      rating: 90,
      feedback: 'Directly aligned computer science degree.',
    },
    projectAnalysis: {
      rating: 80,
      feedback: 'Demonstrates real-world microservice usage.',
      highlightedProjects: ['Microservices Cloud Dashboard'],
    },
  };

  beforeEach(async () => {
    // 1. Register User
    const regRes = await request(app).post('/api/auth/register').send({
      name: 'Analysis Tester',
      email: 'analysistest@example.com',
      password: 'Password123!',
    });
    tokenUser = regRes.body.data.accessToken;

    // 2. Upload Resume
    const pdfBuffer = await generateValidPdfBuffer();
    const uploadRes = await request(app)
      .post('/api/resumes/upload')
      .set('Authorization', `Bearer ${tokenUser}`)
      .attach('file', pdfBuffer, 'candidate.pdf');
    resumeId = uploadRes.body.data.resume._id;

    // 3. Create Job Description
    const jdRes = await request(app)
      .post('/api/job-descriptions')
      .set('Authorization', `Bearer ${tokenUser}`)
      .send({
        title: 'Lead Full Stack Engineer',
        rawText: 'Looking for a Lead Engineer with React, Node.js, TypeScript, and Kubernetes.',
      });
    jobDescriptionId = jdRes.body.data.jobDescription._id;
  });

  it('merges mocked AI evaluation with deterministic ATS score and persists correctly', async () => {
    // Mock the AI provider to return fixed valid payload
    const analyzeSpy = jest
      .spyOn(aiService, 'analyzeResume')
      .mockResolvedValueOnce(mockValidAIPayload);

    const res = await request(app)
      .post('/api/analysis')
      .set('Authorization', `Bearer ${tokenUser}`)
      .send({
        resumeId,
        jobDescriptionId,
      });

    expect(analyzeSpy).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    const analysis = res.body.data.analysis;
    expect(analysis.overallScore).toBeGreaterThan(0);
    expect(analysis.atsScore).toBeGreaterThan(0);
    expect(analysis.skillsFound).toEqual(expect.arrayContaining(['React', 'Node.js']));
    expect(analysis.missingSkills).toEqual(expect.arrayContaining(['Kubernetes']));
    expect(analysis.strengths.length).toBeGreaterThan(0);
    expect(analysis.recommendations.length).toBeGreaterThan(0);

    // Verify persisted in MongoDB
    const persisted = await Analysis.findById(analysis._id);
    expect(persisted).not.toBeNull();
    expect(persisted?.overallScore).toBe(analysis.overallScore);
  });

  it('handles simulated AI failure cleanly with 502 Bad Gateway and prevents partial DB writes', async () => {
    // Mock the AI provider to throw an error
    jest
      .spyOn(aiService, 'analyzeResume')
      .mockRejectedValueOnce(new Error('Simulated Gemini API rate limit exceeded'));

    const initialCount = await Analysis.countDocuments();

    const res = await request(app)
      .post('/api/analysis')
      .set('Authorization', `Bearer ${tokenUser}`)
      .send({
        resumeId,
        jobDescriptionId,
      });

    expect(res.status).toBe(502);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('AI_SERVICE_UNAVAILABLE');

    // Confirm no partial / corrupted record was saved
    const finalCount = await Analysis.countDocuments();
    expect(finalCount).toBe(initialCount);
  });

  describe('POST /api/analysis/enhance-bullet', () => {
    let createdAnalysisId: string;

    beforeEach(async () => {
      // Create an analysis record first
      jest.spyOn(aiService, 'analyzeResume').mockResolvedValueOnce(mockValidAIPayload);
      const anaRes = await request(app)
        .post('/api/analysis')
        .set('Authorization', `Bearer ${tokenUser}`)
        .send({ resumeId, jobDescriptionId });
      createdAnalysisId = anaRes.body.data.analysis._id;
    });

    it('successfully enhances a weak resume bullet and persists to enhancedBullets array', async () => {
      const mockEnhanced = {
        enhancedText: 'Architected and deployed high-performance microservices, reducing API response times by [X]% for [N] active users.',
        changesSummary: [
          'Replaced passive phrasing with action verbs "Architected and deployed"',
          'Applied STAR structure with quantifiable outcome metrics',
        ],
      };

      const enhanceSpy = jest
        .spyOn(aiService, 'enhanceBullet')
        .mockResolvedValueOnce(mockEnhanced);

      const res = await request(app)
        .post('/api/analysis/enhance-bullet')
        .set('Authorization', `Bearer ${tokenUser}`)
        .send({
          analysisId: createdAnalysisId,
          originalText: 'Responsible for writing backend microservices code and improving response times.',
          targetRole: 'Senior Backend Engineer',
        });

      expect(enhanceSpy).toHaveBeenCalledTimes(1);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.enhancedText).toContain('Architected and deployed');
      expect(res.body.data.changesSummary.length).toBeGreaterThan(0);

      // Verify persisted into Analysis document
      const updatedDoc = await Analysis.findById(createdAnalysisId);
      expect(updatedDoc?.enhancedBullets.length).toBe(1);
      expect(updatedDoc?.enhancedBullets[0].enhancedText).toContain('Architected and deployed');

      // Verify GET /api/analysis/:id returns enhancedBullets
      const getRes = await request(app)
        .get(`/api/analysis/${createdAnalysisId}`)
        .set('Authorization', `Bearer ${tokenUser}`);
      expect(getRes.status).toBe(200);
      expect(getRes.body.data.analysis.enhancedBullets.length).toBe(1);
    });

    it('rejects enhancement request from another user with 403 Forbidden', async () => {
      // Register User B
      const userBRes = await request(app).post('/api/auth/register').send({
        name: 'User B',
        email: 'userb_bullet@example.com',
        password: 'Password123!',
      });
      const tokenUserB = userBRes.body.data.accessToken;

      const res = await request(app)
        .post('/api/analysis/enhance-bullet')
        .set('Authorization', `Bearer ${tokenUserB}`)
        .send({
          analysisId: createdAnalysisId,
          originalText: 'Responsible for writing backend microservices code.',
        });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('rejects short bullet inputs under 5 characters with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/analysis/enhance-bullet')
        .set('Authorization', `Bearer ${tokenUser}`)
        .send({
          analysisId: createdAnalysisId,
          originalText: 'abc',
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });
  });
});


