import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import resumeApi from '../services/api/resumeApi';
import analysisApi from '../services/api/analysisApi';
import AnalyzeModal from '../components/AnalyzeModal';
import type { Resume, Analysis } from '../types';

export const History: React.FC = () => {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal states
  const [resumeToDelete, setResumeToDelete] = useState<Resume | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [resumeToAnalyze, setResumeToAnalyze] = useState<Resume | null>(null);

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [resRes, anaRes] = await Promise.all([
        resumeApi.listResumes(),
        analysisApi.listAnalyses().catch(() => ({ data: { analyses: [] } })),
      ]);
      setResumes(resRes.data?.resumes || []);
      setAnalyses(anaRes.data?.analyses || []);
    } catch (err) {
      setErrorMessage('Failed to load resume history. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const confirmDelete = async () => {
    if (!resumeToDelete) return;
    setIsDeleting(true);
    try {
      await resumeApi.deleteResume(resumeToDelete._id);
      setResumes((prev) => prev.filter((r) => r._id !== resumeToDelete._id));
      setResumeToDelete(null);
    } catch (err) {
      alert('Failed to delete resume. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Find latest analysis for a given resume
  const getLatestAnalysisForResume = (resumeId: string) => {
    return analyses.find((a) => {
      const id = typeof a.resumeId === 'object' ? a.resumeId._id : a.resumeId;
      return id === resumeId;
    });
  };

  return (
    <div className="flex-1 bg-[#F4F7FC] min-h-[calc(100vh-4rem)] py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-8">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Resume History</h1>
            <p className="text-slate-600 text-sm mt-1">
              Manage your uploaded resumes, inspect extracted skills, and track ATS optimizations.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/job-match"
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 font-semibold text-xs hover:bg-purple-100 transition-all"
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Target a Job
            </Link>
            <Link
              to="/upload"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all w-full sm:w-auto"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Upload Resume
            </Link>
          </div>
        </div>

        {/* Error alert */}
        {errorMessage && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex items-center justify-between">
            <p className="text-sm text-red-700 font-medium">{errorMessage}</p>
            <button
              onClick={fetchHistory}
              className="text-xs font-semibold text-red-700 hover:underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="h-8 skeleton-shimmer rounded-xl w-48 mb-2" />
            <div className="space-y-3">
              <div className="h-16 skeleton-shimmer rounded-2xl" />
              <div className="h-16 skeleton-shimmer rounded-2xl" />
              <div className="h-16 skeleton-shimmer rounded-2xl" />
            </div>
          </div>
        ) : resumes.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg mx-auto space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900">No resumes uploaded yet</h3>
            <p className="text-sm text-slate-600">
              Upload your first resume in PDF or DOCX format to receive automated ATS section parsing and AI analysis.
            </p>
            <div className="pt-2">
              <Link
                to="/upload"
                className="inline-flex items-center px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 active:scale-[0.97] transition-all shadow-sm"
              >
                Upload Your First Resume
              </Link>
            </div>
          </div>
        ) : (
          /* Resumes List Table / Grid */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-[#F8FAFD]">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Resume / File
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Format
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                      AI Analysis Status
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Uploaded
                    </th>
                    <th className="px-6 py-3.5 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {resumes.map((item, index) => {
                    const latestAnalysis = getLatestAnalysisForResume(item._id);

                    return (
                      <motion.tr
                        key={item._id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.3), ease: 'easeOut' }}
                        className="hover:bg-[#F8FAFD] transition-colors"
                      >
                      {/* Filename & Link */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                            {item.fileType === 'pdf' ? (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            )}
                          </div>
                          <Link
                            to={`/resumes/${item._id}`}
                            className="text-sm font-semibold text-slate-900 hover:text-blue-600 truncate max-w-xs transition-colors"
                          >
                            {item.originalFileName}
                          </Link>
                        </div>
                      </td>

                      {/* Format Badge */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                          {item.fileType}
                        </span>
                      </td>

                      {/* AI Analysis Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {latestAnalysis ? (
                          <Link
                            to={`/analysis/${latestAnalysis._id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                          >
                            <span>✓ Score: {latestAnalysis.overallScore}/100</span>
                            <span className="text-[10px] text-emerald-600 font-semibold">(View Analysis)</span>
                          </Link>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setResumeToAnalyze(item)}
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors"
                          >
                            ⚡ Run AI Analysis
                          </button>
                        )}
                      </td>

                      {/* Upload Date */}
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-medium space-x-2">
                        <button
                          type="button"
                          onClick={() => setResumeToAnalyze(item)}
                          className="inline-flex items-center px-2.5 py-1.5 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors font-bold"
                        >
                          ⚡ Analyze
                        </button>
                        <Link
                          to={`/resumes/${item._id}`}
                          className="inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                        >
                          Inspect
                        </Link>
                        {item.fileUrl && (
                          <a
                            href={item.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            Download
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => setResumeToDelete(item)}
                          className="inline-flex items-center px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Analyze Modal */}
      {resumeToAnalyze && (
        <AnalyzeModal
          resumeId={resumeToAnalyze._id}
          resumeFileName={resumeToAnalyze.originalFileName}
          isOpen={true}
          onClose={() => setResumeToAnalyze(null)}
        />
      )}

      {/* Delete Modal */}
      {resumeToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Delete Resume</h3>
              <p className="text-sm text-slate-600 mt-1">
                Are you sure you want to delete <span className="font-semibold text-slate-800">{resumeToDelete.originalFileName}</span>?
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setResumeToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-red-600 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default History;
