import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../services/api/authApi';
import { AxiosError } from 'axios';
import type { ApiResponse } from '../types';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [responseMessage, setResponseMessage] = useState<string>('');

  const validate = (): boolean => {
    if (!email.trim()) {
      setEmailError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError(null);
    return true;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (emailError) setEmailError(null);
    if (apiError) setApiError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setApiError(null);

    try {
      const res = await authApi.forgotPassword({ email: email.trim() });
      setResponseMessage(
        res.message ||
          'If an account exists with that email, a password reset link has been sent.'
      );
      setIsSubmitted(true);
    } catch (err) {
      const axiosError = err as AxiosError<ApiResponse>;
      let message =
        axiosError.response?.data?.message ||
        axiosError.message ||
        'Failed to process request. Please try again.';

      if (axiosError.code === 'ECONNABORTED' || axiosError.message?.includes('timeout')) {
        message = 'Request timed out. Please check your connection and try again.';
      }
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
        {isSubmitted ? (
          <div className="text-center space-y-6 animate-in fade-in">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2 ring-8 ring-emerald-500/5 shadow-sm shadow-emerald-500/10">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">Check your email</h2>
              <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                {responseMessage}
              </p>
              <div className="mt-4 p-4 bg-slate-950/60 border border-white/10 rounded-2xl text-xs text-slate-400 text-left space-y-1.5">
                <p className="font-semibold text-slate-200">Next steps:</p>
                <p>1. Open the reset link sent to <strong className="text-emerald-400 font-semibold">{email}</strong>.</p>
                <p>2. Choose your new password within <strong className="text-slate-200 font-semibold">15 minutes</strong>.</p>
                <p>3. If you don't see the email, check your spam or junk folder.</p>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsSubmitted(false);
                  setEmail('');
                }}
                className="w-full py-2.5 px-4 border border-white/15 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                Send to a different email
              </button>
              <Link
                to="/login"
                className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold transition-colors text-center shadow-lg shadow-emerald-500/20"
              >
                Back to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2 shadow-sm shadow-emerald-500/10">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                  />
                </svg>
              </div>
              <h2 className="text-3xl font-extrabold text-white tracking-tight">Forgot password?</h2>
              <p className="text-sm text-slate-400">
                No worries! Enter your account email and we'll send you instructions to reset your password.
              </p>
            </div>

            {/* API Error Alert */}
            {apiError && (
              <div className="bg-red-950/60 border border-red-500/30 p-4 rounded-xl text-red-200">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-sm text-red-200 font-medium">{apiError}</p>
                </div>
              </div>
            )}

            <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-200 mb-1">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm text-white placeholder-slate-500 bg-slate-950/60 transition-colors focus:outline-none focus:ring-2 ${
                    emailError
                      ? 'border-red-400/80 focus:border-red-400 focus:ring-red-400/20'
                      : 'border-white/15 focus:border-emerald-400 focus:ring-emerald-400/20'
                  }`}
                  placeholder="you@example.com"
                />
                {emailError && (
                  <p className="mt-1.5 text-xs text-red-400 font-medium">{emailError}</p>
                )}
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
                    Sending reset link...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </form>

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
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
