import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import analysisApi from '../services/api/analysisApi';
import enhancerApi from '../services/api/enhancerApi';
import AnalyzeModal from '../components/AnalyzeModal';
import { ScoreGauge } from '../components/ScoreGauge';
import type { EnhanceBulletResult } from '../services/api/enhancerApi';
import type { Analysis, EnhancedBullet, ScoreCategory } from '../types';

gsap.registerPlugin(ScrollTrigger);

interface FactorConfig {
  key: string;
  title: string;
  maxScore: number;
  explanation: string;
  icon: React.ReactNode;
}

const FACTOR_CONFIGS: FactorConfig[] = [
  {
    key: 'keywordMatch',
    title: 'Keyword Relevance',
    maxScore: 22,
    explanation: "Measures overlap between your resume's technical skills and the job description or industry standards.",
    icon: (
      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
  },
  {
    key: 'sectionCompleteness',
    title: 'Standard Sections',
    maxScore: 18,
    explanation: 'Evaluates the presence of standard ATS sections: Skills, Experience, Education, and Projects.',
    icon: (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    ),
  },
  {
    key: 'contactInfo',
    title: 'Contact Info & Links',
    maxScore: 12,
    explanation: 'Verifies presence of email, phone number, location, and professional links (LinkedIn / GitHub).',
    icon: (
      <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    key: 'actionVerbs',
    title: 'Action Verb Usage',
    maxScore: 14,
    explanation: 'Scans for high-impact action verbs (e.g. built, engineered, optimized) driving your accomplishments.',
    icon: (
      <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    key: 'quantifiedImpact',
    title: 'Quantified Achievements',
    maxScore: 14,
    explanation: 'Measures numbers, percentages (%), metrics, and scale demonstrating measurable business impact.',
    icon: (
      <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    key: 'formattingCleanliness',
    title: 'Formatting & Layout',
    maxScore: 10,
    explanation: 'Validates optimal word count (300–1,500 words), readable casing, and clean plain-text extractability.',
    icon: (
      <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    key: 'writingQuality',
    title: 'Writing Quality & Variety',
    maxScore: 10,
    explanation: 'Detects spelling accuracy, diverse action phrasing, and eliminates repetitive filler language.',
    icon: (
      <svg className="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    ),
  },
];

export const AnalysisDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const scoreGaugesRef = useRef<HTMLDivElement>(null);

  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [showAnalyzeModal, setShowAnalyzeModal] = useState(false);

  // Bullet Enhancer State
  const [bulletInput, setBulletInput] = useState('');
  const [targetRoleInput, setTargetRoleInput] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancementResult, setEnhancementResult] = useState<EnhanceBulletResult | null>(null);
  const [enhancerError, setEnhancerError] = useState<string | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [copiedLatest, setCopiedLatest] = useState(false);
  const [copiedToast, setCopiedToast] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchAnalysis = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const response = await analysisApi.getAnalysis(id);
        if (response.data?.analysis) {
          setAnalysis(response.data.analysis);
          const job = response.data.analysis.jobDescriptionId;
          if (typeof job === 'object' && job?.title) {
            setTargetRoleInput(job.title);
          }
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

  // Scroll-scrubbed scale & soft fade on the top 3 score gauge cards (Desktop/Tablet only)
  useEffect(() => {
    if (!analysis || isLoading || !scoreGaugesRef.current) return;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      // 1. Desktop & Tablet (>= 768px): Cinematic scale down & soft fade
      mm.add('(min-width: 768px)', () => {
        if (scoreGaugesRef.current) {
          gsap.to(scoreGaugesRef.current, {
            scale: 0.94,
            opacity: 0.9,
            transformOrigin: 'center top',
            ease: 'none',
            scrollTrigger: {
              trigger: scoreGaugesRef.current,
              start: 'top 100px',
              end: 'bottom top',
              scrub: 0.6,
              invalidateOnRefresh: true,
            },
          });
        }
      });

      // 2. Mobile (< 768px): Touch-calibrated subtle receding effect (zero edge clipping, responsive inertia)
      mm.add('(max-width: 767px)', () => {
        if (scoreGaugesRef.current) {
          gsap.to(scoreGaugesRef.current, {
            scale: 0.96,
            opacity: 0.92,
            transformOrigin: 'center top',
            ease: 'none',
            scrollTrigger: {
              trigger: scoreGaugesRef.current,
              start: 'top 80px',
              end: 'bottom top',
              scrub: 0.4, // Responsive touch response
              invalidateOnRefresh: true,
            },
          });
        }
      });
    }, pageContainerRef);

    // Refresh ScrollTrigger after DOM renders & settles
    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100);

    return () => {
      clearTimeout(timer);
      ctx.revert();
    };
  }, [analysis, isLoading]);

  const handleDownloadReport = async () => {
    if (!id) return;
    setIsDownloading(true);
    setDownloadError(null);

    const resumeName =
      typeof analysis?.resumeId === 'object' && analysis?.resumeId?.originalFileName
        ? analysis.resumeId.originalFileName
        : 'Resume';

    try {
      await analysisApi.downloadReport(id, resumeName);
    } catch (err) {
      setDownloadError('Failed to generate and download PDF report. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleEnhanceBullet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !bulletInput.trim()) return;

    setIsEnhancing(true);
    setEnhancerError(null);
    setEnhancementResult(null);

    try {
      const res = await enhancerApi.enhanceBullet(id, bulletInput, targetRoleInput);
      if (res.data) {
        setEnhancementResult(res.data);

        // Add to local running list immediately without requiring page refetch
        const newEntry: EnhancedBullet = {
          originalText: bulletInput.trim(),
          enhancedText: res.data.enhancedText,
          changesSummary: res.data.changesSummary,
          createdAt: res.data.createdAt || new Date().toISOString(),
        };

        setAnalysis((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            enhancedBullets: [newEntry, ...(prev.enhancedBullets || [])],
          };
        });

        // Clear input for next bullet
        setBulletInput('');
      } else {
        setEnhancerError('AI was unable to enhance this bullet. Please try a different phrasing.');
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to enhance bullet. Please check your connection or rate limits and try again.';
      setEnhancerError(message);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleCopyText = async (text: string, isLatest: boolean, idx?: number) => {
    try {
      await navigator.clipboard.writeText(text);
      if (isLatest) {
        setCopiedLatest(true);
        setTimeout(() => setCopiedLatest(false), 2000);
      } else if (idx !== undefined) {
        setCopiedIdx(idx);
        setTimeout(() => setCopiedIdx(null), 2000);
      }
      setCopiedToast('Enhanced bullet copied to clipboard!');
      setTimeout(() => setCopiedToast(null), 2200);
    } catch {
      // Fallback
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
        {/* Header Skeleton */}
        <div className="h-32 skeleton-shimmer rounded-3xl border border-slate-200/80"></div>
        {/* 3 Top Score Gauges Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="h-44 skeleton-shimmer rounded-3xl border border-slate-200/80"></div>
          <div className="h-44 skeleton-shimmer rounded-3xl border border-slate-200/80"></div>
          <div className="h-44 skeleton-shimmer rounded-3xl border border-slate-200/80"></div>
        </div>
        {/* Breakdown Card Skeleton */}
        <div className="h-64 skeleton-shimmer rounded-3xl border border-slate-200/80"></div>
        {/* 2-Column Findings Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-56 skeleton-shimmer rounded-3xl border border-slate-200/80"></div>
          <div className="h-56 skeleton-shimmer rounded-3xl border border-slate-200/80"></div>
        </div>
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
        <h2 className="text-2xl font-bold text-slate-900">Analysis Details Unavailable</h2>
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

  const getProgressColor = (score: number, max: number = 100) => {
    const pct = (score / max) * 100;
    if (pct >= 80) return 'bg-emerald-500';
    if (pct >= 60) return 'bg-blue-500';
    if (pct >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  };

  // Helper to extract breakdown factors with robust fallback for older analyses
  const getFactorData = (key: string): ScoreCategory => {
    if (analysis.scoreBreakdown && (analysis.scoreBreakdown as unknown as Record<string, ScoreCategory>)[key]) {
      return (analysis.scoreBreakdown as unknown as Record<string, ScoreCategory>)[key];
    }

    const fmt = analysis.formattingAnalysis;
    const kw = analysis.keywordAnalysis;

    switch (key) {
      case 'keywordMatch':
        return kw?.atsBreakdown || {
          score: Math.min(25, Math.round((analysis.atsScore || 70) * 0.25)),
          maxScore: 25,
          label: 'Keyword & Skills Relevance',
          feedback: `${analysis.skillsFound?.length || 0} skills detected.`,
        };
      case 'sectionCompleteness':
        return fmt?.sectionStructure || {
          score: 20,
          maxScore: 20,
          label: 'Standard Section Structure',
          feedback: 'Standard resume sections evaluated.',
        };
      case 'contactInfo':
        return fmt?.contactInfo || {
          score: 15,
          maxScore: 15,
          label: 'Contact Information & Links',
          feedback: 'Contact information verified.',
        };
      case 'actionVerbs':
        return fmt?.actionVerbs || {
          score: 11,
          maxScore: 15,
          label: 'Action-Oriented Language',
          feedback: 'Action verbs and language scanned.',
        };
      case 'quantifiedImpact':
        return fmt?.quantifiedImpact || {
          score: 10,
          maxScore: 15,
          label: 'Quantifiable Metrics & Impact',
          feedback: 'Quantifiable metrics evaluated.',
        };
      case 'formattingCleanliness':
        return {
          score: fmt?.score ?? 10,
          maxScore: 10,
          label: 'Formatting & Length Balance',
          feedback: fmt?.feedback || 'Clean formatting and optimal length.',
        };
      case 'writingQuality':
        return fmt?.writingQuality || {
          score: 15,
          maxScore: 15,
          label: 'Writing Quality & Variety',
          feedback: 'Clean writing quality with strong phrasing variety.',
        };
      default:
        return { score: 10, maxScore: 15, label: key, feedback: '' };
    }
  };

  return (
    <div ref={pageContainerRef} className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center flex-wrap gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
              Evaluation Report
            </span>
            {/* Visual Diagnostic Badge for Testing & Verification */}
            <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200" title="MongoDB Analysis ID">
              ID: <span className="font-bold text-slate-900">{analysis._id}</span>
            </span>
            <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200" title="Scoring Engine Version">
              Engine: {analysis.scoringVersion || '1.0.0-legacy'}
            </span>
            {analysis.overallScore >= 80 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500 text-white tracking-wide shadow-md shadow-emerald-500/30 job-ready-glow">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
                ✓ Job Ready &bull; ATS Optimized
              </span>
            )}
            <span className="text-xs text-slate-500">
              {new Date(analysis.createdAt).toLocaleString()}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {resumeObj?.originalFileName || 'Resume Analysis Report'}
          </h1>
          {jobObj ? (
            <p className="text-sm font-semibold text-purple-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-600"></span>
              Target Job: {jobObj.title}
            </p>
          ) : (
            <p className="text-xs text-slate-500">General Technical & ATS Standard Evaluation</p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center flex-wrap gap-3">
          {/* Re-run Analysis Button */}
          {resumeObj?._id && (
            <button
              type="button"
              onClick={() => setShowAnalyzeModal(true)}
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 font-bold text-xs hover:bg-purple-100 active:scale-[0.98] transition-all w-full sm:w-auto text-center"
            >
              <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              ⚡ Re-run Analysis
            </button>
          )}

          {/* Download Report Button */}
          <button
            type="button"
            onClick={handleDownloadReport}
            disabled={isDownloading}
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-md shadow-blue-500/20 hover:from-blue-700 hover:to-indigo-700 transition-all hover:scale-[1.02] disabled:opacity-50 w-full sm:w-auto"
          >
            {isDownloading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generating PDF...
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download PDF Report
              </>
            )}
          </button>

          <Link
            to="/job-match"
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-xs hover:bg-slate-100 transition-colors w-full sm:w-auto text-center"
          >
            Target Another Job
          </Link>
          {resumeObj?._id && (
            <Link
              to={`/resumes/${resumeObj._id}`}
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors w-full sm:w-auto text-center"
            >
              View Resume
            </Link>
          )}
        </div>
      </div>

      {/* Download Error Banner */}
      {downloadError && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex items-center justify-between">
          <p className="text-xs font-semibold text-red-700">{downloadError}</p>
          <button
            onClick={() => setDownloadError(null)}
            className="text-xs text-red-500 hover:text-red-700 font-bold"
          >
            &times;
          </button>
        </div>
      )}

      {/* Prominent Radial Score Gauges (Scroll-Scrubbed Receding Row on Desktop) */}
      <div
        ref={scoreGaugesRef}
        className="grid grid-cols-1 sm:grid-cols-3 gap-6 will-change-[transform,opacity]"
      >
        {/* Overall Weighted Score Gauge */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col items-center justify-center hover:shadow-md transition-shadow">
          <ScoreGauge
            score={analysis.overallScore || 0}
            label="Overall Match Score"
            subtitle="Weighted AI + ATS composite"
            size="lg"
          />
        </div>

        {/* Estimated ATS Compatibility Score Gauge */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col items-center justify-center hover:shadow-md transition-shadow">
          <ScoreGauge
            score={analysis.atsScore || 0}
            label="Estimated ATS Score"
            subtitle="7-Pillar Heuristic Scan"
            size="lg"
          />
        </div>

        {/* Keyword Match Density Gauge */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col items-center justify-center hover:shadow-md transition-shadow">
          <ScoreGauge
            score={(analysis.keywordAnalysis as unknown as Record<string, unknown>)?.keywordDensityScore as number || 75}
            label="Keyword Match Density"
            subtitle={`${analysis.skillsFound?.length || 0} skills detected`}
            size="md"
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DETERMINISTIC SCORE BREAKDOWN (Rule-Based Factors) */}
      {/* ========================================================================= */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center flex-wrap gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                Deterministic Scoring Factors
              </span>
              <span className="text-xs text-slate-400 font-mono">100 Pts Total</span>
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                🎯 {analysis.scoreBreakdown?.scoringProfile
                  ? `Weighted for: ${analysis.scoreBreakdown.scoringProfile} roles`
                  : jobObj
                  ? `Weighted for: ${jobObj.title}`
                  : `General weighting (no job description provided)`}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight mt-1">
              ATS Compatibility Score Breakdown
            </h2>
          </div>
          <p className="text-xs text-slate-500 max-w-sm">
            Deterministic rule-based checks evaluated with role-specific category weights.
          </p>
        </div>

        {/* Factors Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FACTOR_CONFIGS.map((factor) => {
            const data = getFactorData(factor.key);
            const score = data.score ?? 0;
            const max = data.maxScore || factor.maxScore;
            const percentage = Math.round((score / max) * 100);

            return (
              <div
                key={factor.key}
                className="bg-slate-50/80 hover:bg-slate-50 border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between space-y-4 transition-all"
              >
                {/* Card Header */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 rounded-lg bg-white shadow-2xs border border-slate-200">
                        {factor.icon}
                      </div>
                      <h3 className="text-sm font-bold text-slate-800 tracking-tight">
                        {factor.title}
                      </h3>
                    </div>
                    <span className="text-xs font-extrabold text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                      {score} <span className="text-slate-400 font-normal">/ {max}</span>
                    </span>
                  </div>

                  {/* One-line Static Explanation */}
                  <p className="text-[11px] text-slate-500 leading-snug pt-1">
                    {factor.explanation}
                  </p>
                </div>

                {/* Progress Bar & Feedback */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400">
                    <span>Score: {percentage}%</span>
                    <span>Max {max} pts</span>
                  </div>
                  <div className="w-full bg-slate-200/80 rounded-full h-2.5 overflow-hidden relative">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-1000 ease-out relative ${getProgressColor(score, max)}`}
                      style={{ width: `${Math.min(100, Math.max(4, percentage))}%` }}
                    >
                      {/* Subtle animated shimmer sheen */}
                      <div className="absolute inset-0 animate-shimmer opacity-70"></div>
                    </div>
                  </div>

                  {/* Engine Feedback Message */}
                  {data.feedback && (
                    <p className="text-[11px] font-medium text-slate-600 bg-white/80 p-2 rounded-lg border border-slate-200/60 leading-tight">
                      {data.feedback}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* AI QUALITATIVE ANALYSIS SECTION */}
      {/* ========================================================================= */}
      <div className="space-y-6 pt-2">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
            AI Analysis & Insights
          </span>
          <span className="text-xs text-slate-500">Google Gemini Powered Evaluation</span>
        </div>

        {/* Executive Summary Card */}
        {analysis.formattingAnalysis?.summary && (
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-3">
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

        {/* Skills Found vs Missing Skills */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Skills Found */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              Detected Skills & Keywords ({analysis.skillsFound?.length || 0})
            </h3>
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
                <div className="p-4 rounded-xl bg-slate-50 text-center w-full">
                  <p className="text-xs text-slate-400 italic">No skills identified in text.</p>
                </div>
              )}
            </div>
          </div>

          {/* Missing Skills */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
              Missing Role Keywords & Skills ({analysis.missingSkills?.length || 0})
            </h3>
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
                <div className="p-4 rounded-xl bg-emerald-50 text-center w-full">
                  <p className="text-xs text-emerald-700 font-semibold">
                    🎉 No missing critical skills identified!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Strengths & Weaknesses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Strengths */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              Candidate Strengths
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
                <p className="text-xs text-slate-400 italic">No specific strengths documented.</p>
              )}
            </ul>
          </div>

          {/* Weaknesses */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              Critical Areas to Polish
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
                <p className="text-xs text-slate-400 italic">No weaknesses recorded.</p>
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

        {/* Section-by-Section Analysis (Experience, Projects, Education) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Experience Analysis */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Experience Section</h4>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                {analysis.experienceAnalysis?.rating || 75}/100
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full ${getProgressColor(analysis.experienceAnalysis?.rating || 75)}`}
                style={{ width: `${analysis.experienceAnalysis?.rating || 75}%` }}
              ></div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {analysis.experienceAnalysis?.feedback || 'Experience section evaluated.'}
            </p>
            {analysis.experienceAnalysis?.bulletPointSuggestions &&
              analysis.experienceAnalysis.bulletPointSuggestions.length > 0 && (
                <div className="pt-2 border-t border-slate-100 space-y-1.5">
                  <p className="text-[11px] font-bold text-slate-700">Bullet Suggestions:</p>
                  {analysis.experienceAnalysis.bulletPointSuggestions.map((sug, idx) => (
                    <p key={idx} className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg">
                      &bull; {sug}
                    </p>
                  ))}
                </div>
              )}
          </div>

          {/* Projects Analysis */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Projects Section</h4>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                {analysis.projectAnalysis?.rating || 80}/100
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full ${getProgressColor(analysis.projectAnalysis?.rating || 80)}`}
                style={{ width: `${analysis.projectAnalysis?.rating || 80}%` }}
              ></div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {analysis.projectAnalysis?.feedback || 'Projects section evaluated.'}
            </p>
          </div>

          {/* Education Analysis */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Education Section</h4>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                {analysis.educationAnalysis?.rating || 80}/100
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full ${getProgressColor(analysis.educationAnalysis?.rating || 80)}`}
                style={{ width: `${analysis.educationAnalysis?.rating || 80}%` }}
              ></div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {analysis.educationAnalysis?.feedback || 'Education section evaluated.'}
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* INTERACTIVE AI BULLET ENHANCER WIDGET */}
      {/* ========================================================================= */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-2xs">
                STAR Method • AI Bullet Enhancer
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight mt-1">
              Enhance a Resume Bullet
            </h2>
          </div>
          <p className="text-xs text-slate-500 max-w-sm">
            Transform passive phrasing into action-packed, metrics-driven accomplishment statements.
          </p>
        </div>

        <form onSubmit={handleEnhanceBullet} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <label htmlFor="bulletInput" className="block text-xs font-bold text-slate-700">
                Paste Resume Bullet Point
              </label>
              <textarea
                id="bulletInput"
                rows={3}
                value={bulletInput}
                onChange={(e) => setBulletInput(e.target.value)}
                placeholder="e.g. Responsible for writing code and fixing bugs for our web application."
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                disabled={isEnhancing}
              />
              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                <span>Min 5 characters</span>
                <span>{bulletInput.length}/1000</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label htmlFor="targetRoleInput" className="block text-xs font-bold text-slate-700">
                  Target Role (Optional)
                </label>
                <input
                  id="targetRoleInput"
                  type="text"
                  value={targetRoleInput}
                  onChange={(e) => setTargetRoleInput(e.target.value)}
                  placeholder="e.g. Senior Frontend Engineer"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  disabled={isEnhancing}
                />
              </div>

              <button
                type="submit"
                disabled={isEnhancing || bulletInput.trim().length < 5}
                className="w-full flex items-center justify-center py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-md shadow-blue-500/20 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.01]"
              >
                {isEnhancing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Rewriting with AI...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Enhance Bullet Point
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Error Alert */}
        {enhancerError && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between text-xs text-red-700">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{enhancerError}</span>
            </div>
            <button
              onClick={() => setEnhancerError(null)}
              className="text-red-500 hover:text-red-700 font-bold ml-2"
            >
              &times;
            </button>
          </div>
        )}

        {/* Latest Enhanced Result Card */}
        {enhancementResult && (
          <div className="bg-gradient-to-br from-indigo-50/70 via-blue-50/50 to-slate-50 border border-indigo-100 rounded-2xl p-6 space-y-4 transition-all animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                ✨ Latest Enhanced Bullet
              </span>
              <button
                type="button"
                onClick={() => handleCopyText(enhancementResult.enhancedText, true)}
                className="inline-flex items-center px-3.5 py-1.5 rounded-lg bg-white border border-indigo-200 text-indigo-700 font-semibold text-xs shadow-2xs hover:bg-indigo-50 transition-colors"
              >
                {copiedLatest ? (
                  <>
                    <span className="text-emerald-600 font-bold mr-1">✓</span>
                    <span className="text-emerald-700">Copied!</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    Copy Enhanced Bullet
                  </>
                )}
              </button>
            </div>

            <div className="p-4 rounded-xl bg-white border border-indigo-100 shadow-2xs">
              <p className="text-sm font-semibold text-slate-900 leading-relaxed">
                &bull; {enhancementResult.enhancedText}
              </p>
            </div>

            {enhancementResult.changesSummary && enhancementResult.changesSummary.length > 0 && (
              <div className="space-y-2 pt-1">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Improvements Applied:
                </p>
                <div className="flex flex-wrap gap-2">
                  {enhancementResult.changesSummary.map((change, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white text-slate-700 border border-indigo-200/70 shadow-3xs"
                    >
                      ✓ {change}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Running List of Enhanced Bullets for this Analysis */}
        {analysis.enhancedBullets && analysis.enhancedBullets.length > 0 && (
          <div className="pt-6 border-t border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
                STAR Method Bullet Enhancements ({analysis.enhancedBullets.length})
              </h3>
              <span className="text-xs text-slate-400">Included in PDF Report</span>
            </div>

            <div className="space-y-4">
              {analysis.enhancedBullets.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 text-xs text-slate-500">
                      <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">
                        Original Bullet:
                      </span>
                      <p className="text-slate-700 italic bg-white p-2.5 rounded-xl border border-slate-200/60 leading-relaxed">
                        "{item.originalText}"
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyText(item.enhancedText, false, idx)}
                      className="flex-shrink-0 inline-flex items-center px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold text-xs shadow-2xs hover:bg-slate-100 transition-colors"
                    >
                      {copiedIdx === idx ? (
                        <>
                          <span className="text-emerald-600 font-bold mr-1">✓</span>
                          <span className="text-emerald-700">Copied!</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5 mr-1 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                          </svg>
                          Copy
                        </>
                      )}
                    </button>
                  </div>

                  <div className="space-y-1">
                    <span className="font-bold text-purple-700 uppercase text-[10px] tracking-wider">
                      Enhanced (STAR Method):
                    </span>
                    <p className="text-xs sm:text-sm font-semibold text-slate-900 bg-white p-3 rounded-xl border border-purple-100 shadow-3xs leading-relaxed">
                      &bull; {item.enhancedText}
                    </p>
                  </div>

                  {item.changesSummary && item.changesSummary.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {item.changesSummary.map((change, cIdx) => (
                        <span
                          key={cIdx}
                          className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                        >
                          ✓ {change}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Disclaimer Card */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
        <p className="text-[11px] text-slate-500 italic">
          Generated by AI Resume Analyzer — deterministic ATS score based on heuristic rules; qualitative feedback generated by Google Gemini AI.
        </p>
      </div>

      {/* Floating Toast Notification for Bullet Copy */}
      {copiedToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 bg-slate-900/95 backdrop-blur-md text-white rounded-2xl shadow-2xl border border-slate-700/80 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/40 animate-bounce">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-bold text-white">Copied to Clipboard!</p>
            <p className="text-[11px] text-slate-300">Ready to paste into your resume.</p>
          </div>
        </div>
      )}

      {/* Analyze Modal */}
      {showAnalyzeModal && resumeObj?._id && (
        <AnalyzeModal
          resumeId={resumeObj._id}
          resumeFileName={resumeObj.originalFileName || 'Resume'}
          isOpen={showAnalyzeModal}
          onClose={() => setShowAnalyzeModal(false)}
        />
      )}
    </div>
  );
};

export default AnalysisDetails;
