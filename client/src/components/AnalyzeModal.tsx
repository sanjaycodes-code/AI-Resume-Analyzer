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

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">AI Resume Analysis</h2>
              <p className="text-xs text-slate-500 truncate max-w-xs sm:max-w-md">
                Analyzing: <span className="font-semibold text-slate-700">{resumeFileName}</span>
              </p>
            </div>
          </div>
          {!isAnalyzing && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex items-start space-x-3">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs font-medium text-red-700">{errorMessage}</p>
          </div>
        )}

        {/* Mode Selector */}
        <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 rounded-2xl">
          <button
            type="button"
            disabled={isAnalyzing}
            onClick={() => {
              setMode('general');
              setErrorMessage(null);
            }}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
              mode === 'general'
                ? 'bg-white text-blue-700 shadow-sm'
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
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
              mode === 'targetJob'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🎯 Match Job Description
          </button>
        </div>

        {/* Form Body */}
        {mode === 'general' ? (
          <div className="bg-blue-50/60 rounded-2xl p-5 border border-blue-100 text-xs text-slate-700 space-y-2">
            <p className="font-semibold text-blue-900">What General Review Checks:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-600">
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
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Job Description Text *
              </label>
              <textarea
                rows={5}
                placeholder="Paste the job requirements, responsibilities, and required qualifications here..."
                value={jobRawText}
                onChange={(e) => setJobRawText(e.target.value)}
                disabled={isAnalyzing}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 leading-relaxed font-sans"
              />
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isAnalyzing}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleStartAnalysis}
            disabled={isAnalyzing}
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
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
