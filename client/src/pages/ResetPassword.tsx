import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../services/api/authApi';
import { AxiosError } from 'axios';
import type { ApiResponse } from '../types';

export const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  const [formErrors, setFormErrors] = useState<{
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isMissingParams = !token.trim() || !email.trim();

  const validate = (): boolean => {
    const errors: { newPassword?: string; confirmPassword?: string } = {};

    if (!formData.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters long';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Confirm password is required';
    } else if (formData.newPassword !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (apiError) {
      setApiError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isMissingParams || !validate()) return;

    setIsSubmitting(true);
    setApiError(null);

    try {
      await authApi.resetPassword({
        email: email.trim(),
        token: token.trim(),
        newPassword: formData.newPassword,
      });

      // Redirect to /login with success notification state
      navigate('/login', {
        replace: true,
        state: {
          resetSuccess:
            'Your password has been successfully reset! Please sign in with your new credentials.',
        },
      });
    } catch (err) {
      const axiosError = err as AxiosError<ApiResponse>;
      const message =
        axiosError.response?.data?.message ||
        axiosError.message ||
        'This password reset link is invalid or has expired. Please request a new one.';
      setApiError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 bg-[#090d16] text-white relative overflow-hidden">
      {/* Subtle Dot Texture Background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20 z-0"
        style={{
          backgroundImage:
            'radial-gradient(rgba(255, 255, 255, 0.25) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      {/* Ambient Glowing Orb */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] rounded-full bg-emerald-500/10 blur-[100px] pointer-events-none -z-0" />

      <div className="relative z-10 max-w-md w-full space-y-8 bg-slate-900/85 backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-2xl shadow-black/80 border border-white/15">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2 shadow-sm shadow-emerald-500/10">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Set new password</h2>
          <p className="text-sm text-slate-400">
            {email ? (
              <>Resetting password for <span className="font-semibold text-emerald-400">{email}</span></>
            ) : (
              'Enter and confirm your new secure password.'
            )}
          </p>
        </div>

        {/* Missing or Tampered URL Query Parameters Error */}
        {isMissingParams && (
          <div className="space-y-4 animate-in fade-in">
            <div className="bg-red-950/60 border border-red-500/30 p-4 rounded-xl text-red-200">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-red-200">
                  <p className="font-semibold">Invalid reset link</p>
                  <p className="mt-1 text-slate-300">
                    This password reset link appears incomplete or corrupted. Please request a new link.
                  </p>
                </div>
              </div>
            </div>

            <Link
              to="/forgot-password"
              className="w-full flex justify-center py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold transition-colors text-center shadow-lg shadow-emerald-500/20"
            >
              Request New Reset Link
            </Link>
          </div>
        )}

        {/* API Error Alert with link to re-request */}
        {!isMissingParams && apiError && (
          <div className="space-y-4 animate-in fade-in">
            <div className="bg-red-950/60 border border-red-500/30 p-4 rounded-xl text-red-200">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-red-200">
                  <p className="font-semibold">Reset Failed</p>
                  <p className="mt-1 text-slate-300">{apiError}</p>
                </div>
              </div>
            </div>

            <Link
              to="/forgot-password"
              className="w-full flex justify-center py-2.5 px-4 bg-slate-950/60 text-slate-300 border border-white/15 rounded-xl text-xs font-bold hover:bg-white/5 hover:text-white transition-colors text-center"
            >
              Request a New Reset Link
            </Link>
          </div>
        )}

        {/* Reset Form */}
        {!isMissingParams && (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
            <div className="space-y-4">
              {/* New Password Field */}
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-slate-200 mb-1">
                  New Password
                </label>
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  autoComplete="new-password"
                  value={formData.newPassword}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm text-white placeholder-slate-500 bg-slate-950/60 transition-colors focus:outline-none focus:ring-2 ${
                    formErrors.newPassword
                      ? 'border-red-400/80 focus:border-red-400 focus:ring-red-400/20'
                      : 'border-white/15 focus:border-emerald-400 focus:ring-emerald-400/20'
                  }`}
                  placeholder="At least 8 characters"
                />
                {formErrors.newPassword && (
                  <p className="mt-1.5 text-xs text-red-400 font-medium">{formErrors.newPassword}</p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-200 mb-1">
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm text-white placeholder-slate-500 bg-slate-950/60 transition-colors focus:outline-none focus:ring-2 ${
                    formErrors.confirmPassword
                      ? 'border-red-400/80 focus:border-red-400 focus:ring-red-400/20'
                      : 'border-white/15 focus:border-emerald-400 focus:ring-emerald-400/20'
                  }`}
                  placeholder="Re-type your new password"
                />
                {formErrors.confirmPassword && (
                  <p className="mt-1.5 text-xs text-red-400 font-medium">{formErrors.confirmPassword}</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center py-3 px-4 rounded-xl shadow-lg shadow-emerald-500/20 text-sm font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-slate-950"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Updating password...
                </>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>
        )}

        <div className="text-center pt-2">
          <p className="text-sm text-slate-400">
            Remembered your password?{' '}
            <Link
              to="/login"
              className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
