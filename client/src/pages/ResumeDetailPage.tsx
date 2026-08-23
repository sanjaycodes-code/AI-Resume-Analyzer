import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import resumeApi from '../services/api/resumeApi';
import AnalyzeModal from '../components/AnalyzeModal';
import type { Resume } from '../types';

export const ResumeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [resume, setResume] = useState<Resume | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAnalyzeModal, setShowAnalyzeModal] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchResume = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const response = await resumeApi.getResume(id);
        if (response.data?.resume) {
          setResume(response.data.resume);
        } else {
          setErrorMessage('Resume not found.');
        }
      } catch (err) {
        setErrorMessage('Failed to load resume details. It may have been deleted or access is forbidden.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchResume();
  }, [id]);

  const handleDelete = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await resumeApi.deleteResume(id);
      navigate('/history');
    } catch (err) {
      setErrorMessage('Failed to delete resume. Please try again.');
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm font-medium text-slate-600">Loading resume analysis & parsed sections...</p>
      </div>
    );
  }

  if (errorMessage || !resume) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Unable to load resume</h2>
        <p className="text-slate-600 text-sm max-w-md mx-auto">{errorMessage}</p>
        <Link
          to="/history"
          className="inline-flex items-center px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors"
        >
          &larr; Back to Resume History
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full max-w-full space-y-8 overflow-hidden">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm max-w-full overflow-hidden">
        <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="text-base sm:text-xl font-bold text-slate-900 truncate min-w-0 flex-1">
                {resume.originalFileName}
              </h1>
              <span className="text-[10px] sm:text-xs font-semibold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 flex-shrink-0">
                {resume.fileType}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 truncate">
              Uploaded on {new Date(resume.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2 sm:gap-2.5 flex-shrink-0">
          {/* Analyze with AI Button */}
          <button
            type="button"
            onClick={() => setShowAnalyzeModal(true)}
            className="inline-flex items-center px-3.5 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-md shadow-blue-500/20 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] transition-all"
          >
            <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            ⚡ Analyze with AI
          </button>

          {resume.fileUrl ? (
            <a
              href={resume.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 active:scale-[0.98] transition-colors"
            >
              <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              View File
            </a>
          ) : (
            <span
              className="inline-flex items-center px-2.5 py-1.5 rounded-xl bg-slate-100 text-slate-500 text-[11px] font-medium border border-slate-200"
              title="Raw file purged after 48h ephemeral retention. Parsed sections & text are fully preserved."
            >
              📁 File purged (&gt;48h)
            </span>
          )}
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center px-3 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 font-semibold text-xs active:scale-[0.98] transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Parsed Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Parsed Sections */}
        <div className="lg:col-span-2 space-y-6">
          {/* Skills Section */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                Extracted Skills ({resume.parsedSections?.skills?.length || 0})
              </h2>
            </div>
            {resume.parsedSections?.skills && resume.parsedSections.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {resume.parsedSections.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 shadow-xs"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No specific skills header identified in text.</p>
            )}
          </div>

          {/* Work Experience Section */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
              Work Experience & Positions of Responsibility ({resume.parsedSections?.experience?.length || 0})
            </h2>
            {resume.parsedSections?.experience && resume.parsedSections.experience.length > 0 ? (
              <div className="space-y-3">
                {resume.parsedSections.experience.map((exp, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-800 whitespace-pre-line leading-relaxed"
                  >
                    {String(exp.content || JSON.stringify(exp))}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No experience blocks found.</p>
            )}
          </div>

          {/* Education & Projects Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Education */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                Education ({resume.parsedSections?.education?.length || 0})
              </h2>
              {resume.parsedSections?.education && resume.parsedSections.education.length > 0 ? (
                <div className="space-y-2.5">
                  {resume.parsedSections.education.map((edu, index) => (
                    <div
                      key={index}
                      className="p-3.5 rounded-xl bg-purple-50/50 border border-purple-100 text-xs text-slate-800 font-medium leading-relaxed"
                    >
                      {String(edu.content || JSON.stringify(edu))}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No education blocks found.</p>
              )}
            </div>

            {/* Projects */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                Projects ({resume.parsedSections?.projects?.length || 0})
              </h2>
              {resume.parsedSections?.projects && resume.parsedSections.projects.length > 0 ? (
                <div className="space-y-2.5">
                  {resume.parsedSections.projects.map((proj, index) => (
                    <div
                      key={index}
                      className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-100 text-xs text-slate-800 leading-relaxed"
                    >
                      {String(proj.content || JSON.stringify(proj))}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No projects blocks found.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Full Extracted Plain Text */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 h-fit">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Extracted Plain Text</h2>
            <span className="text-xs text-slate-500 font-mono">
              {resume.extractedText?.length || 0} chars
            </span>
          </div>
          <div className="max-h-[500px] overflow-y-auto p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs leading-relaxed whitespace-pre-wrap">
            {resume.extractedText || 'No extracted text available.'}
          </div>
        </div>
      </div>

      {/* Analyze Modal */}
      <AnalyzeModal
        resumeId={resume._id}
        resumeFileName={resume.originalFileName}
        isOpen={showAnalyzeModal}
        onClose={() => setShowAnalyzeModal(false)}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
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
                Are you sure you want to delete <span className="font-semibold text-slate-800">{resume.originalFileName}</span>? This action cannot be undone and will remove all associated parsing data.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-red-600 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeDetailPage;
