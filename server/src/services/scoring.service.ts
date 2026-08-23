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
    writingQuality: number;
  };
}

/**
 * Role-specific ATS weight profiles.
 * Every profile sums to exactly 100 total points across the 7 core deterministic factors.
 */
export const ROLE_WEIGHT_PROFILES: Record<RoleCategory, RoleWeightProfile> = {
  general: {
    name: 'General Industry',
    description: 'Standard balanced ATS weighting across all core factors.',
    weights: {
      keywordMatch: 20,
      sectionCompleteness: 15,
      contactInfo: 10,
      actionVerbs: 15,
      quantifiedImpact: 15,
      formattingCleanliness: 10,
      writingQuality: 15,
    },
  },
  other: {
    name: 'General Industry',
    description: 'Standard balanced ATS weighting across all core factors.',
    weights: {
      keywordMatch: 20,
      sectionCompleteness: 15,
      contactInfo: 10,
      actionVerbs: 15,
      quantifiedImpact: 15,
      formattingCleanliness: 10,
      writingQuality: 15,
    },
  },
  software_engineering: {
    name: 'Software Engineering',
    description: 'Weighted towards high-impact action verbs, technical achievements, and domain skills.',
    weights: {
      keywordMatch: 20,
      sectionCompleteness: 10,
      contactInfo: 10,
      actionVerbs: 20,
      quantifiedImpact: 20,
      formattingCleanliness: 10,
      writingQuality: 10,
    },
  },
  data_analytics: {
    name: 'Data & Analytics',
    description: 'Heavily weighted towards quantifiable metrics, statistical outcomes, and tooling.',
    weights: {
      keywordMatch: 20,
      sectionCompleteness: 10,
      contactInfo: 10,
      actionVerbs: 15,
      quantifiedImpact: 25,
      formattingCleanliness: 10,
      writingQuality: 10,
    },
  },
  hardware_vlsi: {
    name: 'Hardware & VLSI',
    description: 'Prioritizes domain-specific hardware keywords, RTL architecture, and metrics.',
    weights: {
      keywordMatch: 25,
      sectionCompleteness: 10,
      contactInfo: 10,
      actionVerbs: 15,
      quantifiedImpact: 20,
      formattingCleanliness: 10,
      writingQuality: 10,
    },
  },
  core_engineering: {
    name: 'Core Engineering',
    description: 'Emphasizes standard technical sections, project metrics, and domain tools.',
    weights: {
      keywordMatch: 20,
      sectionCompleteness: 15,
      contactInfo: 10,
      actionVerbs: 15,
      quantifiedImpact: 20,
      formattingCleanliness: 10,
      writingQuality: 10,
    },
  },
  design_creative: {
    name: 'Design & Creative',
    description: 'Emphasizes portfolio links, layout cleanliness, phrasing variety, and visual presentation.',
    weights: {
      keywordMatch: 15,
      sectionCompleteness: 15,
      contactInfo: 15,
      actionVerbs: 10,
      quantifiedImpact: 15,
      formattingCleanliness: 15,
      writingQuality: 15,
    },
  },
  general_business: {
    name: 'Business & Management',
    description: 'Prioritizes leadership action verbs, business metrics, and revenue impact.',
    weights: {
      keywordMatch: 15,
      sectionCompleteness: 10,
      contactInfo: 10,
      actionVerbs: 20,
      quantifiedImpact: 20,
      formattingCleanliness: 10,
      writingQuality: 15,
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
    writingQuality: ScoreBreakdownCategory;
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
 * Curated dictionary of common spelling errors frequently appearing in resumes.
 */
const COMMON_TYPOS: Record<string, string> = {
  acheive: 'achieve',
  acheived: 'achieved',
  acheivement: 'achievement',
  acheivements: 'achievements',
  analisys: 'analysis',
  analize: 'analyze',
  analized: 'analyzed',
  architechture: 'architecture',
  architech: 'architect',
  architechtural: 'architectural',
  asist: 'assist',
  asisted: 'assisted',
  asistance: 'assistance',
  avialable: 'available',
  availiable: 'available',
  buisness: 'business',
  busines: 'business',
  calender: 'calendar',
  collaberated: 'collaborated',
  collabarate: 'collaborate',
  collaberation: 'collaboration',
  comunication: 'communication',
  comunicate: 'communicate',
  confortable: 'comfortable',
  databse: 'database',
  databses: 'databases',
  definately: 'definitely',
  definate: 'definite',
  developement: 'development',
  develope: 'develop',
  developped: 'developed',
  developr: 'developer',
  documantation: 'documentation',
  documant: 'document',
  effecient: 'efficient',
  efficent: 'efficient',
  effeciently: 'efficiently',
  enviroment: 'environment',
  enviromental: 'environmental',
  engeneer: 'engineer',
  enginer: 'engineer',
  engeneering: 'engineering',
  evalution: 'evaluation',
  evalute: 'evaluate',
  experiance: 'experience',
  experianced: 'experienced',
  faciliate: 'facilitate',
  faciliated: 'facilitated',
  flater: 'flutter',
  frameowrk: 'framework',
  framwork: 'framework',
  fronend: 'frontend',
  frontned: 'frontend',
  guarentee: 'guarantee',
  garantee: 'guarantee',
  implimented: 'implemented',
  impliment: 'implement',
  implimentation: 'implementation',
  independant: 'independent',
  independantaly: 'independently',
  intigrated: 'integrated',
  intigration: 'integration',
  knowlege: 'knowledge',
  knowlegeable: 'knowledgeable',
  leaded: 'led',
  leaderhip: 'leadership',
  libary: 'library',
  libaries: 'libraries',
  maintainance: 'maintenance',
  maintanence: 'maintenance',
  managment: 'management',
  managament: 'management',
  manger: 'manager',
  neccessary: 'necessary',
  necessery: 'necessary',
  occured: 'occurred',
  occuring: 'occurring',
  oppurtunity: 'opportunity',
  opurtunity: 'opportunity',
  oppurtunities: 'opportunities',
  optmize: 'optimize',
  optmized: 'optimized',
  optmization: 'optimization',
  peformance: 'performance',
  preformance: 'performance',
  preceeding: 'preceding',
  privelege: 'privilege',
  priviledge: 'privilege',
  profesional: 'professional',
  proffessional: 'professional',
  programing: 'programming',
  programer: 'programmer',
  recommand: 'recommend',
  recommanded: 'recommended',
  reccomend: 'recommend',
  recieved: 'received',
  recieve: 'receive',
  recieving: 'receiving',
  referance: 'reference',
  refered: 'referred',
  relavent: 'relevant',
  relevent: 'relevant',
  reponsible: 'responsible',
  responcible: 'responsible',
  responsibilty: 'responsibility',
  responsabilities: 'responsibilities',
  requirment: 'requirement',
  requiremnts: 'requirements',
  requirments: 'requirements',
  scedule: 'schedule',
  schedual: 'schedule',
  seperate: 'separate',
  seperated: 'separated',
  strategie: 'strategy',
  stratagy: 'strategy',
  succesful: 'successful',
  sucessful: 'successful',
  successfully: 'successfully',
  sucessfully: 'successfully',
  supervize: 'supervise',
  supervized: 'supervised',
  technolgy: 'technology',
  techology: 'technology',
  tommorrow: 'tomorrow',
  transferred: 'transferred',
  transfered: 'transferred',
  unforseen: 'unforeseen',
  untill: 'until',
  upgradeable: 'upgradable',
  usefull: 'useful',
  writting: 'writing',
};

/**
 * Whitelist of technical acronyms and domain tools that must NEVER be flagged as spelling errors.
 */
const TECH_WHITELIST = new Set([
  'aws', 'gcp', 'azure', 'ci', 'cd', 'api', 'apis', 'rest', 'restful', 'graphql',
  'sql', 'nosql', 'json', 'xml', 'html', 'css', 'sass', 'scss', 'jwt', 'sso', 'oauth',
  'sdk', 'sdks', 'cli', 'gui', 'iot', 'saas', 'paas', 'iaas', 'erp', 'crm', 'etl',
  'k8s', 'kubernetes', 'docker', 'kafka', 'redis', 'nginx', 'linux', 'unix', 'git',
  'github', 'gitlab', 'jira', 'confluence', 'agile', 'scrum', 'kanban', 'devops',
  'sre', 'ci/cd', 'frontend', 'backend', 'fullstack', 'ui', 'ux', 'ai', 'ml', 'nlp',
  'opencv', 'llm', 'llms', 'rag', 'pytorch', 'tensorflow', 'scikit', 'numpy', 'pandas',
  'react', 'redux', 'nextjs', 'vue', 'angular', 'svelte', 'nodejs', 'express', 'nestjs',
  'fastapi', 'flask', 'django', 'spring', 'springboot', 'hibernate', 'microservices',
  'postgresql', 'postgres', 'mysql', 'mongodb', 'sqlite', 'dynamodb', 'cassandra',
  'typescript', 'javascript', 'python', 'java', 'c++', 'c#', 'golang', 'rust', 'ruby',
  'php', 'swift', 'kotlin', 'dart', 'scala', 'r', 'matlab', 'verilog', 'vhdl', 'systemverilog',
  'fpga', 'asic', 'pcb', 'rtl', 'vlsi', 'cadence', 'synopsys', 'solidworks', 'ansys', 'autocad',
  'figma', 'canva', 'photoshop', 'illustrator', 'tableau', 'powerbi', 'spark', 'hadoop',
  'linkedin', 'leetcode', 'hackerrank', 'geeksforgeeks', 'codeforces', 'kaggle', 'medium'
]);

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
  // 6. Formatting & Structural Integrity Checks (Granular ATS Red Flags)
  // -------------------------------------------------------------------------
  const maxFormat = weights.formattingCleanliness;
  let formatScore = maxFormat;
  const formatIssues: string[] = [];

  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // A. Word Count Check
  if (wordCount < 80) {
    formatScore -= Math.round(maxFormat * 0.4);
    formatIssues.push('Resume text is unusually brief (under 80 words).');
  } else if (wordCount > 2200) {
    formatScore -= Math.round(maxFormat * 0.2);
    formatIssues.push('Resume exceeds optimal length (over 2,200 words).');
  }

  // B. Excessive Casing Check
  const capsMatches = text.match(/\b[A-Z]{4,}\b/g) || [];
  if (capsMatches.length > 25) {
    formatScore -= Math.round(maxFormat * 0.15);
    formatIssues.push('Potential excessive uppercase text detected.');
  }

  // C. Multi-Column Layout Risk Check
  // Heuristic approximation: Abnormally high frequency of consecutive short orphaned lines
  // (< 4 words or < 28 chars) in a medium/long resume often indicates column-scrambled text extraction.
  const rawLines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  if (rawLines.length >= 25 && wordCount >= 120) {
    const shortFragmentedLines = rawLines.filter((line) => {
      const lineWords = line.split(/\s+/).filter(Boolean);
      return (
        lineWords.length <= 3 &&
        line.length < 28 &&
        !/^(skills|experience|education|projects|summary|certifications|awards|contact|languages|tools|profile)$/i.test(line)
      );
    });

    const shortLineRatio = shortFragmentedLines.length / rawLines.length;
    if (shortLineRatio > 0.42) {
      formatScore -= Math.round(maxFormat * 0.25);
      formatIssues.push(
        'Potential multi-column layout detected — side-by-side columns may cause ATS parsers to interleave text out of order. Consider a single-column layout.'
      );
    }
  }

  // D. Non-Standard Section Headings Check
  // Check if standard sections (Skills, Experience, Education, Projects) failed to be parsed despite substantial content length
  const standardSectionsDetected = [
    parsedSections.skills && parsedSections.skills.length > 0,
    parsedSections.experience && parsedSections.experience.length > 0,
    parsedSections.education && parsedSections.education.length > 0,
    parsedSections.projects && parsedSections.projects.length > 0,
  ].filter(Boolean).length;

  if (wordCount >= 250 && standardSectionsDetected <= 1) {
    formatScore -= Math.round(maxFormat * 0.25);
    formatIssues.push(
      'Potential non-standard section headings detected — standard ATS parsers look for conventional labels like "Experience", "Education", "Skills", and "Projects".'
    );
  }

  // E. Header/Footer Contamination Check
  // Check for repeated short lines (e.g. page numbers, candidate name + contact banner, or running footers) appearing >= 2 times
  if (rawLines.length >= 20) {
    const lineFrequency: Record<string, number> = {};
    for (const line of rawLines) {
      const normalized = line.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
      if (
        normalized.length >= 8 &&
        normalized.length <= 65 &&
        !/^(skills|experience|education|projects|summary|certifications|awards|contact|languages|tools|profile|work experience|technical skills)$/i.test(
          normalized
        )
      ) {
        lineFrequency[normalized] = (lineFrequency[normalized] || 0) + 1;
      }
    }

    const repeatedLines = Object.entries(lineFrequency).filter(([_, count]) => count >= 2);
    if (repeatedLines.length >= 2) {
      formatScore -= Math.round(maxFormat * 0.15);
      formatIssues.push(
        'Potential repeated running header/footer detected — some ATS systems misplace or truncate information placed in document margins.'
      );
    }
  }

  formatScore = Math.min(maxFormat, Math.max(0, formatScore));
  const formattingFeedback =
    formatIssues.length === 0
      ? 'Clean single-column formatting, standard section headings, and optimal word count.'
      : formatIssues.join(' ');

  // -------------------------------------------------------------------------
  // 7. Writing Quality, Spelling & Phrasing Variety
  // -------------------------------------------------------------------------
  const maxWriting = weights.writingQuality;
  let writingScore = maxWriting;
  const writingIssues: string[] = [];

  // A. Common Spelling Typos Check (with dynamic skills & tech whitelist)
  const foundTypos: string[] = [];
  const textWords = text.split(/[\s,.;:()/\-–—\[\]{}"]+/).filter(Boolean);

  const dynamicSkillWhitelist = new Set<string>();
  if (parsedSections.skills) {
    parsedSections.skills.forEach((s) => {
      s.toLowerCase()
        .split(/[\s/]+/)
        .forEach((w) => {
          const clean = w.replace(/[^a-z0-9]/g, '');
          if (clean.length > 1) dynamicSkillWhitelist.add(clean);
        });
    });
  }

  for (const rawWord of textWords) {
    const cleanWord = rawWord.toLowerCase().replace(/[^a-z]/g, '');
    if (cleanWord.length < 3) continue;

    if (COMMON_TYPOS[cleanWord]) {
      const correction = COMMON_TYPOS[cleanWord];
      if (!TECH_WHITELIST.has(cleanWord) && !dynamicSkillWhitelist.has(cleanWord)) {
        const typoReport = `'${cleanWord}' (suggested: ${correction})`;
        if (!foundTypos.includes(typoReport)) {
          foundTypos.push(typoReport);
        }
      }
    }
  }

  // Check for duplicated consecutive words (e.g. "the the", "with with")
  const duplicateWords: string[] = [];
  const dupRegex = /\b([a-zA-Z]{3,})\s+\1\b/gi;
  let dupMatch: RegExpExecArray | null;
  while ((dupMatch = dupRegex.exec(text)) !== null) {
    const dupWord = dupMatch[1].toLowerCase();
    if (!TECH_WHITELIST.has(dupWord) && !duplicateWords.includes(dupWord)) {
      duplicateWords.push(dupWord);
    }
  }

  if (foundTypos.length > 0) {
    const penalty = Math.min(
      Math.round(maxWriting * 0.45),
      foundTypos.length * Math.max(1, Math.round(maxWriting * 0.18))
    );
    writingScore -= penalty;
    writingIssues.push(
      `Flagged ${foundTypos.length} potential spelling issue${foundTypos.length > 1 ? 's' : ''}: ${foundTypos.slice(0, 3).join(', ')}.`
    );
  }

  if (duplicateWords.length > 0) {
    writingScore -= Math.min(Math.round(maxWriting * 0.2), duplicateWords.length * 2);
    writingIssues.push(
      `Repeated consecutive word${duplicateWords.length > 1 ? 's' : ''} detected: ${duplicateWords.map((w) => `'${w} ${w}'`).join(', ')}.`
    );
  }

  // B. Bullet Opening Verb Repetition Check
  const bulletLines = rawLines.filter(
    (line) => /^[•\-\*–—\d+\.]\s*/.test(line) || (line.length >= 25 && line.length <= 250)
  );
  const startingVerbs: string[] = [];

  for (const b of bulletLines) {
    const clean = b.replace(/^[•\-\*–—\d+\.]+\s*/, '').trim();
    const firstWord = clean.split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, '');
    if (
      firstWord &&
      firstWord.length >= 3 &&
      !/^(the|and|for|with|from|this|that|also|each|into|over|upon|via)$/.test(firstWord)
    ) {
      startingVerbs.push(firstWord);
    }
  }

  const verbFreq: Record<string, number> = {};
  for (const v of startingVerbs) {
    verbFreq[v] = (verbFreq[v] || 0) + 1;
  }

  const overusedVerbs = Object.entries(verbFreq).filter(([_, count]) => count >= 4);
  if (overusedVerbs.length > 0) {
    writingScore -= Math.round(maxWriting * 0.25);
    const verbList = overusedVerbs.map(([verb, count]) => `'${verb}' (${count}x)`).join(', ');
    writingIssues.push(
      `High repetition in bullet openings: started 4+ bullet points with ${verbList}. Varying action verbs demonstrates broader ownership.`
    );
  }

  // C. Passive / Weak Filler Phrase Check
  const foundFillers: string[] = [];
  const FILLER_PHRASES = [
    { phrase: 'responsible for', threshold: 3, label: "'responsible for'" },
    { phrase: 'worked on', threshold: 4, label: "'worked on'" },
    { phrase: 'helped to', threshold: 3, label: "'helped to'" },
    { phrase: 'assisted with', threshold: 3, label: "'assisted with'" },
    { phrase: 'tasked with', threshold: 2, label: "'tasked with'" },
    { phrase: 'duties included', threshold: 2, label: "'duties included'" },
    { phrase: 'participated in', threshold: 3, label: "'participated in'" },
  ];

  for (const { phrase, threshold, label } of FILLER_PHRASES) {
    const regex = new RegExp(`\\b${phrase}\\b`, 'gi');
    const matches = lowerText.match(regex) || [];
    if (matches.length >= threshold) {
      foundFillers.push(`${label} across ${matches.length} bullet points`);
    }
  }

  if (foundFillers.length > 0) {
    writingScore -= Math.round(maxWriting * 0.25);
    writingIssues.push(
      `Repeated use of passive filler phrasing: ${foundFillers.join(', ')}. Replace with active verbs like 'spearheaded', 'built', or 'delivered'.`
    );
  }

  writingScore = Math.min(maxWriting, Math.max(0, writingScore));
  const writingFeedback =
    writingIssues.length === 0
      ? 'Clean writing quality with strong phrasing variety, zero detected spelling typos, and no repetitive filler language.'
      : writingIssues.join(' ');

  // -------------------------------------------------------------------------
  // Total Score & Summary (Sum of all 7 core deterministic factors = 100)
  // -------------------------------------------------------------------------
  const totalScore =
    keywordScore + sectionScore + contactScore + actionScore + metricScore + formatScore + writingScore;
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
      'Estimated ATS Compatibility Score based on role-contextual structural, keyword, action-oriented, writing quality, and formatting heuristics. Not affiliated with any commercial ATS vendor.',
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
      writingQuality: {
        score: writingScore,
        maxScore: maxWriting,
        label: 'Writing Quality & Variety',
        feedback: writingFeedback,
      },
      scoringProfile: profile.name,
      roleCategory: detectedCategory,
    },
    summary,
  };
};

export default calculateAtsScore;
