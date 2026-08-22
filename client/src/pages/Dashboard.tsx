import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import resumeApi from '../services/api/resumeApi';
import analysisApi from '../services/api/analysisApi';
import { ScoreGauge, getScoreBadgeClasses } from '../components/ScoreGauge';
import type { Resume, Analysis } from '../types';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [resRes, anaRes] = await Promise.all([
          resumeApi.listResumes().catch(() => ({ data: { resumes: [] } })),
          analysisApi.listAnalyses().catch(() => ({ data: { analyses: [] } })),
        ]);
        setResumes(resRes.data?.resumes || []);
        setAnalyses(anaRes.data?.analyses || []);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const latestAnalysis = analyses.length > 0 ? analyses[0] : null;

  return (
    <div className="flex-1 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50/40 via-slate-50 to-slate-50 min-h-[calc(100vh-4rem)] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-8">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 rounded-3xl p-6 sm:p-10 text-white shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="space-y-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/20 backdrop-blur-sm">
                AI Resume Intelligence
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Welcome back, {user?.name}!
              </h1>
              <p className="text-blue-100 text-sm">
                Logged in as <span className="font-medium text-white">{user?.email}</span>
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link
                to="/upload"
                className="inline-flex items-center justify-center px-5 py-3 rounded-2xl bg-white text-blue-700 font-bold text-sm shadow-md hover:bg-blue-50 transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-white/25 w-full sm:w-auto"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Upload Resume
              </Link>
              <Link
                to="/job-match"
                className="inline-flex items-center justify-center px-5 py-3 rounded-2xl bg-purple-900/40 text-white border border-white/30 font-bold text-sm backdrop-blur-sm hover:bg-purple-900/60 transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/20 w-full sm:w-auto"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Target a Job
              </Link>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Latest Overall Score Gauge */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-indigo-200 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Latest Overall Score
              </span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100/80 flex items-center justify-center shadow-3xs">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            {isLoading ? (
              <div className="h-24 bg-slate-100 rounded-2xl animate-pulse my-1" />
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
          </div>

          {/* Latest ATS Score Gauge */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-purple-200 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Latest ATS Score
              </span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 border border-purple-100/80 flex items-center justify-center shadow-3xs">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            {isLoading ? (
              <div className="h-24 bg-slate-100 rounded-2xl animate-pulse my-1" />
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
          </div>

          {/* Total Resumes (Metric Card) */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-indigo-200 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Total Resumes
              </span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100/80 flex items-center justify-center shadow-3xs">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <div className="my-3">
              {isLoading ? (
                <div className="h-8 bg-slate-100 rounded-lg animate-pulse w-16 my-1" />
              ) : (
                <p className="text-4xl font-extrabold text-slate-900 tracking-tight">
                  {resumes.length}
                </p>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {resumes.length === 1 ? '1 active resume file' : `${resumes.length} active resume files`}
            </p>
          </div>

          {/* Total Analyses (Metric Card) */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-purple-200 transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Total Analyses
              </span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 border border-purple-100/80 flex items-center justify-center shadow-3xs">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <div className="my-3">
              {isLoading ? (
                <div className="h-8 bg-slate-100 rounded-lg animate-pulse w-16 my-1" />
              ) : (
                <p className="text-4xl font-extrabold text-slate-900 tracking-tight">
                  {analyses.length}
                </p>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {analyses.length === 1 ? '1 generated report' : `${analyses.length} generated reports`}
            </p>
          </div>
        </div>

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
              <div className="space-y-3 animate-pulse">
                <div className="h-16 bg-slate-100 rounded-2xl" />
                <div className="h-16 bg-slate-100 rounded-2xl" />
              </div>
            ) : analyses.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                <p className="text-xs text-slate-600 font-medium">No analysis reports generated yet.</p>
                <Link
                  to="/job-match"
                  className="inline-flex items-center px-4 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-700 transition-colors"
                >
                  Run First Analysis
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {analyses.slice(0, 4).map((item) => {
                  const resName =
                    typeof item.resumeId === 'object' && item.resumeId?.originalFileName
                      ? item.resumeId.originalFileName
                      : 'Resume';
                  const jobTitle =
                    typeof item.jobDescriptionId === 'object' && item.jobDescriptionId?.title
                      ? item.jobDescriptionId.title
                      : null;

                  return (
                    <div key={item._id} className="py-3.5 flex items-center justify-between">
                      <div className="flex items-center space-x-3 truncate mr-2">
                        {/* Dynamic Multi-Tier Score Badge (Consistent with ScoreGauge) */}
                        <div
                          className={`w-10 h-10 rounded-xl font-extrabold text-xs flex items-center justify-center flex-shrink-0 border shadow-3xs ${getScoreBadgeClasses(
                            item.overallScore
                          )}`}
                        >
                          {item.overallScore}
                        </div>
                        <div className="truncate">
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
                        className="text-xs font-bold text-purple-600 hover:bg-purple-50 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
                      >
                        View &rarr;
                      </Link>
                    </div>
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
              <div className="space-y-3 animate-pulse">
                <div className="h-16 bg-slate-100 rounded-2xl" />
                <div className="h-16 bg-slate-100 rounded-2xl" />
              </div>
            ) : resumes.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                <p className="text-xs text-slate-600 font-medium">No resumes uploaded yet.</p>
                <Link
                  to="/upload"
                  className="inline-flex items-center px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors"
                >
                  Upload Resume
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {resumes.slice(0, 4).map((item) => (
                  <div key={item._id} className="py-3.5 flex items-center justify-between">
                    <div className="flex items-center space-x-3 truncate mr-2">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center flex-shrink-0 border border-indigo-100/80">
                        {item.fileType.toUpperCase()}
                      </div>
                      <div className="truncate">
                        <Link
                          to={`/resumes/${item._id}`}
                          className="text-xs font-bold text-slate-900 hover:text-blue-600 transition-colors truncate block"
                        >
                          {item.originalFileName}
                        </Link>
                        <p className="text-[11px] text-slate-500">
                          {item.parsedSections?.skills?.length || 0} skills &middot; {new Date(item.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/resumes/${item._id}`}
                        className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
                      >
                        Inspect
                      </Link>
                    </div>
                  </div>
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
