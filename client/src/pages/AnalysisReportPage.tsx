import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import analysisApi from '../services/api/analysisApi';
import type { Analysis } from '../types';

export const AnalysisReportPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchAnalysis = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const response = await analysisApi.getAnalysis(id);
        if (response.data?.analysis) {
          setAnalysis(response.data.analysis);
        } else {
          setErrorMessage('Analysis not found.');
        }
      } catch (err) {
        setErrorMessage('Failed to load analysis report. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalysis();
  }, [id]);

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm font-semibold text-slate-700">
          Loading AI Analysis & ATS Compatibility Breakdown...
        </p>
      </div>
    );
  }

  if (errorMessage || !analysis) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Analysis Report Unavailable</h2>
        <p className="text-slate-600 text-sm max-w-md mx-auto">{errorMessage}</p>
        <Link
          to="/dashboard"
          className="inline-flex items-center px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors"
        >
          &larr; Back to Dashboard
        </Link>
      </div>
    );
  }

  const resumeObj = typeof analysis.resumeId === 'object' ? analysis.resumeId : null;
  const jobObj = typeof analysis.jobDescriptionId === 'object' ? analysis.jobDescriptionId : null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 65) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 50) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getProgressColor = (score: number, max: number) => {
    const pct = (score / max) * 100;
    if (pct >= 80) return 'bg-emerald-500';
    if (pct >= 60) return 'bg-blue-500';
    if (pct >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const factorSum = analysis.scoreBreakdown
    ? Object.entries(analysis.scoreBreakdown).reduce((acc: number, [k, item]) => {
        if (
          k !== 'scoringProfile' &&
          k !== 'roleCategory' &&
          item &&
          typeof item === 'object' &&
          'score' in item &&
          typeof (item as { score: number }).score === 'number'
        ) {
          return acc + (item as { score: number }).score;
        }
        return acc;
      }, 0)
    : (analysis.atsScore || 0);

  const displayAtsScore = factorSum > 0 ? factorSum : (analysis.atsScore || 0);

  const aiDerivedScore =
    (((analysis.experienceAnalysis as unknown as Record<string, number>)?.rating || 75) +
      ((analysis.educationAnalysis as unknown as Record<string, number>)?.rating || 80) +
      ((analysis.projectAnalysis as unknown as Record<string, number>)?.rating || 80) +
      ((analysis.keywordAnalysis as unknown as Record<string, number>)?.keywordDensityScore || 70)) /
    4;

  const displayOverallScore = Math.min(100, Math.max(0, Math.round(0.6 * displayAtsScore + 0.4 * aiDerivedScore)));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
              AI Evaluation Report
            </span>
            <span className="text-xs text-slate-500">
              {new Date(analysis.createdAt).toLocaleString()}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {resumeObj?.originalFileName || 'Resume Analysis Report'}
          </h1>
          {jobObj ? (
            <p className="text-sm font-semibold text-blue-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              Targeting Role: {jobObj.title}
            </p>
          ) : (
            <p className="text-xs text-slate-500">General Technical & ATS Standard Evaluation</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {resumeObj?._id && (
            <Link
              to={`/resumes/${resumeObj._id}`}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors"
            >
              View Resume Text
            </Link>
          )}
          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200 transition-colors"
          >
            Print Report
          </button>
        </div>
      </div>

      {/* Top Scores Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Overall Weighted Score */}
        <div className={`p-6 rounded-3xl border shadow-sm flex flex-col justify-between ${getScoreColor(displayOverallScore)}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider">Overall Match Score</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/70">
              Weighted AI + ATS
            </span>
          </div>
          <div className="my-4">
            <span className="text-5xl font-extrabold tracking-tight">{displayOverallScore}</span>
            <span className="text-lg font-bold opacity-70"> / 100</span>
          </div>
          <p className="text-xs font-medium opacity-90">
            {displayOverallScore >= 80
              ? 'Outstanding profile alignment.'
              : displayOverallScore >= 65
              ? 'Competitive profile with key optimization opportunities.'
              : 'Requires structural and keyword enhancements.'}
          </p>
        </div>

        {/* Estimated ATS Compatibility Score */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Estimated ATS Score</span>
            <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="my-4">
            <span className="text-5xl font-extrabold text-slate-900 tracking-tight">{displayAtsScore}</span>
            <span className="text-lg font-bold text-slate-400"> / 100</span>
          </div>
          <p className="text-xs text-slate-500">
            Deterministic rating based on parsing, verbs & metrics.
          </p>
        </div>

        {/* Keyword Density Score */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Keyword Match</span>
            <div className="w-6 h-6 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
          </div>
          <div className="my-4">
            <span className="text-5xl font-extrabold text-slate-900 tracking-tight">
              {analysis.keywordAnalysis?.keywordDensityScore || 75}%
            </span>
          </div>
          <p className="text-xs text-slate-500">
            {analysis.skillsFound?.length || 0} skills detected in profile.
          </p>
        </div>
      </div>

      {/* Executive Summary Card */}
      {analysis.formattingAnalysis?.summary && (
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-3">
          <div className="flex items-center space-x-2 text-blue-400 text-xs font-bold uppercase tracking-wider">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Executive Recruiter Evaluation</span>
          </div>
          <p className="text-slate-100 text-sm sm:text-base leading-relaxed font-sans">
            {analysis.formattingAnalysis.summary}
          </p>
        </div>
      )}

      {/* Keyword Breakdown: Matched vs Missing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Matched Skills */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              Detected Skills & Keywords ({analysis.skillsFound?.length || 0})
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {analysis.skillsFound && analysis.skillsFound.length > 0 ? (
              analysis.skillsFound.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
                >
                  ✓ {skill}
                </span>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic">No skills identified.</p>
            )}
          </div>
        </div>

        {/* Missing Skills Gap */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
              Missing Critical Keywords / Skills ({analysis.missingSkills?.length || 0})
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {analysis.missingSkills && analysis.missingSkills.length > 0 ? (
              analysis.missingSkills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-lg text-xs font-medium bg-red-50 text-red-700 border border-red-200"
                >
                  + Add {skill}
                </span>
              ))
            ) : (
              <p className="text-xs text-emerald-600 font-medium">
                🎉 No critical skill gaps identified!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 6-Category Deterministic ATS Breakdown */}
      {analysis.formattingAnalysis && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Estimated ATS Score Breakdown</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Deterministic evaluation across 6 core ATS scanning criteria
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
              Score: {analysis.atsScore}/100
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Keyword Relevance */}
            {analysis.keywordAnalysis?.atsBreakdown && (
              <div className="space-y-1.5 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex justify-between text-xs font-bold text-slate-800">
                  <span>{analysis.keywordAnalysis.atsBreakdown.label}</span>
                  <span>{analysis.keywordAnalysis.atsBreakdown.score} / {analysis.keywordAnalysis.atsBreakdown.maxScore}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full ${getProgressColor(analysis.keywordAnalysis.atsBreakdown.score, analysis.keywordAnalysis.atsBreakdown.maxScore)}`}
                    style={{ width: `${(analysis.keywordAnalysis.atsBreakdown.score / analysis.keywordAnalysis.atsBreakdown.maxScore) * 100}%` }}
                  ></div>
                </div>
                <p className="text-[11px] text-slate-500">{analysis.keywordAnalysis.atsBreakdown.feedback}</p>
              </div>
            )}

            {/* 2. Section Structure */}
            {analysis.formattingAnalysis.sectionStructure && (
              <div className="space-y-1.5 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex justify-between text-xs font-bold text-slate-800">
                  <span>{analysis.formattingAnalysis.sectionStructure.label}</span>
                  <span>{analysis.formattingAnalysis.sectionStructure.score} / {analysis.formattingAnalysis.sectionStructure.maxScore}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full ${getProgressColor(analysis.formattingAnalysis.sectionStructure.score, analysis.formattingAnalysis.sectionStructure.maxScore)}`}
                    style={{ width: `${(analysis.formattingAnalysis.sectionStructure.score / analysis.formattingAnalysis.sectionStructure.maxScore) * 100}%` }}
                  ></div>
                </div>
                <p className="text-[11px] text-slate-500">{analysis.formattingAnalysis.sectionStructure.feedback}</p>
              </div>
            )}

            {/* 3. Contact Info */}
            {analysis.formattingAnalysis.contactInfo && (
              <div className="space-y-1.5 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex justify-between text-xs font-bold text-slate-800">
                  <span>{analysis.formattingAnalysis.contactInfo.label}</span>
                  <span>{analysis.formattingAnalysis.contactInfo.score} / {analysis.formattingAnalysis.contactInfo.maxScore}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full ${getProgressColor(analysis.formattingAnalysis.contactInfo.score, analysis.formattingAnalysis.contactInfo.maxScore)}`}
                    style={{ width: `${(analysis.formattingAnalysis.contactInfo.score / analysis.formattingAnalysis.contactInfo.maxScore) * 100}%` }}
                  ></div>
                </div>
                <p className="text-[11px] text-slate-500">{analysis.formattingAnalysis.contactInfo.feedback}</p>
              </div>
            )}

            {/* 4. Action Verbs */}
            {analysis.formattingAnalysis.actionVerbs && (
              <div className="space-y-1.5 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex justify-between text-xs font-bold text-slate-800">
                  <span>{analysis.formattingAnalysis.actionVerbs.label}</span>
                  <span>{analysis.formattingAnalysis.actionVerbs.score} / {analysis.formattingAnalysis.actionVerbs.maxScore}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full ${getProgressColor(analysis.formattingAnalysis.actionVerbs.score, analysis.formattingAnalysis.actionVerbs.maxScore)}`}
                    style={{ width: `${(analysis.formattingAnalysis.actionVerbs.score / analysis.formattingAnalysis.actionVerbs.maxScore) * 100}%` }}
                  ></div>
                </div>
                <p className="text-[11px] text-slate-500">{analysis.formattingAnalysis.actionVerbs.feedback}</p>
              </div>
            )}

            {/* 5. Quantified Impact */}
            {analysis.formattingAnalysis.quantifiedImpact && (
              <div className="space-y-1.5 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex justify-between text-xs font-bold text-slate-800">
                  <span>{analysis.formattingAnalysis.quantifiedImpact.label}</span>
                  <span>{analysis.formattingAnalysis.quantifiedImpact.score} / {analysis.formattingAnalysis.quantifiedImpact.maxScore}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full ${getProgressColor(analysis.formattingAnalysis.quantifiedImpact.score, analysis.formattingAnalysis.quantifiedImpact.maxScore)}`}
                    style={{ width: `${(analysis.formattingAnalysis.quantifiedImpact.score / analysis.formattingAnalysis.quantifiedImpact.maxScore) * 100}%` }}
                  ></div>
                </div>
                <p className="text-[11px] text-slate-500">{analysis.formattingAnalysis.quantifiedImpact.feedback}</p>
              </div>
            )}

            {/* 6. Formatting Cleanliness */}
            <div className="space-y-1.5 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex justify-between text-xs font-bold text-slate-800">
                <span>{analysis.formattingAnalysis.label}</span>
                <span>{analysis.formattingAnalysis.score} / {analysis.formattingAnalysis.maxScore}</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full ${getProgressColor(analysis.formattingAnalysis.score, analysis.formattingAnalysis.maxScore)}`}
                  style={{ width: `${(analysis.formattingAnalysis.score / analysis.formattingAnalysis.maxScore) * 100}%` }}
                ></div>
              </div>
              <p className="text-[11px] text-slate-500">{analysis.formattingAnalysis.feedback}</p>
            </div>
          </div>
        </div>
      )}

      {/* Strengths & Weaknesses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
            Key Strengths
          </h3>
          <ul className="space-y-2.5">
            {analysis.strengths && analysis.strengths.length > 0 ? (
              analysis.strengths.map((str, idx) => (
                <li key={idx} className="flex items-start space-x-2 text-xs text-slate-700 leading-relaxed">
                  <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                  <span>{str}</span>
                </li>
              ))
            ) : (
              <li className="text-xs text-slate-400 italic">No specific strengths documented.</li>
            )}
          </ul>
        </div>

        {/* Weaknesses */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500"></span>
            Areas for Improvement
          </h3>
          <ul className="space-y-2.5">
            {analysis.weaknesses && analysis.weaknesses.length > 0 ? (
              analysis.weaknesses.map((weak, idx) => (
                <li key={idx} className="flex items-start space-x-2 text-xs text-slate-700 leading-relaxed">
                  <span className="text-amber-500 font-bold mt-0.5">!</span>
                  <span>{weak}</span>
                </li>
              ))
            ) : (
              <li className="text-xs text-slate-400 italic">No weaknesses recorded.</li>
            )}
          </ul>
        </div>
      </div>

      {/* Actionable Recommendations */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-600"></span>
          Actionable AI Recommendations
        </h3>
        <div className="space-y-3">
          {analysis.recommendations && analysis.recommendations.length > 0 ? (
            analysis.recommendations.map((rec, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 flex items-start space-x-3 text-xs text-slate-800 leading-relaxed">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span>{rec}</span>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 italic">No recommendations available.</p>
          )}
        </div>
      </div>

      {/* Disclaimer Card */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
        <p className="text-[11px] text-slate-500 italic">
          {analysis.formattingAnalysis?.disclaimer ||
            'Estimated ATS Compatibility Score based on structural, keyword, and formatting heuristics. Not affiliated with any commercial ATS vendor.'}
        </p>
      </div>
    </div>
  );
};

export default AnalysisReportPage;
