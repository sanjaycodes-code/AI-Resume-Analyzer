import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useAuth } from '../context/AuthContext';
import resumeApi from '../services/api/resumeApi';
import analysisApi from '../services/api/analysisApi';
import type { Resume, Analysis } from '../types';
import { ScoreGauge, getScoreBadgeClasses, SCORE_THRESHOLDS } from '../components/ScoreGauge';
import { useCountUp } from '../hooks/useCountUp';

// Register GSAP ScrollTrigger plugin once safely
gsap.registerPlugin(ScrollTrigger);

const getScoreTierCardClasses = (score?: number | null): { cardBg: string; iconBox: string } => {
  if (score === undefined || score === null) {
    return {
      cardBg: 'bg-white border-slate-200/80 hover:border-slate-300 shadow-sm',
      iconBox: 'bg-slate-50 text-slate-600 border-slate-200/80 shadow-3xs',
    };
  }
  if (score >= SCORE_THRESHOLDS.EXCELLENT) {
    return {
      cardBg: 'bg-emerald-50/50 hover:bg-emerald-50/80 border-emerald-200/60 hover:border-emerald-300/80 shadow-emerald-500/5',
      iconBox: 'bg-white text-emerald-700 border-emerald-200/80 shadow-3xs',
    };
  }
  if (score >= SCORE_THRESHOLDS.GOOD) {
    return {
      cardBg: 'bg-indigo-50/50 hover:bg-indigo-50/80 border-indigo-200/60 hover:border-indigo-300/80 shadow-indigo-500/5',
      iconBox: 'bg-white text-indigo-700 border-indigo-200/80 shadow-3xs',
    };
  }
  if (score >= SCORE_THRESHOLDS.FAIR) {
    return {
      cardBg: 'bg-amber-50/50 hover:bg-amber-50/80 border-amber-200/60 hover:border-amber-300/80 shadow-amber-500/5',
      iconBox: 'bg-white text-amber-700 border-amber-200/80 shadow-3xs',
    };
  }
  return {
    cardBg: 'bg-rose-50/50 hover:bg-rose-50/80 border-rose-200/60 hover:border-rose-300/80 shadow-rose-500/5',
    iconBox: 'bg-white text-rose-700 border-rose-200/80 shadow-3xs',
  };
};

const getScoreTierRowClasses = (score: number): string => {
  if (score >= SCORE_THRESHOLDS.EXCELLENT) {
    return 'bg-emerald-50/35 hover:bg-emerald-50/70 border-emerald-200/50 hover:border-emerald-300/80';
  }
  if (score >= SCORE_THRESHOLDS.GOOD) {
    return 'bg-indigo-50/35 hover:bg-indigo-50/70 border-indigo-200/50 hover:border-indigo-300/80';
  }
  if (score >= SCORE_THRESHOLDS.FAIR) {
    return 'bg-amber-50/35 hover:bg-amber-50/70 border-amber-200/50 hover:border-amber-300/80';
  }
  return 'bg-rose-50/35 hover:bg-rose-50/70 border-rose-200/50 hover:border-rose-300/80';
};

// Motion animation variants for staged hero entrance
const heroContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

const heroItemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

// Motion animation variants for score summary cards
const cardsContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.2,
    },
  },
};

const cardItemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: 'easeOut' },
  },
};

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const pageContainerRef = useRef<HTMLDivElement>(null);
  const bgBlobsRef = useRef<HTMLDivElement>(null);

  // Animated counters for Total Resumes & Total Analyses
  const animatedResumesCount = useCountUp(resumes.length, 600);
  const animatedAnalysesCount = useCountUp(analyses.length, 600);

  // Background subtle parallax on desktop scroll
  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      // Desktop / Tablet (>= 768px): Smooth background parallax drift
      mm.add('(min-width: 768px)', () => {
        if (bgBlobsRef.current && pageContainerRef.current) {
          gsap.to(bgBlobsRef.current, {
            y: 90,
            ease: 'none',
            scrollTrigger: {
              trigger: pageContainerRef.current,
              start: 'top top',
              end: 'bottom bottom',
              scrub: 0.8,
              invalidateOnRefresh: true,
            },
          });
        }
      });
    }, pageContainerRef);

    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 150);

    return () => {
      clearTimeout(timer);
      ctx.revert();
    };
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [resumesRes, analysesRes] = await Promise.all([
          resumeApi.listResumes(),
          analysisApi.listAnalyses(),
        ]);
        setResumes(resumesRes.data?.resumes || []);
        setAnalyses(analysesRes.data?.analyses || []);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const latestAnalysis = analyses.length > 0 ? analyses[0] : null;
  const overallCardTheme = getScoreTierCardClasses(latestAnalysis?.overallScore);
  const atsCardTheme = getScoreTierCardClasses(latestAnalysis?.atsScore);

  return (
    <div
      ref={pageContainerRef}
      className="relative flex-1 min-h-[calc(100vh-4rem)] overflow-hidden animate-ambient-canvas bg-[radial-gradient(ellipse_at_top,_rgba(241,245,249,0.95)_0%,_rgba(248,250,252,0.85)_45%,_rgba(238,242,255,0.5)_75%,_rgba(248,250,252,1)_100%)]"
    >
      {/* Faint Large Ambient Color Blobs Drifting Behind Cards and Lists */}
      <div ref={bgBlobsRef} className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Blob 1: Soft Pastel Indigo / Violet (Top-Right / Mid) */}
        <div className="absolute top-[320px] -right-32 w-[520px] h-[520px] rounded-full bg-gradient-to-bl from-indigo-200/25 via-purple-100/15 to-transparent blur-3xl animate-float-slow" />

        {/* Blob 2: Soft Pastel Slate / Blue (Bottom-Left) */}
        <div className="absolute bottom-[100px] -left-32 w-[480px] h-[480px] rounded-full bg-gradient-to-tr from-blue-200/20 via-indigo-50/20 to-transparent blur-3xl animate-float-reverse" />

        {/* Blob 3: Mid-Scroll Atmospheric Drift (Desktop Only) */}
        <div className="hidden md:block absolute top-[60%] left-1/3 w-[420px] h-[420px] rounded-full bg-gradient-to-r from-purple-100/15 to-slate-200/15 blur-3xl animate-float-drift" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
        
        {/* Animated Dramatic Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-950 text-white p-6 sm:p-10 shadow-2xl border border-indigo-900/40">
          
          {/* Animated Gradient Mesh Layer */}
          <div
            className="absolute inset-0 animate-gradient-mesh opacity-90 pointer-events-none"
            style={{
              backgroundImage: `
                radial-gradient(circle at 15% 20%, rgba(99, 102, 241, 0.45) 0%, transparent 40%),
                radial-gradient(circle at 85% 75%, rgba(168, 85, 247, 0.4) 0%, transparent 45%),
                radial-gradient(circle at 50% 50%, rgba(30, 27, 75, 0.95) 0%, rgba(2, 6, 23, 1) 100%)
              `,
            }}
          />

          {/* Subtle Grid Texture */}
          <div className="absolute inset-0 bg-grid-pattern opacity-15 pointer-events-none" />

          {/* Drifting Glowing Orbs (Tailored for Dark Canvas) */}
          <div className="absolute -top-12 -left-12 w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-gradient-to-br from-indigo-500/30 to-violet-600/25 blur-3xl pointer-events-none animate-float-slow" />
          <div className="absolute -bottom-16 -right-16 w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-gradient-to-tl from-purple-500/30 to-indigo-600/20 blur-3xl pointer-events-none animate-float-reverse" />
          <div className="hidden md:block absolute top-1/4 left-1/3 w-64 h-64 rounded-full bg-gradient-to-tr from-blue-600/20 to-fuchsia-500/15 blur-2xl pointer-events-none animate-float-drift" />

          {/* Hero Content with Staggered Framer Motion Entrance */}
          <motion.div
            variants={heroContainerVariants}
            initial="hidden"
            animate="visible"
            className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6"
          >
            <div className="space-y-3 max-w-xl">
              {/* Recruiter Badge with Pulsing Glow */}
              <motion.div variants={heroItemVariants}>
                <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-200 border border-indigo-500/40 backdrop-blur-md animate-badge-glow shadow-sm">
                  ✨ Recruiter-Grade AI Optimization
                </span>
              </motion.div>

              {/* Headings */}
              <motion.h1
                variants={heroItemVariants}
                className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white drop-shadow-sm"
              >
                Welcome back, {user?.name || 'Candidate'}
              </motion.h1>

              <motion.p
                variants={heroItemVariants}
                className="text-slate-300 text-sm sm:text-base leading-relaxed"
              >
                Track your ATS scores, scan resumes against job requirements, and upgrade experience with the STAR method.
              </motion.p>
            </div>

            {/* Action Buttons with Subtle Hover Box-Shadow Bloom */}
            <motion.div variants={heroItemVariants} className="flex flex-wrap items-center gap-3">
              <Link
                to="/upload"
                className="inline-flex items-center justify-center px-5 py-3 rounded-2xl bg-white text-slate-900 font-bold text-sm shadow-md hover:bg-slate-50 transition-all hover:scale-[1.02] hover:shadow-[0_0_22px_rgba(255,255,255,0.35)] active:scale-[0.97] w-full sm:w-auto group"
              >
                <svg className="w-5 h-5 mr-2 text-indigo-600 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Upload Resume
              </Link>
              <Link
                to="/job-match"
                className="inline-flex items-center justify-center px-5 py-3 rounded-2xl bg-purple-900/40 text-white border border-purple-400/30 font-bold text-sm backdrop-blur-md hover:bg-purple-900/60 transition-all hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(168,85,247,0.4)] active:scale-[0.97] w-full sm:w-auto group"
              >
                <svg className="w-5 h-5 mr-2 text-purple-300 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Target a Job
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Summary Cards: Calm, Readable & Micro-Interactive */}
        <motion.div
          variants={cardsContainerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {/* Latest Overall Score Gauge */}
          <motion.div
            variants={cardItemVariants}
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ duration: 0.15 }}
            className={`p-6 rounded-3xl border shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow duration-300 cursor-default ${overallCardTheme.cardBg}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Latest Overall Score
              </span>
              <div className={`w-8 h-8 rounded-xl border flex items-center justify-center ${overallCardTheme.iconBox}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            {isLoading ? (
              <div className="h-24 skeleton-shimmer rounded-2xl my-1" />
            ) : latestAnalysis ? (
              <div className="flex items-center justify-center py-1">
                <ScoreGauge
                  score={latestAnalysis.overallScore}
                  label="Overall Match"
                  size="sm"
                />
              </div>
            ) : (
              <div className="py-6 text-center">
                <p className="text-3xl font-extrabold text-slate-300">--</p>
                <p className="text-xs text-slate-400 mt-1">No analyses yet</p>
              </div>
            )}
            <p className="text-[11px] text-slate-500 mt-1 text-center sm:text-left">
              {latestAnalysis ? 'Weighted AI + ATS composite' : 'Awaiting first analysis'}
            </p>
          </motion.div>

          {/* Latest ATS Score Gauge */}
          <motion.div
            variants={cardItemVariants}
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ duration: 0.15 }}
            className={`p-6 rounded-3xl border shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow duration-300 cursor-default ${atsCardTheme.cardBg}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Latest ATS Score
              </span>
              <div className={`w-8 h-8 rounded-xl border flex items-center justify-center ${atsCardTheme.iconBox}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            {isLoading ? (
              <div className="h-24 skeleton-shimmer rounded-2xl my-1" />
            ) : latestAnalysis ? (
              <div className="flex items-center justify-center py-1">
                <ScoreGauge
                  score={latestAnalysis.atsScore}
                  label="ATS Heuristics"
                  size="sm"
                />
              </div>
            ) : (
              <div className="py-6 text-center">
                <p className="text-3xl font-extrabold text-slate-300">--</p>
                <p className="text-xs text-slate-400 mt-1">No analyses yet</p>
              </div>
            )}
            <p className="text-[11px] text-slate-500 mt-1 text-center sm:text-left">
              {latestAnalysis ? 'Deterministic scan score' : 'Awaiting first analysis'}
            </p>
          </motion.div>

          {/* Total Resumes (Metric Card with Count-Up) */}
          <motion.div
            variants={cardItemVariants}
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ duration: 0.15 }}
            className="bg-slate-50/70 hover:bg-slate-100/80 p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow duration-300 cursor-default"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Total Resumes
              </span>
              <div className="w-8 h-8 rounded-xl bg-white text-slate-700 border border-slate-200/80 flex items-center justify-center shadow-3xs">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <div className="my-3">
              {isLoading ? (
                <div className="h-8 skeleton-shimmer rounded-lg w-16 my-1" />
              ) : (
                <p className="text-4xl font-extrabold text-slate-900 tracking-tight">
                  {animatedResumesCount}
                </p>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {resumes.length === 1 ? '1 active resume file' : `${resumes.length} active resume files`}
            </p>
          </motion.div>

          {/* Total Analyses (Metric Card with Count-Up) */}
          <motion.div
            variants={cardItemVariants}
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ duration: 0.15 }}
            className="bg-purple-50/50 hover:bg-purple-50/80 p-6 rounded-3xl border border-purple-200/60 shadow-sm shadow-purple-500/5 flex flex-col justify-between hover:shadow-md transition-shadow duration-300 cursor-default"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Total Analyses
              </span>
              <div className="w-8 h-8 rounded-xl bg-white text-purple-700 border border-purple-200/80 flex items-center justify-center shadow-3xs">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <div className="my-3">
              {isLoading ? (
                <div className="h-8 skeleton-shimmer rounded-lg w-16 my-1" />
              ) : (
                <p className="text-4xl font-extrabold text-slate-900 tracking-tight">
                  {animatedAnalysesCount}
                </p>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {analyses.length === 1 ? '1 generated report' : `${analyses.length} generated reports`}
            </p>
          </motion.div>
        </motion.div>

        {/* Main Grid: Recent Analyses + Uploaded Resumes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Analyses List */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                Recent AI & ATS Reports
              </h2>
              {analyses.length > 0 && (
                <span className="text-xs font-semibold text-slate-500">
                  {analyses.length} total
                </span>
              )}
            </div>

            {isLoading ? (
              <div className="space-y-3">
                <div className="h-16 skeleton-shimmer rounded-2xl" />
                <div className="h-16 skeleton-shimmer rounded-2xl" />
              </div>
            ) : analyses.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                <p className="text-xs text-slate-600 font-medium">No analysis reports generated yet.</p>
                <Link
                  to="/job-match"
                  className="inline-flex items-center px-4 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-700 active:scale-[0.97] transition-all"
                >
                  Run First Analysis
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {analyses.slice(0, 4).map((item, index) => {
                  const resName =
                    typeof item.resumeId === 'object' && item.resumeId?.originalFileName
                      ? item.resumeId.originalFileName
                      : 'Resume';
                  const jobTitle =
                    typeof item.jobDescriptionId === 'object' && item.jobDescriptionId?.title
                      ? item.jobDescriptionId.title
                      : null;

                  return (
                    <motion.div
                      key={item._id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: Math.min(index * 0.06, 0.3), ease: 'easeOut' }}
                      whileHover={{ scale: 1.008 }}
                      className={`p-3.5 rounded-2xl border transition-all duration-200 flex items-center justify-between shadow-2xs ${getScoreTierRowClasses(
                        item.overallScore
                      )}`}
                    >
                      <div className="flex items-center space-x-3 truncate mr-2 min-w-0">
                        {/* Dynamic Multi-Tier Score Badge (Consistent with ScoreGauge) */}
                        <div
                          className={`w-10 h-10 rounded-xl font-extrabold text-xs flex items-center justify-center flex-shrink-0 border shadow-3xs ${getScoreBadgeClasses(
                            item.overallScore
                          )}`}
                        >
                          {item.overallScore}
                        </div>
                        <div className="truncate min-w-0">
                          <Link
                            to={`/analysis/${item._id}`}
                            className="text-xs font-bold text-slate-900 hover:text-purple-600 transition-colors truncate block"
                          >
                            {resName}
                          </Link>
                          <p className="text-[11px] text-slate-500 truncate">
                            {jobTitle ? `Target: ${jobTitle}` : 'General Review'} &middot; ATS: {item.atsScore}/100
                          </p>
                        </div>
                      </div>
                      <Link
                        to={`/analysis/${item._id}`}
                        className="text-xs font-bold text-purple-700 hover:bg-white/90 bg-white/60 border border-purple-200/70 px-3 py-1.5 rounded-xl active:scale-[0.97] transition-all flex-shrink-0 shadow-3xs"
                      >
                        View &rarr;
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Uploaded Resumes List */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                Your Resumes
              </h2>
              <Link
                to="/history"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                View all ({resumes.length}) &rarr;
              </Link>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                <div className="h-16 skeleton-shimmer rounded-2xl" />
                <div className="h-16 skeleton-shimmer rounded-2xl" />
              </div>
            ) : resumes.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                <p className="text-xs text-slate-600 font-medium">No resumes uploaded yet.</p>
                <Link
                  to="/upload"
                  className="inline-flex items-center px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 active:scale-[0.97] transition-all"
                >
                  Upload Resume
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {resumes.slice(0, 4).map((item, index) => (
                  <motion.div
                    key={item._id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: Math.min(index * 0.06, 0.3), ease: 'easeOut' }}
                    whileHover={{ scale: 1.008 }}
                    className="p-3.5 rounded-2xl border bg-slate-50/70 hover:bg-indigo-50/40 border-slate-200/70 hover:border-indigo-200/80 transition-all duration-200 flex items-center justify-between shadow-2xs"
                  >
                    <div className="flex items-center space-x-3 truncate mr-2 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-white text-indigo-700 font-bold text-xs flex items-center justify-center flex-shrink-0 border border-indigo-200/80 shadow-3xs">
                        {item.fileType.toUpperCase()}
                      </div>
                      <div className="truncate min-w-0">
                        <Link
                          to={`/resumes/${item._id}`}
                          className="text-xs font-bold text-slate-900 hover:text-blue-600 transition-colors truncate block"
                        >
                          {item.originalFileName}
                        </Link>
                        <p className="text-[11px] text-slate-500 truncate">
                          {item.parsedSections?.skills?.length || 0} skills &middot; {new Date(item.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/resumes/${item._id}`}
                        className="text-xs font-bold text-blue-700 hover:bg-white/90 bg-white/60 border border-blue-200/70 px-3 py-1.5 rounded-xl active:scale-[0.97] transition-all flex-shrink-0 shadow-3xs"
                      >
                        Inspect
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
