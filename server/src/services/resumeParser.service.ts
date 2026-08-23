import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { IParsedSections } from '../models/Resume';
import { ApiError } from '../utils/apiError';
import { env } from '../config/env';

/**
 * Intelligent multimodal fallback for scanned, image-only, or flattened canvas PDFs.
 */
const extractWithGeminiVision = async (buffer: Buffer): Promise<string> => {
  if (!env.AI_API_KEY || env.AI_API_KEY.trim() === '') {
    return '';
  }

  try {
    const genAI = new GoogleGenerativeAI(env.AI_API_KEY);
    const model = genAI.getGenerativeModel({ model: env.GEMINI_MODEL || 'gemini-3.6-flash' });

    const part = {
      inlineData: {
        data: buffer.toString('base64'),
        mimeType: 'application/pdf',
      },
    };

    const prompt = `You are an expert Document OCR and Resume Digitization Specialist.
Extract and transcribe ALL the resume text from this PDF document with 100% accuracy.
Preserve all candidate details: Full Name, Contact Info (Email, Phone, Location, Roll Number), Educational Qualification (Degrees, CGPA/Percentages, Years, Institutions), Academic Achievements, Work Experience / Internships, Skills (Technical & Non-Technical), Extracurricular Activities, and Projects.
Return ONLY the transcribed plain text content without conversational commentary.`;

    const result = await model.generateContent([prompt, part]);
    const response = await result.response;
    return response.text()?.trim() || '';
  } catch (visionErr) {
    console.warn('[Gemini Vision OCR Error]: Failed to extract text from scanned PDF:', visionErr);
    return '';
  }
};

const PARSE_TIMEOUT_MS = 5000;

/**
 * Wraps an asynchronous task in a strict timeout using Promise.race().
 */
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(
        ApiError.unprocessableEntity(
          "Couldn't process this file in time — it may be corrupted or unusually complex",
          'PARSER_TIMEOUT'
        )
      );
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timer);
  });
};

/**
 * Verifies the binary magic bytes of the uploaded file against claimed fileType.
 */
export const verifyFileSignature = (buffer: Buffer, fileType: 'pdf' | 'docx'): void => {
  if (!buffer || buffer.length < 4) {
    throw ApiError.unprocessableEntity(
      "File content doesn't match its extension. The file is empty or corrupted.",
      'INVALID_FILE_SIGNATURE'
    );
  }

  if (fileType === 'pdf') {
    // PDF Header signature: '%PDF-'
    const header = buffer.slice(0, 5).toString('ascii');
    if (!header.startsWith('%PDF-')) {
      throw ApiError.unprocessableEntity(
        "File content doesn't match its extension. The uploaded file is not a valid PDF document.",
        'INVALID_FILE_SIGNATURE'
      );
    }
  } else if (fileType === 'docx') {
    // DOCX Header signature: PK\x03\x04 (ZIP container)
    const isZip =
      buffer[0] === 0x50 &&
      buffer[1] === 0x4b &&
      buffer[2] === 0x03 &&
      buffer[3] === 0x04;

    if (!isZip) {
      throw ApiError.unprocessableEntity(
        "File content doesn't match its extension. The uploaded file is not a valid DOCX document.",
        'INVALID_FILE_SIGNATURE'
      );
    }
  }
};

export const extractText = async (buffer: Buffer, fileType: 'pdf' | 'docx'): Promise<string> => {
  // 1. Verify binary magic bytes first before attempting any parsing
  verifyFileSignature(buffer, fileType);

  if (fileType === 'pdf') {
    try {
      // 2. Vector text stream extraction wrapped in strict 5s timeout
      const uint8 = new Uint8Array(
        buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
      );
      const data = await withTimeout(pdfParse(uint8 as unknown as Buffer), PARSE_TIMEOUT_MS);
      let extractedText = data.text?.trim() || '';

      // 3. If vector extraction returns empty (scanned/image-only), attempt Gemini Vision OCR with timeout
      if (!extractedText || extractedText.length < 20) {
        console.log('[Parser Info] PDF has no vector text stream (scanned/image-only). Triggering Gemini Vision OCR...');
        extractedText = await withTimeout(extractWithGeminiVision(buffer), PARSE_TIMEOUT_MS);
      }

      if (!extractedText || extractedText.trim() === '') {
        throw new Error('PDF contains no extractable text content. The document may be empty, password-protected, or image quality is unreadable.');
      }

      return extractedText;
    } catch (error: unknown) {
      if (error instanceof ApiError) throw error;
      const message = error instanceof Error ? error.message : 'Unknown PDF error';
      throw ApiError.unprocessableEntity(
        `Failed to parse PDF resume: ${message}`,
        'PDF_PARSING_FAILED'
      );
    }
  }

  if (fileType === 'docx') {
    try {
      // DOCX extraction wrapped in strict 5s timeout
      const result = await withTimeout(mammoth.extractRawText({ buffer }), PARSE_TIMEOUT_MS);
      const extractedText = result.value?.trim() || '';
      if (!extractedText) {
        throw new Error('DOCX contains no extractable text content.');
      }
      return extractedText;
    } catch (error: unknown) {
      if (error instanceof ApiError) throw error;
      const message = error instanceof Error ? error.message : 'Unknown DOCX error';
      throw ApiError.unprocessableEntity(
        `Failed to parse DOCX resume: ${message}. The file may be corrupted or malformed.`,
        'DOCX_PARSING_FAILED'
      );
    }
  }

  throw ApiError.unsupportedMediaType('Unsupported file type for extraction.', 'UNSUPPORTED_FILE_TYPE');
};

// Technical & domain skills dictionary (strictly tools, languages, frameworks, libraries, CS concepts)
const COMMON_SKILLS_DICTIONARY = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'C', 'Go', 'Golang', 'Rust', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'Dart', 'R', 'MATLAB', 'AutoCAD', 'FastAPI',
  'React', 'React.js', 'React Native', 'Next.js', 'Vue', 'Vue.js', 'Angular', 'Svelte', 'HTML', 'HTML5', 'CSS', 'CSS3', 'Tailwind', 'Tailwind CSS', 'Bootstrap', 'Sass', 'SCSS', 'Material UI', 'Chakra UI',
  'Node.js', 'Express', 'Express.js', 'NestJS', 'Django', 'Flask', 'Spring Boot', 'Spring', '.NET', 'ASP.NET', 'Laravel',
  'MongoDB', 'PostgreSQL', 'MySQL', 'SQLite', 'Redis', 'Firebase', 'Supabase', 'DynamoDB', 'Cassandra', 'Oracle', 'Prisma', 'Mongoose', 'TypeORM',
  'AWS', 'Amazon Web Services', 'Azure', 'Google Cloud', 'GCP', 'Docker', 'Kubernetes', 'CI/CD', 'GitHub Actions', 'Jenkins', 'Terraform', 'Linux', 'Nginx', 'Apache',
  'REST API', 'RESTful APIs', 'GraphQL', 'gRPC', 'WebSockets', 'Microservices',
  'Git', 'GitHub', 'GitLab', 'Bitbucket', 'Postman', 'Cursor', 'VS Code', 'Claude', 'Antigravity', 'Figma', 'UI/UX', 'Jira', 'Agile', 'Scrum', 'LeetCode', 'HackerRank',
  'Machine Learning', 'Deep Learning', 'AI', 'Artificial Intelligence', 'Data Science', 'Pandas', 'NumPy', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'OpenCV', 'NLP', 'LLM',
  'Data Structures and Algorithms', 'OOP', 'Event Management', 'Heat Exchangers', 'Steam Turbines', 'Boilers', 'Electrical Generators'
];

/**
 * Enhanced heuristic parser to cleanly isolate sections, strip footers/placeholders, and format education.
 */
export const parseSections = (text: string): IParsedSections => {
  const sections: IParsedSections = {
    skills: [],
    experience: [],
    education: [],
    projects: [],
  };

  if (!text || text.trim() === '') {
    return sections;
  }

  // Regex patterns supporting start of line, newline, or bullet separator
  const headerPatterns = [
    {
      key: 'skills',
      regex: /(?:^|\n|•|❖)\s*(?:skills\s+summary|technical\s+skills?|technical\s+proficienc(?:y|ies)|key\s+skills?|core\s+competencies|programming\s+languages?|skills?\s*(?:&|and)\s*tools|skills?|technologies|tools\s*(?:&|and)\s*technologies)\s*[:\n•–—\-]/i,
    },
    {
      key: 'experience',
      regex: /(?:^|\n|•|❖)\s*(?:work\s+experience(?:\s*(?:&|and)\s*positions?\s+of\s+responsibility)?|professional\s+experience|experience|employment\s+history|work\s+history|positions?\s+of\s+responsibility|responsibilities|internships?|work\s+profile)\s*[:\n•–—\-]/i,
    },
    {
      key: 'education',
      regex: /(?:^|\n|•|❖)\s*(?:educational\s+qualifications?|educational\s+background|education\s+and\s+qualifications?|academic\s+details|academic\s+qualifications?|academic\s+background|education|academics|qualifications?)\s*[:\n•–—\-]/i,
    },
    {
      key: 'projects',
      regex: /(?:^|\n|•|❖)\s*(?:projects?|personal\s+projects?|key\s+projects?|academic\s+projects?|featured\s+projects?|technical\s+projects?)\s*[:\n•–—\-]/i,
    },
    {
      key: 'achievements',
      regex: /(?:^|\n|•|❖)\s*(?:academic\s+achievements?|achievements?|certifications?|awards?)\s*[:\n•–—\-]/i,
    },
    {
      key: 'extracurricular',
      regex: /(?:^|\n|•|❖)\s*(?:extracurricular\s+activities|co-curricular\s+activities|activities|volunteering)\s*[:\n•–—\-]/i,
    },
  ];

  // Find all matches with global execution
  const matches: { key: string; index: number; length: number; matchedText: string }[] = [];
  for (const { key, regex } of headerPatterns) {
    let match;
    const globalRegex = new RegExp(regex.source, 'gi');
    while ((match = globalRegex.exec(text)) !== null) {
      matches.push({
        key,
        index: match.index,
        length: match[0].length,
        matchedText: match[0],
      });
    }
  }

  // Sort matches by appearance in text
  matches.sort((a, b) => a.index - b.index);

  // Filter overlapping matches
  const filteredMatches: { key: string; index: number; length: number }[] = [];
  let lastEnd = -1;
  for (const m of matches) {
    if (m.index >= lastEnd) {
      filteredMatches.push(m);
      lastEnd = m.index + m.length;
    }
  }

  const rawSections: Record<string, string> = {};
  for (let i = 0; i < filteredMatches.length; i++) {
    const current = filteredMatches[i];
    const next = filteredMatches[i + 1];
    const startIndex = current.index + current.length;
    const endIndex = next ? next.index : text.length;
    const content = text.slice(startIndex, endIndex).trim();
    if (!rawSections[current.key]) {
      rawSections[current.key] = content;
    } else {
      rawSections[current.key] += '\n\n' + content;
    }
  }

  // Helper to strip boilerplate college placement footers
  const cleanBoilerplate = (raw: string): string => {
    return raw
      .replace(/Career\s+Development\s+Center[^\n]*/gi, '')
      .replace(/Training\s+and\s+Placement\s+Cell[^\n]*/gi, '')
      .replace(/National\s+Institute\s+of\s+Technology[^\n]*/gi, '')
      .replace(/Indian\s+Institute\s+of\s+Technology[^\n]*/gi, '')
      .replace(/Placement\s+Office[^\n]*/gi, '')
      .replace(/Page\s+\d+\s+(?:of|\/)\s+\d+/gi, '')
      .replace(/^\s*None\s*$/gim, '')
      .replace(/^\s*(?:Positions?\s+of\s+Responsibility|Work\s+Experience|Experience)\s*[:\n–—\-]?\s*/gi, '')
      .trim();
  };

  // 1. Process Skills Section
  const rawSkillsText = rawSections.skills || '';
  const parsedSkills = new Set<string>();

  if (rawSkillsText) {
    const cleanedSkills = rawSkillsText
      .replace(
        /(?:Technical\s+Skills|Non-Technical\s+Skills|Programming\s+Languages|Languages|Frameworks|Libraries|Tools|Database|Databases|Cloud|Core\s+CS\s+Concepts|Web\s+Technologies|Soft\s+Skills)\s*[:]/gi,
        ','
      )
      .split(/[\n,•|·;–—\t❖]+/)
      .map((s) => s.replace(/^[-*•:\s❖]+/, '').trim())
      .filter(
        (s) =>
          s.length >= 1 &&
          s.length < 50 &&
          !/^(and|or|with|in|at|the|for|none|summary)$/i.test(s)
      );

    cleanedSkills.forEach((s) => parsedSkills.add(s));
  }

  // Dictionary scan across text for any mentioned technologies
  for (const tech of COMMON_SKILLS_DICTIONARY) {
    const escaped = tech.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const skillRegex = new RegExp(`(?:^|[\\s,;•|·/()—-])${escaped}(?:$|[\\s,;•|·/()—-])`, 'i');
    if (skillRegex.test(text)) {
      parsedSkills.add(tech);
    }
  }

  sections.skills = Array.from(parsedSkills);

  // 2. Process Education (formatted & structured)
  const rawEdu = rawSections.education || '';
  const eduItems: string[] = [];

  // Degree & Department
  const degMatch = text.match(
    /\b(B\.Tech|B\.E\.|B\.Sc|M\.Tech|M\.S\.|MBA|Bachelor|Master)\s*[-–—:]\s*([A-Za-z\s]+?)(?:\r?\n|Roll|Date|Email|Gender|Category|$)/i
  );
  if (degMatch) {
    eduItems.push(`🎓 ${degMatch[1].toUpperCase()} in ${degMatch[2].trim()}`);
  }

  // Class XII / Intermediate
  const m12 = (rawEdu + '\n' + text).match(
    /(?:(20\d\d)\s*)?Class\s*XII\s*([^0-9\n]+?)\.?\s*(\d{1,3}(?:\.\d+)?)/i
  );
  if (m12) {
    const year = m12[1] ? `${m12[1]} | ` : '';
    const inst = m12[2].replace(/^[-:,\s]+|[-:,\s]+$/g, '').trim();
    const score = m12[3];
    eduItems.push(`🏫 ${year}Class XII: ${inst} (${score} CGPA/%)`);
  }

  // Class X / Secondary
  const m10 = (rawEdu + '\n' + text).match(
    /(?:(20\d\d)\s*)?Class\s*X(?![IVXLM])\s*([^0-9\n]+?)\.?\s*(\d{1,3}(?:\.\d+)?)/i
  );
  if (m10) {
    const year = m10[1] ? `${m10[1]} | ` : '';
    const inst = m10[2].replace(/^[-:,\s]+|[-:,\s]+$/g, '').trim();
    const score = m10[3];
    eduItems.push(`🏫 ${year}Class X: ${inst} (${score} CGPA/%)`);
  }

  if (eduItems.length > 0) {
    sections.education = eduItems.map((item) => ({ content: item }));
  } else if (rawEdu) {
    sections.education = [{ content: cleanBoilerplate(rawEdu) }];
  }

  // 3. Process Experience (cleaned)
  if (rawSections.experience) {
    const cleanedExp = cleanBoilerplate(rawSections.experience);
    const expLines = cleanedExp
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && l !== 'None' && l !== '•' && l !== '❖' && l !== 'Academic Achievements');

    if (expLines.length > 0) {
      sections.experience = [{ content: expLines.join('\n') }];
    }
  }

  // If experience is empty, check if Extracurricular exists
  if ((!sections.experience || sections.experience.length === 0) && rawSections.extracurricular) {
    const cleanedExtra = cleanBoilerplate(rawSections.extracurricular);
    if (cleanedExtra) {
      sections.experience = [{ content: cleanedExtra }];
    }
  }

  // 4. Process Projects
  if (rawSections.projects) {
    const cleanedProjects = cleanBoilerplate(rawSections.projects);
    if (cleanedProjects) {
      sections.projects = [{ content: cleanedProjects }];
    }
  }

  return sections;
};
