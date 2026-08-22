import { IParsedSections } from '../models/Resume';

export interface ScoreBreakdownCategory {
  score: number;
  maxScore: number;
  label: string;
  feedback: string;
}

export interface AtsScoreResult {
  estimatedAtsScore: number;
  disclaimer: string;
  breakdown: {
    keywordMatch: ScoreBreakdownCategory;
    sectionCompleteness: ScoreBreakdownCategory;
    contactInfo: ScoreBreakdownCategory;
    actionVerbs: ScoreBreakdownCategory;
    quantifiedImpact: ScoreBreakdownCategory;
    formattingCleanliness: ScoreBreakdownCategory;
  };
  summary: string;
}

const ACTION_VERBS = [
  'built', 'developed', 'architected', 'spearheaded', 'designed', 'implemented',
  'optimized', 'engineered', 'scaled', 'led', 'created', 'integrated', 'deployed',
  'refactored', 'automated', 'orchestrated', 'authored', 'managed', 'streamlined',
  'executed', 'enhanced', 'formulated', 'collaborated', 'programmed', 'coordinated'
];

/**
 * Calculates a deterministic, explainable Estimated ATS Compatibility Score (0-100)
 * based on keyword overlap, section presence, contact details, action verbs, and quantifiable impact.
 */
export const calculateAtsScore = (
  resumeText: string,
  parsedSections: IParsedSections,
  jobDescriptionText?: string
): AtsScoreResult => {
  const text = resumeText || '';
  const lowerText = text.toLowerCase();

  // 1. Keyword & Skills Match (Max: 25)
  let keywordScore = 0;
  let keywordFeedback = '';

  if (jobDescriptionText && jobDescriptionText.trim() !== '') {
    const jdWords = Array.from(
      new Set(
        jobDescriptionText
          .toLowerCase()
          .split(/[\s,.;:()/\-]+/)
          .filter((w) => w.length > 3 && !/^(with|from|have|this|that|your|will|their|about|more|must)$/.test(w))
      )
    );

    const matches = jdWords.filter((word) => lowerText.includes(word));
    const ratio = jdWords.length > 0 ? matches.length / jdWords.length : 0.5;
    keywordScore = Math.min(25, Math.round(ratio * 25));
    keywordFeedback = `Matched ${matches.length} keywords from the target job description.`;
  } else {
    const skillCount = parsedSections.skills?.length || 0;
    if (skillCount >= 8) {
      keywordScore = 25;
      keywordFeedback = `Extracted ${skillCount} strong technical & domain skills.`;
    } else if (skillCount >= 5) {
      keywordScore = 20;
      keywordFeedback = `Extracted ${skillCount} skills. Adding more industry keywords will increase score.`;
    } else if (skillCount >= 2) {
      keywordScore = 12;
      keywordFeedback = `Only ${skillCount} skills identified. Consider listing more core tools.`;
    } else {
      keywordScore = 5;
      keywordFeedback = 'Few or no distinct skills detected.';
    }
  }

  // 2. Standard Section Presence (Max: 20)
  let sectionScore = 0;
  const missingSections: string[] = [];

  if (parsedSections.skills && parsedSections.skills.length > 0) {
    sectionScore += 5;
  } else {
    missingSections.push('Skills');
  }

  if (parsedSections.experience && parsedSections.experience.length > 0) {
    sectionScore += 5;
  } else {
    missingSections.push('Experience');
  }

  if (parsedSections.education && parsedSections.education.length > 0) {
    sectionScore += 5;
  } else {
    missingSections.push('Education');
  }

  if (parsedSections.projects && parsedSections.projects.length > 0) {
    sectionScore += 5;
  } else {
    missingSections.push('Projects');
  }

  const sectionFeedback =
    missingSections.length === 0
      ? 'All 4 essential standard sections (Skills, Experience, Education, Projects) are present.'
      : `Missing standard sections: ${missingSections.join(', ')}.`;

  // 3. Contact Info Completeness (Max: 15)
  let contactScore = 0;
  const contactDetailsFound: string[] = [];

  const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text);
  if (hasEmail) {
    contactScore += 4;
    contactDetailsFound.push('Email');
  }

  const hasPhone = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\b\d{10}\b/.test(text);
  if (hasPhone) {
    contactScore += 4;
    contactDetailsFound.push('Phone');
  }

  const hasLinks = /\b(linkedin\.com|github\.com|leetcode\.com|portfolio|github|linkedin)\b/i.test(text);
  if (hasLinks) {
    contactScore += 4;
    contactDetailsFound.push('Professional Links');
  }

  const hasLocation = /\b(address|telangana|bangalore|hyderabad|mumbai|delhi|california|ny|city|state|street)\b/i.test(text);
  if (hasLocation) {
    contactScore += 3;
    contactDetailsFound.push('Location');
  }

  const contactFeedback = `Contact details verified: ${contactDetailsFound.join(', ') || 'None'}.`;

  // 4. Action Verbs & Power Words (Max: 15)
  const matchedVerbs = ACTION_VERBS.filter((verb) => {
    const verbRegex = new RegExp(`\\b${verb}\\b`, 'i');
    return verbRegex.test(text);
  });

  let actionScore = 0;
  if (matchedVerbs.length >= 6) {
    actionScore = 15;
  } else if (matchedVerbs.length >= 4) {
    actionScore = 11;
  } else if (matchedVerbs.length >= 2) {
    actionScore = 7;
  } else if (matchedVerbs.length >= 1) {
    actionScore = 4;
  } else {
    actionScore = 0;
  }

  const actionFeedback = `Found ${matchedVerbs.length} high-impact action verbs (${matchedVerbs.slice(0, 4).join(', ')}${matchedVerbs.length > 4 ? ', ...' : ''}).`;

  // 5. Quantified Impact & Metrics (Max: 15)
  const metricRegex = /(?:\b\d+(?:,\d+)*(?:\.\d+)?%|\b\d+(?:,\d+)*\+|\b\d+(?:,\d+)*\s*(?:users|clients|students|customers|requests|transactions|ms|seconds|minutes|hours|days|k|m|gb|tb)\b|\$\d+(?:,\d+)*(?:\.\d+)?[kmb]?\b)/gi;
  const metricMatches = text.match(metricRegex) || [];

  let metricScore = 0;
  if (metricMatches.length >= 4) {
    metricScore = 15;
  } else if (metricMatches.length >= 2) {
    metricScore = 10;
  } else if (metricMatches.length >= 1) {
    metricScore = 5;
  } else {
    metricScore = 0;
  }

  const metricFeedback =
    metricMatches.length > 0
      ? `Identified ${metricMatches.length} quantifiable metrics / impact numbers (${metricMatches.slice(0, 3).join(', ')}).`
      : 'No quantifiable metrics found. Adding numbers (e.g. 45% faster, 2,500+ users) boosts ATS scores.';

  // 6. Formatting & Red Flag Defenses (Max: 10)
  let formatScore = 10;
  const formatIssues: string[] = [];

  const wordCount = text.split(/\s+/).filter(Boolean).length;
  if (wordCount < 80) {
    formatScore -= 5;
    formatIssues.push('Resume text is too brief (under 80 words).');
  } else if (wordCount > 2000) {
    formatScore -= 3;
    formatIssues.push('Resume exceeds optimal length (over 2,000 words).');
  }

  // Check for excessive ALL CAPS text
  const capsMatches = text.match(/\b[A-Z]{4,}\b/g) || [];
  if (capsMatches.length > 25) {
    formatScore -= 2;
    formatIssues.push('Excessive uppercase text detected.');
  }

  formatScore = Math.max(0, formatScore);
  const formattingFeedback =
    formatIssues.length === 0
      ? 'Clean formatting and optimal word count.'
      : formatIssues.join(' ');

  // Total Score (0-100)
  const totalScore = keywordScore + sectionScore + contactScore + actionScore + metricScore + formatScore;
  const boundedScore = Math.min(100, Math.max(0, totalScore));

  let summary = '';
  if (boundedScore >= 85) {
    summary = 'Excellent ATS compatibility. Resume is well-structured, metric-driven, and contains strong keywords.';
  } else if (boundedScore >= 70) {
    summary = 'Good ATS compatibility. Resume has strong foundations; adding more quantifiable metrics will improve ranking.';
  } else if (boundedScore >= 50) {
    summary = 'Moderate ATS compatibility. Improve section clarity, action verbs, and quantifiable achievements.';
  } else {
    summary = 'Low ATS compatibility. Add standard sections, contact info, and industry-standard technical keywords.';
  }

  return {
    estimatedAtsScore: boundedScore,
    disclaimer:
      'Estimated ATS Compatibility Score based on structural, keyword, action-oriented, and formatting heuristics. Not affiliated with any commercial ATS vendor.',
    breakdown: {
      keywordMatch: {
        score: keywordScore,
        maxScore: 25,
        label: 'Keyword & Skills Relevance',
        feedback: keywordFeedback,
      },
      sectionCompleteness: {
        score: sectionScore,
        maxScore: 20,
        label: 'Standard Section Structure',
        feedback: sectionFeedback,
      },
      contactInfo: {
        score: contactScore,
        maxScore: 15,
        label: 'Contact Information & Links',
        feedback: contactFeedback,
      },
      actionVerbs: {
        score: actionScore,
        maxScore: 15,
        label: 'Action-Oriented Language',
        feedback: actionFeedback,
      },
      quantifiedImpact: {
        score: metricScore,
        maxScore: 15,
        label: 'Quantifiable Metrics & Impact',
        feedback: metricFeedback,
      },
      formattingCleanliness: {
        score: formatScore,
        maxScore: 10,
        label: 'Formatting & Length Balance',
        feedback: formattingFeedback,
      },
    },
    summary,
  };
};
