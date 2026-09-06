import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
  Zap,
  Sparkles,
  FileDown,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  FileText,
  Target,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      title: 'Deterministic ATS Score',
      desc: 'Instant 7-factor mathematical scoring measuring action verb density, measurable numbers, formatting, and structural integrity.',
      icon: <Zap className="w-6 h-6 text-emerald-400" />,
      cardBg: 'bg-slate-900/60 hover:bg-slate-900/85 border-white/10 hover:border-emerald-500/40 shadow-xl shadow-black/40',
      iconBox: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-sm shadow-emerald-500/10',
    },
    {
      title: 'STAR-Method AI Rewriter',
      desc: 'Rewrites passive bullet points into high-impact Situation-Task-Action-Result statements with quantified metrics.',
      icon: <Sparkles className="w-6 h-6 text-teal-400" />,
      cardBg: 'bg-slate-900/60 hover:bg-slate-900/85 border-white/10 hover:border-teal-500/40 shadow-xl shadow-black/40',
      iconBox: 'bg-teal-500/10 text-teal-400 border-teal-500/20 shadow-sm shadow-teal-500/10',
    },
    {
      title: 'Vector PDF Audit Reports',
      desc: 'Download clean, multi-page vector PDF candidate audits streamed directly from Node.js using lightweight PDFKit.',
      icon: <FileDown className="w-6 h-6 text-emerald-400" />,
      cardBg: 'bg-slate-900/60 hover:bg-slate-900/85 border-white/10 hover:border-emerald-500/40 shadow-xl shadow-black/40',
      iconBox: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-sm shadow-emerald-500/10',
    },
  ];

  return (
    <div className="flex-1 relative overflow-hidden bg-[#090d16] text-white flex flex-col justify-start items-center px-4 sm:px-6 lg:px-8 py-12 sm:py-16 min-h-[calc(100vh-4rem)]">
      {/* 1. Subtle Scattered Dot/Particle Texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20 z-0"
        style={{
          backgroundImage:
            'radial-gradient(rgba(255, 255, 255, 0.25) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* 2. Ambient Glowing Orbs in Emerald / Mint (Purely Decorative) */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-12 -left-32 w-96 h-96 rounded-full bg-emerald-500/10 blur-[130px]" />
        <div className="absolute top-48 -right-32 w-96 h-96 rounded-full bg-teal-500/10 blur-[130px]" />
        <div className="absolute bottom-10 left-1/3 w-80 h-80 rounded-full bg-emerald-600/10 blur-[140px]" />
      </div>

      {/* Main Content Container (z-10) */}
      <div className="relative z-10 max-w-6xl w-full mx-auto space-y-16 sm:space-y-20">
        {/* ========================================================================= */}
        {/* HERO SECTION: Centered Headline, Subtext, and CTA Buttons */}
        {/* ========================================================================= */}
        <div className="text-center max-w-4xl mx-auto space-y-6 pt-2 sm:pt-6">
          {/* Scoped Mint/Emerald Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-xs font-semibold backdrop-blur-md shadow-sm shadow-emerald-500/10"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="tracking-wide">AI-Powered Resume Optimization & ATS Intelligence</span>
          </motion.div>

          {/* Large Bold White Heading with Mint/Emerald Accent */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.12]"
          >
            Land More Interviews with{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500">
              Intelligent ATS
            </span>{' '}
            Precision
          </motion.h1>

          {/* Subtext in Muted Grey */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.16 }}
            className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed"
          >
            Scan against 7 deterministic ATS scoring pillars, find missing skill keywords, and rewrite passive experience into quantified STAR power statements.
          </motion.p>

          {/* Pill-Shaped CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.22 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2"
          >
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                >
                  Get Started Free
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
                <Link
                  to="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-3.5 rounded-full bg-slate-900/80 hover:bg-slate-800/90 border border-white/15 text-slate-200 hover:text-white font-medium text-sm hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 backdrop-blur-sm"
                >
                  Sign In
                </Link>
              </>
            )}
          </motion.div>

          {/* Micro Proof Ticker */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-5 text-xs font-medium text-slate-400 pt-1"
          >
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Free to use
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 7-Pillar Heuristic Scanner
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Vector PDF Export
            </span>
          </motion.div>
        </div>

        {/* ========================================================================= */}
        {/* FLOATING GLASS CARD COMPOSITION WITH GLOWING EMERALD ARC/SPHERE SILHOUETTE */}
        {/* ========================================================================= */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-5xl mx-auto pt-6 pb-8"
        >
          {/* Subtle Glowing Emerald Arc / Sphere Silhouette */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[540px] h-[220px] sm:h-[320px] rounded-full bg-emerald-500/15 blur-[90px] pointer-events-none -z-10" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] rounded-full border border-emerald-500/10 pointer-events-none -z-10" />

          {/* Glass Card Stage Container */}
          <div className="relative min-h-[460px] sm:min-h-[520px] flex items-center justify-center">
            {/* ------------------------------------------------------------- */}
            {/* Card 1: Main Centerpiece - ATS Score Live Preview Card */}
            {/* ------------------------------------------------------------- */}
            <div
              className="relative z-20 w-full max-w-sm sm:max-w-md bg-slate-900/80 backdrop-blur-xl p-6 sm:p-7 rounded-3xl border border-white/15 shadow-2xl shadow-black/80 transform rotate-[-1deg]"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3.5 mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-bold text-white tracking-wide">
                    ATS Audit Preview
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Sample Result
                </span>
              </div>

              {/* Central Visual Score Meter (Native High-Contrast Emerald Ring) */}
              <div className="flex flex-col items-center justify-center py-2">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    {/* Background Track */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke="rgba(255, 255, 255, 0.08)"
                      strokeWidth="8"
                    />
                    {/* Animated Emerald Progress */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke="#10b981"
                      strokeWidth="8"
                      strokeDasharray="251.2"
                      strokeDashoffset="30" /* ~88% */
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-3xl font-black text-white tracking-tight">88</span>
                    <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                      / 100 PTS
                    </span>
                  </div>
                </div>
                <p className="text-xs font-semibold text-emerald-400 mt-2">
                  Exceptional ATS Match • Top 5%
                </p>
              </div>

              {/* Metric Breakdown Rows */}
              <div className="space-y-2.5 pt-4 border-t border-white/10 mt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Quantified Metrics
                  </span>
                  <span className="font-bold text-emerald-400">18 / 18 pts</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Action Verb Density
                  </span>
                  <span className="font-bold text-emerald-400">17 / 18 pts</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Structural Completeness
                  </span>
                  <span className="font-bold text-emerald-400">13 / 13 pts</span>
                </div>
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* Card 2: Floating Top-Left - Resumes Analyzed Stat Card */}
            {/* Static rotation: -6deg (No mouse tracking) */}
            {/* ------------------------------------------------------------- */}
            <div
              className="absolute -top-4 sm:-top-6 left-0 sm:left-6 z-30 bg-slate-900/85 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-xl shadow-black/60 max-w-[210px] transform -rotate-6 hidden xs:flex flex-col gap-2"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-base font-extrabold text-white leading-tight">2,400+</div>
                  <div className="text-[11px] text-slate-400">Resumes Audited</div>
                </div>
              </div>
              <div className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md self-start border border-emerald-500/20">
                +38% Recruiter Response
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* Card 3: Floating Top-Right - STAR AI Bullet Enhancer Card */}
            {/* Static rotation: +5deg (No mouse tracking) */}
            {/* ------------------------------------------------------------- */}
            <div
              className="absolute -top-2 sm:-top-4 right-0 sm:right-6 z-30 bg-slate-900/85 backdrop-blur-xl border border-emerald-500/25 p-4 rounded-2xl shadow-xl shadow-black/60 max-w-[250px] transform rotate-6 hidden sm:flex flex-col gap-2"
            >
              <div className="flex items-center justify-between text-xs border-b border-white/10 pb-2">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                  STAR AI Rewrite
                </span>
                <span className="text-[10px] font-bold text-emerald-400">Active</span>
              </div>
              <div className="text-[11px] text-slate-400 line-through opacity-70">
                Worked on database speed
              </div>
              <div className="text-[11px] font-medium text-emerald-300 bg-emerald-950/40 p-2 rounded-lg border border-emerald-500/20 leading-snug">
                Architected MongoDB indexing, reducing query latency by 45%.
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* Card 4: Floating Bottom-Left - Keyword Match Pill */}
            {/* Static rotation: +4deg (No mouse tracking) */}
            {/* ------------------------------------------------------------- */}
            <div
              className="absolute bottom-2 sm:bottom-4 left-2 sm:left-12 z-30 bg-slate-900/85 backdrop-blur-xl border border-white/10 px-4 py-3 rounded-2xl shadow-xl shadow-black/60 transform rotate-3 hidden md:flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Target Skills: 96% Match</div>
                <div className="flex gap-1.5 mt-1">
                  <span className="text-[9px] font-bold text-emerald-300 bg-emerald-500/15 px-1.5 py-0.5 rounded">
                    React
                  </span>
                  <span className="text-[9px] font-bold text-emerald-300 bg-emerald-500/15 px-1.5 py-0.5 rounded">
                    TypeScript
                  </span>
                  <span className="text-[9px] font-bold text-emerald-300 bg-emerald-500/15 px-1.5 py-0.5 rounded">
                    Node.js
                  </span>
                </div>
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* Card 5: Floating Bottom-Right - Vector PDF Export Pill */}
            {/* Static rotation: -4deg (No mouse tracking) */}
            {/* ------------------------------------------------------------- */}
            <div
              className="absolute bottom-2 sm:bottom-4 right-2 sm:right-12 z-30 bg-slate-900/85 backdrop-blur-xl border border-white/10 px-4 py-3 rounded-2xl shadow-xl shadow-black/60 transform -rotate-3 hidden md:flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Vector PDF Export</div>
                <div className="text-[10px] text-slate-400">Lightweight • Streamed in 0.2s</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ========================================================================= */}
        {/* FEATURE HIGHLIGHTS: 3-Card Grid Styled for Cohesive Dark Aesthetic */}
        {/* ========================================================================= */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="space-y-6 pt-6"
        >
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Engineered for Complete ATS & Career Success
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Everything you need to outsmart automated applicant tracking systems.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: index * 0.08, ease: 'easeOut' }}
                className={`backdrop-blur-md p-6 sm:p-7 rounded-3xl border transition-all duration-300 flex flex-col justify-between space-y-4 hover:-translate-y-1 ${feature.cardBg}`}
              >
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${feature.iconBox}`}
                >
                  {feature.icon}
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-white tracking-tight">
                    {feature.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ========================================================================= */}
        {/* FOOTER STATUS PILL */}
        {/* ========================================================================= */}
        <div className="pt-8 border-t border-white/10 flex items-center justify-center space-x-2 text-xs font-medium text-slate-400">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span>System Operational • Deterministic Heuristic Engine v2.1.0</span>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
