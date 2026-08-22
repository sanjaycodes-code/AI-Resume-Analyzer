import type { ApiResponse } from './index';

export type ResumeFileType = 'pdf' | 'docx';

export interface IParsedSections {
  skills: string[];
  experience: Array<{ content?: string; [key: string]: unknown }>;
  education: Array<{ content?: string; [key: string]: unknown }>;
  projects: Array<{ content?: string; [key: string]: unknown }>;
}

export interface Resume {
  _id: string;
  userId: string;
  originalFileName: string;
  fileUrl: string;
  fileType: ResumeFileType;
  extractedText: string;
  parsedSections: IParsedSections;
  createdAt: string;
  updatedAt: string;
}

export interface ResumeUploadData {
  resume: Resume;
}

export interface ResumeListData {
  resumes: Resume[];
}

export type ResumeUploadResponse = ApiResponse<ResumeUploadData>;
export type ResumeListResponse = ApiResponse<ResumeListData> & { count: number };
export type ResumeDetailResponse = ApiResponse<ResumeUploadData>;
