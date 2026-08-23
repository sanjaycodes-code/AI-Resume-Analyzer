import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FileDropzone from '../components/FileDropzone';
import resumeApi from '../services/api/resumeApi';
import { AxiosError } from 'axios';
import type { ApiResponse } from '../types';

export const UploadResume: React.FC = () => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setErrorMessage(null);
    setUploadProgress(0);
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setErrorMessage(null);
    setUploadProgress(0);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || isUploading) return;

    setIsUploading(true);
    setErrorMessage(null);
    setUploadProgress(0);

    try {
      const response = await resumeApi.uploadResume(selectedFile, (percent) => {
        setUploadProgress(percent);
      });

      const newResumeId = response.data?.resume?._id;
      if (newResumeId) {
        navigate(`/resumes/${newResumeId}`);
      } else {
        navigate('/history');
      }
    } catch (err) {
      const axiosError = err as AxiosError<ApiResponse>;
      const message =
        axiosError.response?.data?.message ||
        axiosError.message ||
        'Failed to upload resume. Please try again.';
      setErrorMessage(message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex-1 bg-[#F4F7FC] min-h-[calc(100vh-4rem)] py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Title Section */}
        <div className="mb-8 text-center sm:text-left">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Upload Resume</h1>
          <p className="text-slate-600 text-sm mt-1">
            Upload your resume in PDF or DOCX format for instant text extraction and heuristic section segmentation.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-8">
          {/* Dropzone Component */}
          <FileDropzone
            onFileSelect={handleFileSelect}
            selectedFile={selectedFile}
            onClearFile={handleClearFile}
            isUploading={isUploading}
            uploadProgress={uploadProgress}
            errorMessage={errorMessage}
          />

          {/* Upload Action */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate('/history')}
              disabled={isUploading}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              View Upload History
            </button>
            <button
              type="button"
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-500/20 transition-all"
            >
              {isUploading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing Resume...
                </>
              ) : (
                'Upload & Parse Resume'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadResume;
