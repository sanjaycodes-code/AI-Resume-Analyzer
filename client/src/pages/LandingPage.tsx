import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useAuth } from '../context/AuthContext';
import { ScoreGauge } from '../components/ScoreGauge';
import { Zap, Sparkles, FileDown, ArrowRight, CheckCircle2 } from 'lucide-react';

// Register GSAP ScrollTrigger plugin once safely
gsap.registerPlugin(ScrollTrigger);

export const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const heroSectionRef = useRef<HTMLDivElement>(null);
  const heroContentRef = useRef<HTMLDivElement>(null);
  const bgOrbsRef = useRef<HTMLDivElement>(null);

  const features = [
    {
      title: 'Instant ATS Score',
      desc: 'Scan resumes against 6 deterministic heuristics including verb impact, measurable metrics, and contact integrity.',
      icon: <Zap className="w-6 h-6 text-indigo-600" />,
      cardBg: 'bg-indigo-50/50 hover:bg-indigo-50/85 border-indigo-200/60 hover:border-indigo-300/80 shadow-indigo-500/5',
      iconBox: 'bg-white text-indigo-600 border-indigo-100/90 shadow-sm shadow-indigo-100/80',
    },
    {
      title: 'STAR Bullet Enhancer',
      desc: 'Transform passive resume bullet points into high-impact, quantified Situation-Task-Action-Result power statements.',
      icon: <Sparkles className="w-6 h-6 text-purple-600" />,
      cardBg: 'bg-purple-50/50 hover:bg-purple-50/85 border-purple-200/60 hover:border-purple-300/80 shadow-purple-500/5',
      iconBox: 'bg-white text-purple-600 border-purple-100/90 shadow-sm shadow-purple-100/80',
    },
    {
      title: 'Vector PDF Reports',
      desc: 'Download executive multi-page audit reports with deterministic score breakdowns and AI recruiter summaries.',
      icon: <FileDown className="w-6 h-6 text-emerald-600" />,
      cardBg: 'bg-emerald-50/50 hover:bg-emerald-50/85 border-emerald-200/60 hover:border-emerald-300/80 shadow-emerald-500/5',
      iconBox: 'bg-white text-emerald-600 border-emerald-100/90 shadow-sm shadow-emerald-100/80',
    },
  ];

  // Sheryians-style scroll-scrubbed hero zoom & background parallax (Desktop only)
  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      // 1. Desktop / Tablet (>= 768px): Full cinematic zoom & deep parallax
      mm.add('(min-width: 768px)', () => {
        if (heroContentRef.current && heroSectionRef.current) {
          gsap.to(heroContentRef.current, {
            scale: 1.16,
            opacity: 0.88,
            transformOrigin: 'center center',
            ease: 'none',
            scrollTrigger: {
              trigger: heroSectionRef.current,
              start: 'top top',
              end: 'bottom top',
              scrub: 0.8, // Smooth lagged scrub
              invalidateOnRefresh: true,
            },
          });
        }

        if (bgOrbsRef.current && heroSectionRef.current) {
          gsap.to(bgOrbsRef.current, {
            y: 120,
            ease: 'none',
            scrollTrigger: {
              trigger: heroSectionRef.current,
              start: 'top top',
              end: 'bottom top',
              scrub: 0.8,
              invalidateOnRefresh: true,
            },
          });
        }
      });

      // 2. Mobile (< 768px): Touch-calibrated subtle zoom & parallax (zero edge clipping, responsive touch)
      mm.add('(max-width: 767px)', () => {
        if (heroContentRef.current && heroSectionRef.current) {
          gsap.to(heroContentRef.current, {
            scale: 1.05,
            opacity: 0.92,
            transformOrigin: 'center center',
            ease: 'none',
            scrollTrigger: {
              trigger: heroSectionRef.current,
              start: 'top top',
              end: 'bottom top',
              scrub: 0.4, // Faster scrub tuned for thumb swipe inertia
              invalidateOnRefresh: true,
            },
          });
        }

        if (bgOrbsRef.current && heroSectionRef.current) {
          gsap.to(bgOrbsRef.current, {
            y: 40,
            ease: 'none',
            scrollTrigger: {
              trigger: heroSectionRef.current,
              start: 'top top',
              end: 'bottom top',
              scrub: 0.4,
              invalidateOnRefresh: true,
            },
          });
        }
      });
    }, containerRef);

    // Refresh ScrollTrigger after initial render and font settling
    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 150);

    return () => {
      clearTimeout(timer);
      ctx.revert(); // Safely kill all ScrollTrigger instances on unmount/route change
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex-1 relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50/60 via-slate-50 to-slate-50 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12 sm:py-16 min-h-[calc(100vh-4rem)]"
    >
      {/* 1. Ambient Background Grid Pattern (Layered & Non-distracting) */}
      <div className="absolute inset-0 bg-grid-pattern pointer-events-none opacity-60 z-0" />

      {/* 2. Floating Animated Gradient Orbs with GSAP Parallax Layer */}
      <div ref={bgOrbsRef} className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute -top-12 -left-20 w-80 sm:w-96 h-80 sm:h-96 rounded-full bg-indigo-300/20 blur-3xl animate-float-slow" />
        <div className="absolute top-1/4 -right-24 w-80 sm:w-96 h-80 sm:h-96 rounded-full bg-purple-300/20 blur-3xl animate-float-reverse" />
        <div className="absolute -bottom-16 left-1/3 w-72 sm:w-80 h-72 sm:h-80 rounded-full bg-blue-200/25 blur-3xl animate-float-slow" />
      </div>

      {/* Main Content Container (z-10) */}
      <div className="relative z-10 max-w-6xl w-full mx-auto space-y-12 sm:space-y-16">
        {/* Hero Section Container for ScrollTrigger */}
        <div ref={heroSectionRef} className="w-full">
          {/* Hero Visual & Headline Grid (Scroll-Scrubbed Zoom Element) */}
          <div
            ref={heroContentRef}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center will-change-transform"
          >
            {/* Left Column: Headline & CTA */}
            <div className="lg:col-span-7 text-center lg:text-left space-y-6">
              {/* Pill Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50/90 text-indigo-700 border border-indigo-200/70 shadow-2xs backdrop-blur-sm">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                <span className="text-xs font-bold tracking-wide">
                  Next-Gen AI Resume & ATS Intelligence
                </span>
              </div>

              {/* Headline */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
                Land More Interviews with{' '}
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Intelligent ATS
                </span>{' '}
                Precision
              </h1>

              {/* Subheadline */}
              <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Scan against 6 deterministic ATS scoring factors, rewrite experience using the STAR method, and target specific jobs with instant recruiter-grade feedback.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                {isAuthenticated ? (
                  <Link
                    to="/dashboard"
                    className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.97] transition-all"
                  >
                    Go to Dashboard
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/register"
                      className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.97] transition-all"
                    >
                      Get Started Free
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                    <Link
                      to="/login"
                      className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 rounded-2xl bg-white/90 border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 hover:scale-[1.01] active:scale-[0.97] transition-all"
                    >
                      Sign In
                    </Link>
                  </>
                )}
              </div>

              {/* Quick Micro Proof */}
              <div className="flex items-center justify-center lg:justify-start gap-4 text-xs font-semibold text-slate-500 pt-1">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Free to use
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Instant PDF export
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> STAR bullet AI
                </span>
              </div>
            </div>

            {/* Right Column: Live Sample Score Preview Card */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-sm bg-white/90 backdrop-blur-xl p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 relative group">
                {/* Sample Tag */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-slate-800">ATS Scan Preview</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200/70">
                    Sample Demo
                  </span>
                </div>

                {/* Sample ScoreGauge */}
                <ScoreGauge
                  score={82}
                  label="Sample Candidate Score"
                  subtitle="High Recruiter Match"
                  size="lg"
                  className="my-1"
                />

                {/* Sample Metrics Rows */}
                <div className="space-y-2 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      Quantified Achievements
                    </span>
                    <span className="font-bold text-slate-900">18/20 pts</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      Action Verb Strength
                    </span>
                    <span className="font-bold text-slate-900">14/15 pts</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      Standard ATS Sections
                    </span>
                    <span className="font-bold text-slate-900">20/20 pts</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Highlights 3-Card Grid with Scroll-Reveal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="space-y-4 pt-4"
        >
          <div className="text-center max-w-xl mx-auto space-y-1">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Engineered for Complete ATS & Career Success
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
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
                transition={{ duration: 0.45, delay: index * 0.1, ease: 'easeOut' }}
                className={`backdrop-blur-md p-6 sm:p-7 rounded-3xl border shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between space-y-4 ${feature.cardBg}`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${feature.iconBox}`}>
                  {feature.icon}
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">
                    {feature.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Footer Status Pill */}
        <div className="pt-6 border-t border-slate-200/60 flex items-center justify-center space-x-2 text-xs font-medium text-slate-500">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span>System Operational</span>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
