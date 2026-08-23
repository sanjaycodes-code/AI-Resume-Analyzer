import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import analysisApi from '../services/api/analysisApi';
import { AxiosError } from 'axios';
import type { ApiResponse } from '../types';

interface AnalyzeModalProps {
  resumeId: string;
  resumeFileName: string;
  isOpen: boolean;
  onClose: () => void;
}

export const AnalyzeModal: React.FC<AnalyzeModalProps> = ({
  resumeId,
  resumeFileName,
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'general' | 'targetJob'>('general');
  const [jobTitle, setJobTitle] = useState('');
  const [jobRawText, setJobRawText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      let jobDescriptionId: string | undefined = undefined;

      // 1. If target job mode, create JobDescription first
      if (mode === 'targetJob') {
        if (!jobTitle.trim()) {
          setErrorMessage('Please enter a target job title.');
          setIsAnalyzing(false);
          return;
        }
        if (!jobRawText.trim() || jobRawText.trim().length < 20) {
          setErrorMessage('Please paste the job description text (minimum 20 characters).');
          setIsAnalyzing(false);
          return;
        }

        const jdResponse = await analysisApi.createJobDescription({
          title: jobTitle.trim(),
          rawText: jobRawText.trim(),
        });
        jobDescriptionId = jdResponse.data?.jobDescription?._id;
      }

      // 2. Trigger AI + ATS Analysis
      const analysisResponse = await analysisApi.createAnalysis({
        resumeId,
        jobDescriptionId,
      });

      const analysisId = analysisResponse.data?.analysis?._id;
      if (analysisId) {
        onClose();
        navigate(`/analysis/${analysisId}`);
      } else {
        throw new Error('Analysis generated but ID is missing.');
      }
    } catch (err) {
      const axiosError = err as AxiosError<ApiResponse>;
      const message =
        axiosError.response?.data?.message ||
        axiosError.message ||
        'Failed to generate AI analysis. Please check your Gemini API key and try again.';
      setErrorMessage(message);
      setIsAnalyzing(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isAnalyzing) {
      onClose();
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl w-full max-w-lg max-w-[calc(100vw-1.5rem)] sm:max-w-xl p-5 sm:p-8 shadow-2xl space-y-5 sm:space-y-6 my-auto max-h-[90dvh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <div className="min-w-0">
              <h2 id="modal-title" className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight truncate">
                AI Resume Analysis
              </h2>
              <p className="text-xs text-slate-500 truncate max-w-[200px] sm:max-w-md">
                Analyzing: <span className="font-semibold text-slate-700">{resumeFileName}</span>
              </p>
            </div>
          </div>
          {!isAnalyzing && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors flex-shrink-0 active:scale-[0.95]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3.5 sm:p-4 rounded-xl flex items-start space-x-3">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs font-medium text-red-700">{errorMessage}</p>
          </div>
        )}

        {/* Mode Selector (Stacked on mobile, side-by-side on desktop) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 p-1.5 bg-slate-100 rounded-2xl">
          <button
            type="button"
            disabled={isAnalyzing}
            onClick={() => {
              setMode('general');
              setErrorMessage(null);
            }}
            className={`min-h-[44px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center text-center active:scale-[0.98] ${
              mode === 'general'
                ? 'bg-white text-blue-700 shadow-sm border border-slate-200/50'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ⚡ General ATS Review
          </button>
          <button
            type="button"
            disabled={isAnalyzing}
            onClick={() => {
              setMode('targetJob');
              setErrorMessage(null);
            }}
            className={`min-h-[44px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center text-center active:scale-[0.98] ${
              mode === 'targetJob'
                ? 'bg-white text-blue-700 shadow-sm border border-slate-200/50'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🎯 Match Job Description
          </button>
        </div>

        {/* Form Body */}
        {mode === 'general' ? (
          <div className="bg-blue-50/60 rounded-2xl p-4 sm:p-5 border border-blue-100 text-xs text-slate-700 space-y-2">
            <p className="font-semibold text-blue-900">What General Review Checks:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px] sm:text-xs">
              <li>Deterministic Estimated ATS Compatibility Score (0–100)</li>
              <li>Overall industry competitiveness and tech stack depth</li>
              <li>Quantified metrics, action-oriented verbs, and formatting health</li>
              <li>Executive recruiter impressions and bullet-point suggestions</li>
            </ul>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Target Job Title *
              </label>
              <input
                type="text"
                placeholder="e.g. Senior Full Stack Engineer, Frontend Developer..."
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                disabled={isAnalyzing}
                className="w-full px-3.5 sm:px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Job Description Text *
              </label>
              <textarea
                rows={4}
                placeholder="Paste the job requirements, responsibilities, and required qualifications here..."
                value={jobRawText}
                onChange={(e) => setJobRawText(e.target.value)}
                disabled={isAnalyzing}
                className="w-full px-3.5 sm:px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 leading-relaxed font-sans"
              />
            </div>
          </div>
        )}

        {/* Action Buttons (Stacked on mobile with Start on top, side-by-side on desktop) */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 sm:gap-3 pt-3 sm:pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isAnalyzing}
            className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 active:scale-[0.98] transition-all disabled:opacity-50 text-center flex items-center justify-center"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleStartAnalysis}
            disabled={isAnalyzing}
            className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-md shadow-blue-500/20 active:scale-[0.98] transition-all disabled:opacity-50 text-center"
          >
            {isAnalyzing ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Evaluating with Gemini AI...
              </>
            ) : (
              'Start AI Analysis'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnalyzeModal;
