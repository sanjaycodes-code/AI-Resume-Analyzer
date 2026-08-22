import React, { useEffect, useState } from 'react';

export const SCORE_THRESHOLDS = {
  EXCELLENT: 80,
  GOOD: 65,
  FAIR: 50,
} as const;

export const SCORE_COLORS = {
  EMERALD: '#059669', // 80+
  INDIGO: '#4f46e5',  // 65-79
  AMBER: '#d97706',   // 50-64
  ROSE: '#e11d48',    // <50
} as const;

export interface ScoreGaugeProps {
  score: number;
  label: string;
  size?: 'sm' | 'md' | 'lg';
  subtitle?: string;
  className?: string;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({
  score,
  label,
  size = 'md',
  subtitle,
  className = '',
}) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  // Clamp score between 0 and 100
  const normalizedScore = Math.max(0, Math.min(100, Math.round(score || 0)));

  // Determine color based on threshold constants
  const getStrokeColor = (val: number): string => {
    if (val >= SCORE_THRESHOLDS.EXCELLENT) return SCORE_COLORS.EMERALD;
    if (val >= SCORE_THRESHOLDS.GOOD) return SCORE_COLORS.INDIGO;
    if (val >= SCORE_THRESHOLDS.FAIR) return SCORE_COLORS.AMBER;
    return SCORE_COLORS.ROSE;
  };

  const getTierLabel = (val: number): string => {
    if (val >= SCORE_THRESHOLDS.EXCELLENT) return 'Excellent';
    if (val >= SCORE_THRESHOLDS.GOOD) return 'Good';
    if (val >= SCORE_THRESHOLDS.FAIR) return 'Needs Work';
    return 'Critical';
  };

  // Dimensions & Configuration for Sizes
  const sizeConfig = {
    sm: {
      dimension: 80,
      radius: 30,
      strokeWidth: 6,
      scoreFont: 'text-lg font-bold',
      labelFont: 'text-xs font-semibold',
    },
    md: {
      dimension: 120,
      radius: 46,
      strokeWidth: 8,
      scoreFont: 'text-2xl font-extrabold',
      labelFont: 'text-sm font-semibold',
    },
    lg: {
      dimension: 160,
      radius: 64,
      strokeWidth: 10,
      scoreFont: 'text-4xl font-black',
      labelFont: 'text-base font-bold',
    },
  }[size];

  const { dimension, radius, strokeWidth, scoreFont, labelFont } = sizeConfig;
  const center = dimension / 2;
  const circumference = 2 * Math.PI * radius;

  // Animate count-up smoothly on mount / update
  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 850; // ms

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease out cubic: 1 - (1 - t)^3
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(easeProgress * normalizedScore));

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    const animId = window.requestAnimationFrame(step);
    const mountTimer = setTimeout(() => setIsMounted(true), 50);

    return () => {
      window.cancelAnimationFrame(animId);
      clearTimeout(mountTimer);
    };
  }, [normalizedScore]);

  // Dashoffset calculation (0 when 100%, circumference when 0%)
  const strokeDashoffset = isMounted
    ? circumference - (normalizedScore / 100) * circumference
    : circumference;

  const activeColor = getStrokeColor(normalizedScore);

  return (
    <div
      className={`flex flex-col items-center justify-center p-3 text-center ${className}`}
      role="progressbar"
      aria-valuenow={normalizedScore}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${label}: ${normalizedScore} out of 100 (${getTierLabel(normalizedScore)})`}
    >
      <div className="relative inline-flex items-center justify-center">
        <svg
          width={dimension}
          height={dimension}
          viewBox={`0 0 ${dimension} ${dimension}`}
          className="transform -rotate-90 origin-center"
        >
          {/* Background Track Circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
            className="stroke-slate-100"
          />

          {/* Animated Foreground Progress Circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke={activeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 850ms cubic-bezier(0.4, 0, 0.2, 1), stroke 400ms ease',
            }}
          />
        </svg>

        {/* Center Score & Unit Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center select-none pointer-events-none">
          <div className="flex items-baseline">
            <span className={`${scoreFont} text-slate-900 tracking-tight`}>
              {animatedScore}
            </span>
            <span className="text-xs text-slate-400 font-semibold ml-0.5">
              /100
            </span>
          </div>
        </div>
      </div>

      {/* Label and Subtitle */}
      <div className="mt-2 space-y-0.5 max-w-[150px]">
        <p className={`${labelFont} text-slate-800 tracking-tight leading-tight`}>
          {label}
        </p>
        {subtitle && (
          <p className="text-[11px] text-slate-500 leading-tight">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

export default ScoreGauge;
