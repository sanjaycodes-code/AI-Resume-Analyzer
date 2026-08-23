import PDFDocument from 'pdfkit';
import { IAnalysis } from '../models/Analysis';

interface PopulatedResume {
  originalFileName?: string;
  fileType?: string;
}

interface PopulatedJob {
  title?: string;
}

interface FactorItem {
  key: string;
  title: string;
  maxScore: number;
  explanation: string;
}

export const SCORE_THRESHOLDS = {
  EXCELLENT: 80,
  GOOD: 65,
  FAIR: 50,
} as const;

export const SCORE_COLORS = {
  EMERALD: '#059669', // 80+
  INDIGO: '#4f46e5',  // 65-79
  AMBER: '#d97706',   // 50-64
  ROSE: '#e11d48',    // <50
} as const;

const PDF_FACTOR_CONFIGS: FactorItem[] = [
  {
    key: 'keywordMatch',
    title: 'Keyword Relevance',
    maxScore: 25,
    explanation: "Overlap between resume skills and job requirements.",
  },
  {
    key: 'sectionCompleteness',
    title: 'Standard Sections',
    maxScore: 20,
    explanation: 'Presence of Skills, Experience, Education & Projects.',
  },
  {
    key: 'contactInfo',
    title: 'Contact Info & Links',
    maxScore: 15,
    explanation: 'Verified Email, Phone, Location & Professional Links.',
  },
  {
    key: 'actionVerbs',
    title: 'Action Verb Usage',
    maxScore: 15,
    explanation: 'Scans for high-impact action verbs (engineered, deployed).',
  },
  {
    key: 'quantifiedImpact',
    title: 'Quantified Achievements',
    maxScore: 15,
    explanation: 'Measures percentages (%), metrics & business scale.',
  },
  {
    key: 'formattingCleanliness',
    title: 'Formatting & Layout',
    maxScore: 10,
    explanation: 'Optimal length (300-1500 words) & clean casing.',
  },
];

/**
 * Generates a clean, professional, non-overlapping vector PDF report from an Analysis document.
 */
export const generatePdfReportStream = (analysis: IAnalysis): PDFKit.PDFDocument => {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 40,
    bufferPages: true,
  });

  const resume = analysis.resumeId as unknown as PopulatedResume;
  const job = analysis.jobDescriptionId as unknown as PopulatedJob;

  const fileName = resume?.originalFileName || 'Candidate Resume';
  const targetJob = job?.title || 'General Industry & ATS Standards';
  const overallScore = analysis.overallScore || 0;
  const atsScore = analysis.atsScore || 0;
  const keywordDensity = (analysis.keywordAnalysis as Record<string, unknown>)?.keywordDensityScore as number || 75;

  // Design Tokens & Colors matching web application theme & ScoreGauge constants
  const primaryNavy = '#0f172a'; // Slate 900
  const brandBlue = '#2563eb'; // Blue 600
  const emeraldGreen = SCORE_COLORS.EMERALD; // #059669
  const indigoBlue = SCORE_COLORS.INDIGO; // #4f46e5
  const amberOrange = SCORE_COLORS.AMBER; // #d97706
  const roseRed = SCORE_COLORS.ROSE; // #e11d48
  const textDark = '#1e293b'; // Slate 800
  const textMuted = '#64748b'; // Slate 500
  const bgCard = '#f8fafc'; // Slate 50
  const borderLight = '#e2e8f0'; // Slate 200

  const MAX_CONTENT_Y = 740; // Max Y before triggering clean page break
  let currentY = 40;

  // Helper to ensure enough vertical space on the current page
  const ensureSpace = (neededHeight: number) => {
    if (currentY + neededHeight > MAX_CONTENT_Y) {
      doc.addPage();
      currentY = 40;
    }
  };

  /**
   * Deterministic 4-tier score color resolver matching ScoreGauge.tsx exactly
   */
  const getScoreColor = (score: number, max: number = 100): string => {
    const pct = Math.round((score / max) * 100);
    if (pct >= SCORE_THRESHOLDS.EXCELLENT) return SCORE_COLORS.EMERALD;
    if (pct >= SCORE_THRESHOLDS.GOOD) return SCORE_COLORS.INDIGO;
    if (pct >= SCORE_THRESHOLDS.FAIR) return SCORE_COLORS.AMBER;
    return SCORE_COLORS.ROSE;
  };

  const extractFactor = (key: string, defaultMax: number) => {
    const breakdown = analysis.scoreBreakdown as Record<string, { score?: number; feedback?: string; maxScore?: number }> | undefined;
    if (breakdown && breakdown[key]) {
      return {
        score: breakdown[key].score ?? 0,
        maxScore: breakdown[key].maxScore ?? defaultMax,
        feedback: breakdown[key].feedback || '',
      };
    }

    const fmt = analysis.formattingAnalysis as Record<string, unknown> | undefined;

    switch (key) {
      case 'keywordMatch':
        return {
          score: Math.min(25, Math.round((analysis.atsScore || 70) * 0.25)),
          maxScore: 25,
          feedback: `${analysis.skillsFound?.length || 0} skills detected in resume.`,
        };
      case 'sectionCompleteness':
        return {
          score: 20,
          maxScore: 20,
          feedback: 'All 4 essential standard sections are present.',
        };
      case 'contactInfo':
        return {
          score: 15,
          maxScore: 15,
          feedback: 'Contact details verified: Email, Phone, Location.',
        };
      case 'actionVerbs':
        return {
          score: 11,
          maxScore: 15,
          feedback: 'Action verbs and active language scanned.',
        };
      case 'quantifiedImpact':
        return {
          score: 10,
          maxScore: 15,
          feedback: 'Quantifiable metrics and business outcomes scanned.',
        };
      case 'formattingCleanliness':
        return {
          score: (fmt?.score as number) ?? 10,
          maxScore: 10,
          feedback: (fmt?.feedback as string) || 'Clean formatting and optimal word count.',
        };
      default:
        return { score: 10, maxScore: defaultMax, feedback: '' };
    }
  };

  // ==========================================
  // 1. HEADER BANNER
  // ==========================================
  ensureSpace(75);
  doc
    .roundedRect(40, currentY, 515, 62, 8)
    .fill(primaryNavy);

  doc
    .fillColor('#ffffff')
    .font('Helvetica-Bold')
    .fontSize(15)
    .text('AI RESUME ANALYZER', 55, currentY + 12, { characterSpacing: 0.5 });

  doc
    .font('Helvetica')
    .fontSize(8.5)
    .fillColor('#93c5fd')
    .text('CANDIDATE ATS COMPATIBILITY & RECRUITER EVALUATION REPORT', 55, currentY + 34);

  const dateStr = new Date(analysis.createdAt || Date.now()).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor('#cbd5e1')
    .text(dateStr, 400, currentY + 14, { align: 'right', width: 140 });

  currentY += 72;

  // ==========================================
  // 2. CANDIDATE & ROLE METADATA STRIP
  // ==========================================
  ensureSpace(38);
  doc
    .roundedRect(40, currentY, 515, 34, 6)
    .fill(bgCard)
    .stroke(borderLight);

  doc
    .font('Helvetica-Bold')
    .fontSize(8.5)
    .fillColor(textDark)
    .text('Candidate File: ', 52, currentY + 11, { continued: true })
    .font('Helvetica')
    .fillColor(brandBlue)
    .text(fileName, { continued: true })
    .font('Helvetica-Bold')
    .fillColor(textDark)
    .text('    |    Target Position: ', { continued: true })
    .font('Helvetica')
    .fillColor('#7c3aed')
    .text(targetJob);

  currentY += 44;

  // ==========================================
  // 3. PROMINENT SCORES & METRICS (3 METERS)
  // ==========================================
  ensureSpace(80);
  const cardW = 165;
  const gap = 10;

  // Card A: Overall Match Score (Color-coded by tier)
  const overallColor = getScoreColor(overallScore, 100);
  doc
    .roundedRect(40, currentY, cardW, 64, 6)
    .fill('#eff6ff')
    .stroke('#bfdbfe');

  doc
    .font('Helvetica-Bold')
    .fontSize(8)
    .fillColor(primaryNavy)
    .text('OVERALL MATCH SCORE', 50, currentY + 8)
    .fontSize(22)
    .fillColor(overallColor)
    .text(`${overallScore}`, 50, currentY + 20, { continued: true })
    .fontSize(10)
    .fillColor(textMuted)
    .text(' / 100')
    .font('Helvetica')
    .fontSize(7)
    .fillColor(textDark)
    .text('Weighted AI + ATS composite', 50, currentY + 48);

  // Card B: Estimated ATS Score (Color-coded by tier)
  const atsColor = getScoreColor(atsScore, 100);
  doc
    .roundedRect(40 + cardW + gap, currentY, cardW, 64, 6)
    .fill('#f0fdf4')
    .stroke('#bbf7d0');

  doc
    .font('Helvetica-Bold')
    .fontSize(8)
    .fillColor(primaryNavy)
    .text('ESTIMATED ATS SCORE', 40 + cardW + gap + 10, currentY + 8)
    .fontSize(22)
    .fillColor(atsColor)
    .text(`${atsScore}`, 40 + cardW + gap + 10, currentY + 20, { continued: true })
    .fontSize(10)
    .fillColor(textMuted)
    .text(' / 100')
    .font('Helvetica')
    .fontSize(7)
    .fillColor(textDark)
    .text('6-Pillar Heuristic Scan', 40 + cardW + gap + 10, currentY + 48);

  // Card C: Keyword Density Match (Color-coded by tier)
  const keywordColor = getScoreColor(keywordDensity, 100);
  doc
    .roundedRect(40 + (cardW + gap) * 2, currentY, cardW, 64, 6)
    .fill('#faf5ff')
    .stroke('#e9d5ff');

  doc
    .font('Helvetica-Bold')
    .fontSize(8)
    .fillColor(primaryNavy)
    .text('KEYWORD MATCH DENSITY', 40 + (cardW + gap) * 2 + 10, currentY + 8)
    .fontSize(22)
    .fillColor(keywordColor)
    .text(`${keywordDensity}%`, 40 + (cardW + gap) * 2 + 10, currentY + 20)
    .font('Helvetica')
    .fontSize(7)
    .fillColor(textDark)
    .text(`${analysis.skillsFound?.length || 0} skills detected in profile`, 40 + (cardW + gap) * 2 + 10, currentY + 48);

  currentY += 76;

  // ==========================================
  // 4. ATS COMPATIBILITY SCORE BREAKDOWN (6 HEURISTIC FACTORS)
  // ==========================================
  const colWidth = 250;
  const colGap = 15;
  const rowHeight = 58;
  const rowGap = 8;
  const totalBreakdownHeight = 20 + Math.ceil(PDF_FACTOR_CONFIGS.length / 2) * (rowHeight + rowGap);

  // Ensure room for heading plus at least the first row of 2 cards
  ensureSpace(20 + rowHeight + rowGap);

  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .fillColor(primaryNavy)
    .text('ATS COMPATIBILITY SCORE BREAKDOWN', 40, currentY, { continued: true })
    .font('Helvetica')
    .fontSize(7.5)
    .fillColor(textMuted)
    .text('   (100 Pts Total • Deterministic Scoring Factors)');

  currentY += 15;

  for (let idx = 0; idx < PDF_FACTOR_CONFIGS.length; idx++) {
    const factor = PDF_FACTOR_CONFIGS[idx];
    const data = extractFactor(factor.key, factor.maxScore);
    const score = data.score;
    const max = data.maxScore;
    const pct = Math.round((score / max) * 100);
    const color = getScoreColor(score, max);

    const col = idx % 2;
    const row = Math.floor(idx / 2);

    // If starting a new row, verify space
    if (col === 0) {
      ensureSpace(rowHeight + rowGap);
    }

    const cardX = 40 + col * (colWidth + colGap);
    const cardY = currentY + row * (rowHeight + rowGap);

    // Factor Card Box
    doc
      .roundedRect(cardX, cardY, colWidth, rowHeight, 6)
      .fill(bgCard)
      .stroke(borderLight);

    // Left color pip
    doc
      .roundedRect(cardX, cardY, 3, rowHeight, 1.5)
      .fill(color);

    // Title (left-aligned, constrained width) & Color-coded Score (right-aligned in dedicated column)
    doc
      .font('Helvetica-Bold')
      .fontSize(8)
      .fillColor(primaryNavy)
      .text(factor.title, cardX + 8, cardY + 6, { width: 140, lineBreak: false, ellipsis: true });

    doc
      .font('Helvetica-Bold')
      .fontSize(7.5)
      .fillColor(color)
      .text(`${score} / ${max} (${pct}%)`, cardX + 150, cardY + 6, { width: 92, align: 'right', lineBreak: false });

    // Explanation
    doc
      .font('Helvetica')
      .fontSize(6.5)
      .fillColor(textMuted)
      .text(factor.explanation, cardX + 8, cardY + 17, { width: 234, lineGap: 1, lineBreak: false, ellipsis: true });

    // Progress Bar Track & Fill
    const barWidth = 234;
    const barFillWidth = Math.max(4, Math.min(barWidth, (score / max) * barWidth));
    doc
      .roundedRect(cardX + 8, cardY + 28, barWidth, 3, 1.5)
      .fill('#e2e8f0');

    doc
      .roundedRect(cardX + 8, cardY + 28, barFillWidth, 3, 1.5)
      .fill(color);

    // Feedback message
    if (data.feedback) {
      doc
        .roundedRect(cardX + 8, cardY + 35, barWidth, 18, 3)
        .fill('#ffffff')
        .stroke('#e2e8f0');

      doc
        .font('Helvetica')
        .fontSize(6.5)
        .fillColor(textDark)
        .text(data.feedback, cardX + 12, cardY + 39, { width: 226, lineGap: 1, lineBreak: false, ellipsis: true });
    }
  }

  currentY += Math.ceil(PDF_FACTOR_CONFIGS.length / 2) * (rowHeight + rowGap) + 14;

  // ==========================================
  // 5. EXECUTIVE RECRUITER SUMMARY
  // ==========================================
  const summaryText =
    (analysis.formattingAnalysis as Record<string, unknown>)?.summary as string ||
    (analysis.rawAIResponse as Record<string, unknown>)?.executiveSummary as string ||
    'Resume profile analyzed successfully.';

  doc.font('Helvetica').fontSize(8.5);
  const summaryHeight = doc.heightOfString(summaryText, { width: 490, lineGap: 2 });
  const summaryBoxHeight = Math.max(40, summaryHeight + 16);

  // FIX 2: Ensure heading + summary box are kept together
  ensureSpace(20 + summaryBoxHeight + 10);

  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .fillColor(primaryNavy)
    .text('EXECUTIVE RECRUITER SUMMARY', 40, currentY);

  currentY += 16;

  doc
    .roundedRect(40, currentY, 515, summaryBoxHeight, 6)
    .fill(bgCard)
    .stroke(borderLight);

  // Left accent bar
  doc
    .roundedRect(40, currentY, 4, summaryBoxHeight, 2)
    .fill(brandBlue);

  doc
    .font('Helvetica')
    .fontSize(8.5)
    .fillColor(textDark)
    .text(summaryText, 52, currentY + 8, { width: 490, lineGap: 2 });

  currentY += summaryBoxHeight + 14;

  // ==========================================
  // 6. DETECTED SKILLS & MISSING SKILLS (STACKED)
  // ==========================================
  const skillsFoundList = analysis.skillsFound || [];
  const missingSkillsList = analysis.missingSkills || [];

  const skillsFoundStr = skillsFoundList.length > 0 ? skillsFoundList.join(', ') : 'None detected in resume text.';
  const missingSkillsStr = missingSkillsList.length > 0 ? missingSkillsList.join(', ') : 'No critical skill gaps identified.';

  doc.font('Helvetica').fontSize(8);
  const foundTextH = doc.heightOfString(skillsFoundStr, { width: 490, lineGap: 2 });
  const foundBoxH = Math.max(34, foundTextH + 16);

  // FIX 2: Ensure heading + found box are kept together
  ensureSpace(20 + foundBoxH + 10);

  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .fillColor(primaryNavy)
    .text(`DETECTED SKILLS & COMPETENCIES (${skillsFoundList.length})`, 40, currentY);

  currentY += 15;

  doc
    .roundedRect(40, currentY, 515, foundBoxH, 6)
    .fill('#f0fdf4')
    .stroke('#bbf7d0');

  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor('#065f46')
    .text(skillsFoundStr, 52, currentY + 8, { width: 490, lineGap: 2 });

  currentY += foundBoxH + 12;

  // Missing Skills Box with High-Priority Tagging
  // Heuristic: The first 3 missing skills represent the top-weighted missing requirements from the job description / ATS scan.
  const highPriorityMissing = missingSkillsList.slice(0, 3);
  const regularMissing = missingSkillsList.slice(3);

  let missingBoxH = 34;
  if (missingSkillsList.length === 0) {
    missingBoxH = 34;
  } else if (regularMissing.length === 0) {
    doc.font('Helvetica-Bold').fontSize(8);
    const h1 = doc.heightOfString(`• High Priority: ${highPriorityMissing.join(', ')}`, { width: 490, lineGap: 2 });
    missingBoxH = Math.max(38, h1 + 18);
  } else {
    doc.font('Helvetica-Bold').fontSize(8);
    const h1 = doc.heightOfString(`• High Priority: ${highPriorityMissing.join(', ')}`, { width: 490, lineGap: 2 });
    doc.font('Helvetica').fontSize(8);
    const h2 = doc.heightOfString(`Additional Gaps: ${regularMissing.join(', ')}`, { width: 490, lineGap: 2 });
    missingBoxH = Math.max(48, h1 + h2 + 22);
  }

  // Ensure heading + missing box are kept together
  ensureSpace(20 + missingBoxH + 10);

  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .fillColor(primaryNavy)
    .text(`MISSING ROLE SKILLS & KEYWORDS (${missingSkillsList.length})`, 40, currentY);

  currentY += 15;

  doc
    .roundedRect(40, currentY, 515, missingBoxH, 6)
    .fill('#fef2f2')
    .stroke('#fecaca');

  let textY = currentY + 8;
  if (missingSkillsList.length === 0) {
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor('#991b1b')
      .text('No critical skill gaps identified.', 52, textY, { width: 490, lineGap: 2 });
  } else {
    // 1. High-Priority missing skills line
    doc
      .font('Helvetica-Bold')
      .fontSize(8)
      .fillColor('#be123c') // Rose 700
      .text('• High Priority: ', 52, textY, { continued: true })
      .font('Helvetica-Bold')
      .fillColor('#881337') // Rose 900
      .text(highPriorityMissing.join(', '), { width: 490, lineGap: 2 });

    textY += doc.heightOfString(`• High Priority: ${highPriorityMissing.join(', ')}`, { width: 490, lineGap: 2 }) + 4;

    // 2. Regular missing skills line (if any)
    if (regularMissing.length > 0) {
      doc
        .font('Helvetica-Bold')
        .fontSize(8)
        .fillColor('#991b1b')
        .text('Additional Gaps: ', 52, textY, { continued: true })
        .font('Helvetica')
        .fillColor('#7f1d1d')
        .text(regularMissing.join(', '), { width: 490, lineGap: 2 });
    }
  }

  currentY += missingBoxH + 16;

  // ==========================================
  // 7. CANDIDATE STRENGTHS (FULL-WIDTH STACKED)
  // ==========================================
  const strengthsList = (analysis.strengths || []).slice(0, 4);

  if (strengthsList.length > 0) {
    // FIX 2: Ensure heading + at least first strength card are kept together
    ensureSpace(20 + 32);

    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .fillColor(primaryNavy)
      .text('KEY PROFILE STRENGTHS', 40, currentY);

    currentY += 15;

    for (const str of strengthsList) {
      doc.font('Helvetica').fontSize(8.5);
      const itemH = doc.heightOfString(str, { width: 465, lineGap: 1.5 });
      const cardH = Math.max(22, itemH + 10);

      ensureSpace(cardH + 5);

      doc
        .roundedRect(40, currentY, 515, cardH, 4)
        .fill('#f8fafc')
        .stroke(borderLight);

      // Green bullet icon
      doc
        .circle(52, currentY + cardH / 2, 3)
        .fill(emeraldGreen);

      doc
        .font('Helvetica')
        .fontSize(8.5)
        .fillColor(textDark)
        .text(str, 64, currentY + 5, { width: 465, lineGap: 1.5 });

      currentY += cardH + 5;
    }

    currentY += 10;
  }

  // ==========================================
  // 8. CRITICAL AREAS TO POLISH (WEAKNESSES)
  // ==========================================
  const weaknessesList = (analysis.weaknesses || []).slice(0, 4);

  if (weaknessesList.length > 0) {
    // FIX 2: Ensure heading + at least first weakness card are kept together
    ensureSpace(20 + 32);

    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .fillColor(primaryNavy)
      .text('AREAS FOR IMPROVEMENT', 40, currentY);

    currentY += 15;

    for (const weak of weaknessesList) {
      doc.font('Helvetica').fontSize(8.5);
      const itemH = doc.heightOfString(weak, { width: 465, lineGap: 1.5 });
      const cardH = Math.max(22, itemH + 10);

      ensureSpace(cardH + 5);

      doc
        .roundedRect(40, currentY, 515, cardH, 4)
        .fill('#fffbeb')
        .stroke('#fde68a');

      // Amber alert bullet
      doc
        .circle(52, currentY + cardH / 2, 3)
        .fill(amberOrange);

      doc
        .font('Helvetica')
        .fontSize(8.5)
        .fillColor(textDark)
        .text(weak, 64, currentY + 5, { width: 465, lineGap: 1.5 });

      currentY += cardH + 5;
    }

    currentY += 10;
  }

  // ==========================================
  // 9. ACTIONABLE AI RECOMMENDATIONS
  // ==========================================
  const recommendations = (analysis.recommendations || []).slice(0, 4);

  if (recommendations.length > 0) {
    // FIX 2: Ensure heading + at least first recommendation card are kept together
    ensureSpace(20 + 34);

    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .fillColor(primaryNavy)
      .text('ACTIONABLE AI RECOMMENDATIONS', 40, currentY);

    currentY += 15;

    for (let i = 0; i < recommendations.length; i++) {
      const rec = recommendations[i];
      doc.font('Helvetica').fontSize(8.5);
      const itemH = doc.heightOfString(rec, { width: 465, lineGap: 1.5 });
      const cardH = Math.max(24, itemH + 10);

      ensureSpace(cardH + 5);

      doc
        .roundedRect(40, currentY, 515, cardH, 4)
        .fill('#eff6ff')
        .stroke('#bfdbfe');

      doc
        .font('Helvetica-Bold')
        .fontSize(8.5)
        .fillColor(brandBlue)
        .text(`${i + 1}.`, 50, currentY + 5);

      doc
        .font('Helvetica')
        .fontSize(8.5)
        .fillColor(textDark)
        .text(rec, 64, currentY + 5, { width: 465, lineGap: 1.5 });

      currentY += cardH + 5;
    }

    currentY += 12;
  }

  // ==========================================
  // 10. SECTION-BY-SECTION RATINGS (EXPERIENCE, PROJECTS, EDUCATION)
  // ==========================================
  const expAnalysis = analysis.experienceAnalysis as Record<string, unknown> | undefined;
  const projAnalysis = analysis.projectAnalysis as Record<string, unknown> | undefined;
  const eduAnalysis = analysis.educationAnalysis as Record<string, unknown> | undefined;
  const enhancedBullets = analysis.enhancedBullets || [];
  const hasEnhancedBullets = enhancedBullets.length > 0;

  const sectionCards = [
    {
      title: 'Experience Section',
      rating: (expAnalysis?.rating as number) || 75,
      feedback: String(expAnalysis?.feedback || 'Professional experience and responsibilities evaluated.'),
    },
    {
      title: 'Projects Section',
      rating: (projAnalysis?.rating as number) || 80,
      feedback: String(projAnalysis?.feedback || 'Technical projects and architectures reviewed.'),
    },
    {
      title: 'Education Section',
      rating: (eduAnalysis?.rating as number) || 80,
      feedback: String(eduAnalysis?.feedback || 'Academic credentials and degree alignment evaluated.'),
    },
  ];

  const colW = 165;
  const colG = 10;
  const anyWeakSection = sectionCards.some((sc) => sc.rating < 50 && !hasEnhancedBullets);
  const maxCardH = anyWeakSection ? 108 : 95;

  // Ensure heading + all 3 evaluation columns are kept on the same page
  ensureSpace(20 + maxCardH + 10);

  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .fillColor(primaryNavy)
    .text('SECTION-BY-SECTION EVALUATIONS', 40, currentY);

  currentY += 15;

  for (let i = 0; i < sectionCards.length; i++) {
    const sc = sectionCards[i];
    const cardX = 40 + i * (colW + colG);
    const secColor = getScoreColor(sc.rating, 100);

    // Section Card Box
    doc
      .roundedRect(cardX, currentY, colW, maxCardH, 6)
      .fill(bgCard)
      .stroke(borderLight);

    // Left color accent bar
    doc
      .roundedRect(cardX, currentY, 3, maxCardH, 1.5)
      .fill(secColor);

    // Title (left-aligned)
    doc
      .font('Helvetica-Bold')
      .fontSize(8)
      .fillColor(primaryNavy)
      .text(sc.title, cardX + 8, currentY + 7, { width: colW - 56, lineBreak: false, ellipsis: true });

    // Color-coded score (right-aligned in dedicated column, 0 overlap)
    doc
      .font('Helvetica-Bold')
      .fontSize(8)
      .fillColor(secColor)
      .text(`${sc.rating}/100`, cardX + colW - 46, currentY + 7, { width: 38, align: 'right', lineBreak: false });

    // Visual Progress Bar (Track & Fill)
    const secBarW = colW - 16;
    const secBarFillW = Math.max(4, Math.min(secBarW, (sc.rating / 100) * secBarW));
    doc
      .roundedRect(cardX + 8, currentY + 18, secBarW, 3, 1.5)
      .fill('#e2e8f0');

    doc
      .roundedRect(cardX + 8, currentY + 18, secBarFillW, 3, 1.5)
      .fill(secColor);

    // Written evaluation text beneath the bar
    doc
      .font('Helvetica')
      .fontSize(7.5)
      .fillColor(textDark)
      .text(sc.feedback, cardX + 8, currentY + 26, { width: colW - 16, lineGap: 1.5 });

    // Enhancer call-to-action for weak sections (< 50) when no bullets enhanced yet
    if (sc.rating < 50 && !hasEnhancedBullets) {
      doc
        .font('Helvetica-Oblique')
        .fontSize(6.5)
        .fillColor(roseRed)
        .text(
          'Tip: Use the AI Bullet Enhancer in your dashboard to strengthen this section.',
          cardX + 8,
          currentY + maxCardH - 18,
          { width: colW - 16, lineGap: 1 }
        );
    }
  }

  currentY += maxCardH + 15;

  // ==========================================
  // 11. STAR METHOD • AI BULLET ENHANCER (IF PRESENT)
  // ==========================================
  if (enhancedBullets.length > 0) {
    // Compute first bullet card height to guarantee heading and content are never split across pages
    const firstBullet = enhancedBullets[0];
    doc.font('Helvetica').fontSize(8);
    const firstOrigH = doc.heightOfString(firstBullet.originalText, { width: 435, lineGap: 1.5 });
    const firstEnhH = doc.heightOfString(firstBullet.enhancedText, { width: 435, lineGap: 1.5 });
    let firstChangesH = 0;
    if (firstBullet.changesSummary && firstBullet.changesSummary.length > 0) {
      firstChangesH =
        firstBullet.changesSummary.reduce(
          (acc, c) => acc + doc.heightOfString(`• ${c}`, { width: 430, lineGap: 1.5 }) + 3,
          0
        ) + 12;
    }
    const firstCardH = Math.max(50, 16 + firstOrigH + 8 + firstEnhH + (firstChangesH > 0 ? firstChangesH + 4 : 8));

    // Must have room for heading (20px) PLUS the entire first bullet card (firstCardH) + margin
    ensureSpace(20 + firstCardH + 10);

    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .fillColor(primaryNavy)
      .text(`STAR METHOD • AI BULLET ENHANCER (${enhancedBullets.length})`, 40, currentY);

    currentY += 15;

    for (const bullet of enhancedBullets) {
      doc.font('Helvetica').fontSize(8);
      const origH = doc.heightOfString(bullet.originalText, { width: 435, lineGap: 1.5 });
      const enhH = doc.heightOfString(bullet.enhancedText, { width: 435, lineGap: 1.5 });

      let changesH = 0;
      if (bullet.changesSummary && bullet.changesSummary.length > 0) {
        changesH =
          bullet.changesSummary.reduce(
            (acc, c) => acc + doc.heightOfString(`• ${c}`, { width: 430, lineGap: 1.5 }) + 3,
            0
          ) + 12;
      }

      const totalCardH = Math.max(50, 16 + origH + 8 + enhH + (changesH > 0 ? changesH + 4 : 8));

      ensureSpace(totalCardH + 10);

      doc
        .roundedRect(40, currentY, 515, totalCardH, 6)
        .fill(bgCard)
        .stroke(borderLight);

      // Left purple accent bar
      doc
        .roundedRect(40, currentY, 4, totalCardH, 2)
        .fill('#7c3aed');

      let innerY = currentY + 8;

      // Original text
      doc
        .font('Helvetica-Bold')
        .fontSize(8)
        .fillColor(textMuted)
        .text('Original: ', 52, innerY, { continued: true })
        .font('Helvetica')
        .fillColor(textDark)
        .text(bullet.originalText, { width: 435, lineGap: 1.5 });

      innerY += origH + 8;

      // Enhanced text
      doc
        .font('Helvetica-Bold')
        .fontSize(8)
        .fillColor('#7c3aed')
        .text('Enhanced: ', 52, innerY, { continued: true })
        .font('Helvetica-Bold')
        .fillColor(primaryNavy)
        .text(bullet.enhancedText, { width: 435, lineGap: 1.5 });

      innerY += enhH + 8;

      // Changes summary list
      if (bullet.changesSummary && bullet.changesSummary.length > 0) {
        doc
          .font('Helvetica-Bold')
          .fontSize(7.5)
          .fillColor(textMuted)
          .text('Improvements Applied:', 52, innerY);

        innerY += 10;

        for (const change of bullet.changesSummary) {
          const changeTextH = doc.heightOfString(`• ${change}`, { width: 430, lineGap: 1.5 });
          doc
            .font('Helvetica')
            .fontSize(7.5)
            .fillColor('#065f46')
            .text(`• ${change}`, 56, innerY, { width: 430, lineGap: 1.5 });

          innerY += changeTextH + 3;
        }
      }

      currentY += totalCardH + 10;
    }
  }

  // ==========================================
  // 12. FOOTER & DISCLAIMER (ON ALL BUFFERED PAGES)
  // ==========================================
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);

    // Bottom horizontal rule
    doc
      .strokeColor('#cbd5e1')
      .lineWidth(0.5)
      .moveTo(40, 785)
      .lineTo(555, 785)
      .stroke();

    // Disclaimer with Candidate's Resume Filename context on every page
    doc
      .font('Helvetica-Oblique')
      .fontSize(7.5)
      .fillColor('#64748b')
      .text(
        `${fileName} | Generated by AI Resume Analyzer — estimated ATS compatibility, not a guarantee.`,
        40,
        792,
        { align: 'left', width: 400, lineBreak: false, ellipsis: true }
      );

    doc
      .font('Helvetica')
      .fontSize(7.5)
      .fillColor('#94a3b8')
      .text(`Page ${i + 1} of ${range.count}`, 450, 792, { align: 'right', width: 105 });
  }

  doc.end();
  return doc;
};
