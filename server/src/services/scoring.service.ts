import { IParsedSections } from '../models/Resume';

export type RoleCategory =
  | 'software_engineering'
  | 'data_analytics'
  | 'hardware_vlsi'
  | 'core_engineering'
  | 'design_creative'
  | 'general_business'
  | 'general'
  | 'other';

export interface RoleWeightProfile {
  name: string;
  description: string;
  weights: {
    keywordMatch: number;
    sectionCompleteness: number;
    contactInfo: number;
    actionVerbs: number;
    quantifiedImpact: number;
    formattingCleanliness: number;
  };
}

/**
 * Role-specific ATS weight profiles.
 * Every profile sums to exactly 100 total points across the 6 core deterministic factors.
 */
export const ROLE_WEIGHT_PROFILES: Record<RoleCategory, RoleWeightProfile> = {
  general: {
    name: 'General Industry',
    description: 'Standard balanced ATS weighting across all core factors.',
    weights: {
      keywordMatch: 25,
      sectionCompleteness: 20,
      contactInfo: 15,
      actionVerbs: 15,
      quantifiedImpact: 15,
      formattingCleanliness: 10,
    },
  },
  other: {
    name: 'General Industry',
    description: 'Standard balanced ATS weighting across all core factors.',
    weights: {
      keywordMatch: 25,
      sectionCompleteness: 20,
      contactInfo: 15,
      actionVerbs: 15,
      quantifiedImpact: 15,
      formattingCleanliness: 10,
    },
  },
  software_engineering: {
    name: 'Software Engineering',
    description: 'Weighted towards high-impact action verbs and technical achievements.',
    weights: {
      keywordMatch: 25,
      sectionCompleteness: 15,
      contactInfo: 10,
      actionVerbs: 20,
      quantifiedImpact: 20,
      formattingCleanliness: 10,
    },
  },
  data_analytics: {
    name: 'Data & Analytics',
    description: 'Heavily weighted towards quantifiable metrics, statistical outcomes, and tooling.',
    weights: {
      keywordMatch: 25,
      sectionCompleteness: 15,
      contactInfo: 10,
      actionVerbs: 15,
      quantifiedImpact: 25,
      formattingCleanliness: 10,
    },
  },
  hardware_vlsi: {
    name: 'Hardware & VLSI',
    description: 'Prioritizes domain-specific hardware keywords, RTL architecture, and metrics.',
    weights: {
      keywordMatch: 30,
      sectionCompleteness: 15,
      contactInfo: 10,
      actionVerbs: 15,
      quantifiedImpact: 20,
      formattingCleanliness: 10,
    },
  },
  core_engineering: {
    name: 'Core Engineering',
    description: 'Emphasizes standard technical sections, project metrics, and domain tools.',
    weights: {
      keywordMatch: 25,
      sectionCompleteness: 20,
      contactInfo: 10,
      actionVerbs: 15,
      quantifiedImpact: 20,
      formattingCleanliness: 10,
    },
  },
  design_creative: {
    name: 'Design & Creative',
    description: 'Emphasizes portfolio links, layout cleanliness, and visual presentation.',
    weights: {
      keywordMatch: 20,
      sectionCompleteness: 15,
      contactInfo: 20,
      actionVerbs: 10,
      quantifiedImpact: 15,
      formattingCleanliness: 20,
    },
  },
  general_business: {
    name: 'Business & Management',
    description: 'Prioritizes leadership action verbs, business metrics, and revenue impact.',
    weights: {
      keywordMatch: 20,
      sectionCompleteness: 15,
      contactInfo: 15,
      actionVerbs: 20,
      quantifiedImpact: 20,
      formattingCleanliness: 10,
    },
  },
};

/**
 * Fast, free, keyword-driven role classifier.
 * Evaluates JD or resume text against domain keyword sets without external AI calls.
 */
const ROLE_KEYWORDS: Record<string, string[]> = {
  software_engineering: [
    'software', 'developer', 'frontend', 'backend', 'full stack', 'fullstack', 'react', 'node', 'nodejs',
    'python', 'java', 'javascript', 'typescript', 'c++', 'golang', 'api', 'devops', 'cloud', 'aws', 'docker',
    'kubernetes', 'microservices', 'web development', 'mobile app', 'ios', 'android', 'flutter', 'git'
  ],
  data_analytics: [
    'data science', 'data scientist', 'data analyst', 'analytics', 'machine learning', 'deep learning',
    'ai', 'nlp', 'computer vision', 'statistics', 'sql', 'pandas', 'numpy', 'tableau', 'power bi',
    'big data', 'spark', 'hadoop', 'predictive modeling', 'data engineer', 'pytorch', 'tensorflow'
  ],
  hardware_vlsi: [
    'verilog', 'vhdl', 'systemverilog', 'vlsi', 'embedded', 'fpga', 'microcontroller', 'pcb', 'asic',
    'semiconductor', 'rtl', 'dsp', 'cadence', 'synopsys', 'circuit design', 'soc', 'arm', 'firmware'
  ],
  core_engineering: [
    'mechanical', 'civil', 'electrical', 'autocad', 'solidworks', 'ansys', 'thermodynamics', 'structural',
    'thermal', 'manufacturing', 'turbines', 'boilers', 'hvac', 'construction', 'aerospace', 'automotive'
  ],
  design_creative: [
    'ui', 'ux', 'ui/ux', 'user interface', 'user experience', 'figma', 'product designer', 'visual designer',
    'graphic designer', 'wireframing', 'prototyping', 'adobe xd', 'illustrator', 'photoshop', 'creative'
  ],
  general_business: [
    'business analyst', 'product manager', 'project manager', 'program manager', 'sales', 'marketing',
    'operations', 'finance', 'consulting', 'strategy', 'scrum master', 'agile', 'supply chain', 'hr'
  ],
};

export const classifyRoleCategory = (text?: string): RoleCategory => {
  if (!text || text.trim() === '') return 'general';
  const lower = text.toLowerCase();

  let bestCategory: RoleCategory = 'general';
  let maxMatches = 0;

  for (const [cat, keywords] of Object.entries(ROLE_KEYWORDS)) {
    let matches = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        matches++;
      }
    }
    if (matches > maxMatches) {
      maxMatches = matches;
      bestCategory = cat as RoleCategory;
    }
  }

  return maxMatches >= 2 ? bestCategory : 'general';
};

export interface ScoreBreakdownCategory {
  score: number;
  maxScore: number;
  label: string;
  feedback: string;
}

export interface AtsScoreResult {
  estimatedAtsScore: number;
  disclaimer: string;
  roleCategory: RoleCategory;
  scoringProfile: string;
  scoringProfileDescription: string;
  breakdown: {
    keywordMatch: ScoreBreakdownCategory;
    sectionCompleteness: ScoreBreakdownCategory;
    contactInfo: ScoreBreakdownCategory;
    actionVerbs: ScoreBreakdownCategory;
    quantifiedImpact: ScoreBreakdownCategory;
    formattingCleanliness: ScoreBreakdownCategory;
    scoringProfile?: string;
    roleCategory?: string;
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
 * dynamically weighted by role category.
 */
export const calculateAtsScore = (
  resumeText: string,
  parsedSections: IParsedSections,
  jobDescriptionText?: string,
  explicitRoleCategory?: string
): AtsScoreResult => {
  const text = resumeText || '';
  const lowerText = text.toLowerCase();

  // 1. Resolve role classification & weight profile
  let detectedCategory: RoleCategory = (explicitRoleCategory as RoleCategory) || 'general';
  if (!explicitRoleCategory) {
    if (jobDescriptionText && jobDescriptionText.trim() !== '') {
      detectedCategory = classifyRoleCategory(jobDescriptionText);
    } else {
      // Resume-only fallback (inferred from resume skills/text or defaults to general)
      const inferred = classifyRoleCategory(text);
      detectedCategory = inferred !== 'general' ? inferred : 'general';
    }
  }

  const profile = ROLE_WEIGHT_PROFILES[detectedCategory] || ROLE_WEIGHT_PROFILES.general;
  const weights = profile.weights;

  // -------------------------------------------------------------------------
  // 1. Keyword & Skills Match
  // -------------------------------------------------------------------------
  const maxKeyword = weights.keywordMatch;
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
    keywordScore = Math.min(maxKeyword, Math.round(ratio * maxKeyword));
    keywordFeedback = `Matched ${matches.length} keywords from the target job description.`;
  } else {
    const skillCount = parsedSections.skills?.length || 0;
    if (skillCount >= 8) {
      keywordScore = maxKeyword;
      keywordFeedback = `Extracted ${skillCount} strong technical & domain skills.`;
    } else if (skillCount >= 5) {
      keywordScore = Math.round(maxKeyword * 0.8);
      keywordFeedback = `Extracted ${skillCount} skills. Adding more industry keywords will increase score.`;
    } else if (skillCount >= 2) {
      keywordScore = Math.round(maxKeyword * 0.48);
      keywordFeedback = `Only ${skillCount} skills identified. Consider listing more core tools.`;
    } else {
      keywordScore = Math.round(maxKeyword * 0.2);
      keywordFeedback = 'Few or no distinct skills detected.';
    }
  }

  // -------------------------------------------------------------------------
  // 2. Standard Section Presence
  // -------------------------------------------------------------------------
  const maxSection = weights.sectionCompleteness;
  let sectionScore = 0;
  const missingSections: string[] = [];

  const pointsPerSection = maxSection / 4;
  if (parsedSections.skills && parsedSections.skills.length > 0) {
    sectionScore += pointsPerSection;
  } else {
    missingSections.push('Skills');
  }

  if (parsedSections.experience && parsedSections.experience.length > 0) {
    sectionScore += pointsPerSection;
  } else {
    missingSections.push('Experience');
  }

  if (parsedSections.education && parsedSections.education.length > 0) {
    sectionScore += pointsPerSection;
  } else {
    missingSections.push('Education');
  }

  if (parsedSections.projects && parsedSections.projects.length > 0) {
    sectionScore += pointsPerSection;
  } else {
    missingSections.push('Projects');
  }

  sectionScore = Math.round(sectionScore);
  const sectionFeedback =
    missingSections.length === 0
      ? 'All 4 essential standard sections (Skills, Experience, Education, Projects) are present.'
      : `Missing standard sections: ${missingSections.join(', ')}.`;

  // -------------------------------------------------------------------------
  // 3. Contact Info Completeness
  // -------------------------------------------------------------------------
  const maxContact = weights.contactInfo;
  let contactScore = 0;
  const contactDetailsFound: string[] = [];

  const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text);
  if (hasEmail) {
    contactScore += maxContact * 0.27;
    contactDetailsFound.push('Email');
  }

  const hasPhone = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\b\d{10}\b/.test(text);
  if (hasPhone) {
    contactScore += maxContact * 0.27;
    contactDetailsFound.push('Phone');
  }

  const hasLinks = /\b(linkedin\.com|github\.com|leetcode\.com|portfolio|github|linkedin|behance\.net|dribbble\.com)\b/i.test(text);
  if (hasLinks) {
    contactScore += maxContact * 0.27;
    contactDetailsFound.push('Professional Links');
  }

  const hasLocation = /\b(address|telangana|bangalore|hyderabad|mumbai|delhi|california|ny|city|state|street)\b/i.test(text);
  if (hasLocation) {
    contactScore += maxContact * 0.19;
    contactDetailsFound.push('Location');
  }

  contactScore = Math.min(maxContact, Math.round(contactScore));
  const contactFeedback = `Contact details verified: ${contactDetailsFound.join(', ') || 'None'}.`;

  // -------------------------------------------------------------------------
  // 4. Action Verbs & Power Words
  // -------------------------------------------------------------------------
  const maxAction = weights.actionVerbs;
  const matchedVerbs = ACTION_VERBS.filter((verb) => {
    const verbRegex = new RegExp(`\\b${verb}\\b`, 'i');
    return verbRegex.test(text);
  });

  let actionScore = 0;
  if (matchedVerbs.length >= 6) {
    actionScore = maxAction;
  } else if (matchedVerbs.length >= 4) {
    actionScore = Math.round(maxAction * 0.73);
  } else if (matchedVerbs.length >= 2) {
    actionScore = Math.round(maxAction * 0.47);
  } else if (matchedVerbs.length >= 1) {
    actionScore = Math.round(maxAction * 0.27);
  } else {
    actionScore = 0;
  }

  const actionFeedback = `Found ${matchedVerbs.length} high-impact action verbs (${matchedVerbs.slice(0, 4).join(', ')}${matchedVerbs.length > 4 ? ', ...' : ''}).`;

  // -------------------------------------------------------------------------
  // 5. Quantified Impact & Metrics
  // -------------------------------------------------------------------------
  const maxMetric = weights.quantifiedImpact;
  const metricRegex = /(?:\b\d+(?:,\d+)*(?:\.\d+)?%|\b\d+(?:,\d+)*\+|\b\d+(?:,\d+)*\s*(?:users|clients|students|customers|requests|transactions|ms|seconds|minutes|hours|days|k|m|gb|tb)\b|\$\d+(?:,\d+)*(?:\.\d+)?[kmb]?\b)/gi;
  const metricMatches = text.match(metricRegex) || [];

  let metricScore = 0;
  if (metricMatches.length >= 4) {
    metricScore = maxMetric;
  } else if (metricMatches.length >= 2) {
    metricScore = Math.round(maxMetric * 0.67);
  } else if (metricMatches.length >= 1) {
    metricScore = Math.round(maxMetric * 0.33);
  } else {
    metricScore = 0;
  }

  const metricFeedback =
    metricMatches.length > 0
      ? `Identified ${metricMatches.length} quantifiable metrics / impact numbers (${metricMatches.slice(0, 3).join(', ')}).`
      : 'No quantifiable metrics found. Adding numbers (e.g. 45% faster, 2,500+ users) boosts ATS scores.';

  // -------------------------------------------------------------------------
  // 6. Formatting & Red Flag Defenses
  // -------------------------------------------------------------------------
  const maxFormat = weights.formattingCleanliness;
  let formatScore = maxFormat;
  const formatIssues: string[] = [];

  const wordCount = text.split(/\s+/).filter(Boolean).length;
  if (wordCount < 80) {
    formatScore -= Math.round(maxFormat * 0.5);
    formatIssues.push('Resume text is too brief (under 80 words).');
  } else if (wordCount > 2000) {
    formatScore -= Math.round(maxFormat * 0.3);
    formatIssues.push('Resume exceeds optimal length (over 2,000 words).');
  }

  const capsMatches = text.match(/\b[A-Z]{4,}\b/g) || [];
  if (capsMatches.length > 25) {
    formatScore -= Math.round(maxFormat * 0.2);
    formatIssues.push('Excessive uppercase text detected.');
  }

  formatScore = Math.max(0, formatScore);
  const formattingFeedback =
    formatIssues.length === 0
      ? 'Clean formatting and optimal word count.'
      : formatIssues.join(' ');

  // -------------------------------------------------------------------------
  // Total Score & Summary
  // -------------------------------------------------------------------------
  const totalScore = keywordScore + sectionScore + contactScore + actionScore + metricScore + formatScore;
  const boundedScore = Math.min(100, Math.max(0, totalScore));

  let summary = '';
  if (boundedScore >= 85) {
    summary = `Excellent ATS compatibility for ${profile.name}. Resume is well-structured, metric-driven, and contains strong keywords.`;
  } else if (boundedScore >= 70) {
    summary = `Good ATS compatibility for ${profile.name}. Resume has strong foundations; adding more quantifiable metrics will improve ranking.`;
  } else if (boundedScore >= 50) {
    summary = `Moderate ATS compatibility for ${profile.name}. Improve section clarity, action verbs, and quantifiable achievements.`;
  } else {
    summary = `Low ATS compatibility for ${profile.name}. Add standard sections, contact info, and industry-standard technical keywords.`;
  }

  return {
    estimatedAtsScore: boundedScore,
    disclaimer:
      'Estimated ATS Compatibility Score based on role-contextual structural, keyword, action-oriented, and formatting heuristics. Not affiliated with any commercial ATS vendor.',
    roleCategory: detectedCategory,
    scoringProfile: profile.name,
    scoringProfileDescription: profile.description,
    breakdown: {
      keywordMatch: {
        score: keywordScore,
        maxScore: maxKeyword,
        label: 'Keyword & Skills Relevance',
        feedback: keywordFeedback,
      },
      sectionCompleteness: {
        score: sectionScore,
        maxScore: maxSection,
        label: 'Standard Section Structure',
        feedback: sectionFeedback,
      },
      contactInfo: {
        score: contactScore,
        maxScore: maxContact,
        label: 'Contact Information & Links',
        feedback: contactFeedback,
      },
      actionVerbs: {
        score: actionScore,
        maxScore: maxAction,
        label: 'Action-Oriented Language',
        feedback: actionFeedback,
      },
      quantifiedImpact: {
        score: metricScore,
        maxScore: maxMetric,
        label: 'Quantifiable Metrics & Impact',
        feedback: metricFeedback,
      },
      formattingCleanliness: {
        score: formatScore,
        maxScore: maxFormat,
        label: 'Formatting & Length Balance',
        feedback: formattingFeedback,
      },
      scoringProfile: profile.name,
      roleCategory: detectedCategory,
    },
    summary,
  };
};

export default calculateAtsScore;
