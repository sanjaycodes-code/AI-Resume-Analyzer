import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import resumeApi from '../services/api/resumeApi';
import analysisApi from '../services/api/analysisApi';
import jobApi from '../services/api/jobApi';
import type { Resume, ApiResponse } from '../types';
import { AxiosError } from 'axios';

export const JobMatch: React.FC = () => {
  const navigate = useNavigate();

  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [jobTitle, setJobTitle] = useState('');
  const [jobRawText, setJobRawText] = useState('');

  const [isLoadingResumes, setIsLoadingResumes] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);

  const loadingSteps = [
    'Parsing job requirements & extracting key competencies...',
    'Evaluating candidate profile with Google Gemini AI...',
    'Calculating deterministic ATS Compatibility Score...',
    'Compiling strengths, missing skills & actionable suggestions...',
  ];

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isAnalyzing) {
      interval = setInterval(() => {
        setLoadingStepIndex((prev) => (prev + 1) % loadingSteps.length);
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  useEffect(() => {
    const fetchResumes = async () => {
      setIsLoadingResumes(true);
      try {
        const response = await resumeApi.listResumes();
        const list = response.data?.resumes || [];
        setResumes(list);
        if (list.length > 0) {
          setSelectedResumeId(list[0]._id);
        }
      } catch (err) {
        setErrorMessage('Failed to load your resumes. Please refresh or upload a resume first.');
      } finally {
        setIsLoadingResumes(false);
      }
    };

    fetchResumes();
  }, []);

  const handleMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedResumeId) {
      setErrorMessage('Please select a resume to compare against the job description.');
      return;
    }

    if (!jobTitle.trim()) {
      setErrorMessage('Please enter a target job title.');
      return;
    }

    if (!jobRawText.trim() || jobRawText.trim().length < 30) {
      setErrorMessage('Please paste the complete job description text (at least 30 characters).');
      return;
    }

    setIsAnalyzing(true);

    try {
      // 1. Create JobDescription
      const jdResponse = await jobApi.createJobDescription({
        title: jobTitle.trim(),
        rawText: jobRawText.trim(),
      });

      const jobDescriptionId = jdResponse.data?.jobDescription?._id;

      // 2. Trigger AI + ATS Analysis
      const analysisResponse = await analysisApi.createAnalysis({
        resumeId: selectedResumeId,
        jobDescriptionId,
      });

      const analysisId = analysisResponse.data?.analysis?._id;
      if (analysisId) {
        navigate(`/analysis/${analysisId}`);
      } else {
        throw new Error('Analysis completed but ID was not returned.');
      }
    } catch (err) {
      const axiosError = err as AxiosError<ApiResponse>;
      const msg =
        axiosError.response?.data?.message ||
        axiosError.message ||
        'AI job match analysis failed. Please try again.';
      setErrorMessage(msg);
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-600 rounded-3xl p-6 sm:p-10 text-white shadow-xl">
        <div className="max-w-2xl space-y-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/20 backdrop-blur-sm">
            AI Job Compatibility Matcher
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Target a Job Description
          </h1>
          <p className="text-purple-100 text-sm sm:text-base leading-relaxed">
            Paste any job posting to evaluate your resume match, pinpoint missing skills, and receive AI-generated recommendations tailored specifically to the role.
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-2xl flex items-start space-x-3 shadow-xs">
          <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <p className="text-xs font-bold text-red-800">Analysis Request Error</p>
            <p className="text-xs text-red-700 mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Main Form & Resume Picker */}
      <form onSubmit={handleMatch} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-8">
        {/* Step 1: Select Resume */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">1</span>
              Select Resume to Compare
            </label>
            <Link
              to="/upload"
              className="text-xs font-bold text-purple-600 hover:text-purple-700 transition-colors"
            >
              + Upload New Resume
            </Link>
          </div>

          {isLoadingResumes ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-pulse">
              <div className="h-20 bg-slate-100 rounded-2xl"></div>
              <div className="h-20 bg-slate-100 rounded-2xl"></div>
            </div>
          ) : resumes.length === 0 ? (
            <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-3">
              <p className="text-xs font-semibold text-amber-800">
                You haven't uploaded any resumes yet.
              </p>
              <Link
                to="/upload"
                className="inline-flex items-center px-4 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-700 transition-colors"
              >
                Upload Resume First
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {resumes.map((res) => {
                const isSelected = selectedResumeId === res._id;
                return (
                  <div
                    key={res._id}
                    onClick={() => !isAnalyzing && setSelectedResumeId(res._id)}
                    className={`cursor-pointer p-4 rounded-2xl border transition-all flex items-center space-x-3 ${
                      isSelected
                        ? 'border-purple-600 bg-purple-50/60 shadow-sm ring-2 ring-purple-500/20'
                        : 'border-slate-200 hover:border-purple-300 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                        isSelected
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {res.fileType.toUpperCase()}
                    </div>
                    <div className="truncate flex-1">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {res.originalFileName}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {res.parsedSections?.skills?.length || 0} skills detected
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Step 2: Job Description Details */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">2</span>
            Job Opportunity Details
          </label>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Target Job Title *
            </label>
            <input
              type="text"
              placeholder="e.g. Senior Frontend Engineer, Full Stack Developer, Data Scientist..."
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              disabled={isAnalyzing}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-slate-50 font-sans"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Job Description Content *
            </label>
            <textarea
              rows={8}
              placeholder="Paste the full job requirements, required technologies, qualifications, and responsibilities here..."
              value={jobRawText}
              onChange={(e) => setJobRawText(e.target.value)}
              disabled={isAnalyzing}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-slate-50 leading-relaxed font-sans"
            />
          </div>
        </div>

        {/* Submit / Loading Button */}
        <div className="pt-4 border-t border-slate-100">
          {isAnalyzing ? (
            <div className="p-6 rounded-2xl bg-purple-50 border border-purple-200 text-center space-y-4">
              <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-purple-900">
                  Analyzing... this can take up to 30 seconds
                </p>
                <p className="text-xs text-purple-700 animate-pulse">
                  {loadingSteps[loadingStepIndex]}
                </p>
              </div>
            </div>
          ) : (
            <button
              type="submit"
              disabled={resumes.length === 0}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-sm shadow-lg shadow-purple-500/20 hover:from-purple-700 hover:to-indigo-700 transition-all hover:scale-[1.005] disabled:opacity-50"
            >
              🚀 Match Resume & Run AI Analysis
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default JobMatch;
